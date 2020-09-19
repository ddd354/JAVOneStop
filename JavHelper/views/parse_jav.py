# -*- coding:utf-8 -*-
from flask import Blueprint, jsonify, request, Response
import requests
from lxml import html
from traceback import print_exc
import json
from blitzdb.document import DoesNotExist

from JavHelper.cache import cache
from JavHelper.core.ini_file import return_default_config_string
from JavHelper.core import JAVNotFoundException
from JavHelper.core.javlibrary import JavLibraryScraper
from JavHelper.core.javbus import JavBusScraper, javbus_magnet_search
from JavHelper.core.javdb import JavDBScraper
from JavHelper.core.arzon import ArzonScraper
from JavHelper.core.jav777 import jav777_download_search
from JavHelper.core.jav321 import Jav321Scraper
from JavHelper.core.file_scanner import EmbyFileStructure
from JavHelper.core.utils import parsed_size_to_int

if return_default_config_string('db_type') == 'sqlite':
    from JavHelper.model.jav_manager import SqliteJavManagerDB as JavManagerDB
else:
    from JavHelper.model.jav_manager import BlitzJavManagerDB as JavManagerDB


parse_jav = Blueprint('parse_jav', __name__, url_prefix='/parse_jav')
SOURCES_MAP = {
    'javlibrary': JavLibraryScraper,
    'arzon': ArzonScraper,
    'javbus': JavBusScraper,
    'javdb': JavDBScraper,
    'jav321': Jav321Scraper
}


@parse_jav.route('/parse_emby_folder', methods=['GET'])
def parse_emby_folder():
    path = request.args.get('path')
    sources = request.args.get('sources')

    # verify sources
    if not sources:
        sources = return_default_config_string('jav_obj_priority').split(',')
    else:
        sources = str(sources).split(',')

    emby_folder = EmbyFileStructure(path)
    # scan folder
    emby_folder.scan_emby_root_path()

    processed = []

    for each_jav in emby_folder.file_list:
        # scrape
        jav_obj = parse_single_jav(each_jav, sources)

        # file structure operations
        # write images
        emby_folder.write_images(jav_obj)
        # write nfo
        emby_folder.write_nfo(jav_obj)
        processed.append(each_jav['car'])

    return jsonify({'success': processed})


@parse_jav.route('/parse_unprocessed_folder', methods=['GET'])
def parse_unprocessed_folder():
    path = request.args.get('path')
    sources = request.args.get('sources')

    # verify sources
    if not sources:
        sources = return_default_config_string('jav_obj_priority').split(',')
    else:
        sources = str(sources).split(',')

    emby_folder = EmbyFileStructure(path)
    # scan folder
    emby_folder.scan_new_root_path()

    processed = []
    total = len(emby_folder.file_list)
    #print(emby_folder.file_list)

    def long_process():
        yield json.dumps({'log': 'start bulk jav parses for {} items'.format(len(emby_folder.file_list))}) + '\n'
        for each_jav in emby_folder.file_list:
            # scrape
            jav_obj = parse_single_jav(each_jav, sources)

            # handle error when all sources fail
            if jav_obj.get('errors') and isinstance(jav_obj['errors'], list) and len(jav_obj['errors']) == len(sources):
                processed.append(each_jav['car'])
                yield json.dumps({'log': '{} process failed, cannot find any info in all sources {}, {} to go'.format(
                    each_jav['car'], sources, total - len(processed)
                )})+'\n'
                continue
            elif jav_obj.get('error') and isinstance(jav_obj['error'], str):
                # handle one of the source is not valid
                processed.append(each_jav['car'])
                yield json.dumps({'log': '{} process failed, one of the source within {} is not valid on {}'.format(
                    each_jav['car'], sources, jav_obj['error']
                )})+'\n'
                continue

            # file structure operations
            try:
                jav_obj = emby_folder.create_new_folder(jav_obj)
            except KeyError as e:
                _car = each_jav.get('car', 'Unknown')
                yield json.dumps({'log': f'error: {e}, skipping {_car}'})+'\n'
                continue
            # write images
            emby_folder.write_images(jav_obj)
            # write nfo
            emby_folder.write_nfo(jav_obj)
             # move video file
            jav_obj = emby_folder.put_processed_file(jav_obj)
            
            processed.append(each_jav['car'])

            yield json.dumps({'log': '{} processed, {} to go'.format(
                each_jav['car'], total - len(processed)
            )})+'\n'
        yield json.dumps({'log': 'jav parse finishes'})+'\n'

    return Response(long_process(), mimetype='text/event-stream')


@parse_jav.route('/parse_single', methods=['GET'])
@cache.cached(timeout=3600, query_string=True)
def parse_single():
    car = request.args.get('car')
    sources = request.args.get('sources')
    if not car:
        return jsonify({'error': 'cannot find car from request'}), 400

    # verify sources
    if not sources:
        sources = return_default_config_string('jav_obj_priority').split(',')
    else:
        sources = str(sources).split(',')

    res = parse_single_jav({'car': car}, sources)
    #import ipdb; ipdb.set_trace()
    return jsonify({'car': car, 'sources': sources, 'parsed_output': res})


@parse_jav.route('/search_magnet_link', methods=['GET'])
@cache.cached(timeout=3600, query_string=True)
def search_magnet_link():
    car = request.args.get('car')
    source = request.args.get('source')
    print(f'>>>> accessing {car} - {source}')

    source_func_map = {
        'overall': priority_download_search,
        'ikoa_dmmc': search_ikoa_dmmc,
        'torrentkitty': search_torrentkitty_magnet,
        'nyaa': search_nyaa_magnet,
        'javbus': search_javbus_magnet,
        'jav777': jav777_download_search
    }
    
    rt = source_func_map[source](car)
    rt = custom_magnet_sorting(rt)
    
    if len(rt) > 0:
        return jsonify({'success': rt})
    else:
        return jsonify({'error': 'no magnet link found'})


# ---------------------------utilities-------------------------------

def need_ikoa_credit(car: str):
    try:
        db = JavManagerDB()
        need = db.get_by_pk(car.upper()).get('need_ikoa_credit', '0')=="1"
        print(f'need ikoa credit: {need}')
        return need
    except DoesNotExist as e:
        # for any other error we return False
        return False
    except Exception as e:
        # for any other error we return False
        return False

def search_ikoa_dmmc(car: str):
    # prototype
    server_addr = return_default_config_string('ikoa_dmmc_server')
    res = requests.get(server_addr+'lookup?id={}'.format(car), timeout=120)
    #print(res.text)
    rt = []
    sources = res.json()['success']['sources']
    if 'ikoa' in sources and not need_ikoa_credit(car):
        rt.append({'title': f'ikoa - {car}', 'car': car, 'idmm': f'{server_addr}download?id={car}&source=ikoa', 'size': '-', 'size_sort': '-'})
    if 'dmmc' in sources:
        rt.append({'title': f'dmmc - {car}', 'car': car, 'idmm': f'{server_addr}download?id={car}&source=dmmc', 'size': '-', 'size_sort': '-'})
    return rt


def priority_download_search(car: str):
    search_list = [
        search_ikoa_dmmc,
        jav777_download_search,
        search_javbus_magnet,
        search_nyaa_magnet,
        search_torrentkitty_magnet
    ]

    for search_function in search_list:
        try:
            rt = search_function(car)
            if rt:
                return rt
        except Exception as e:
            #print(search_function, e)
            pass  # if not found just run the next one
    
    return []

def custom_magnet_sorting(magnet_list: list):
    # sort based on size
    try:
        magnet_list.sort(key=lambda x: x['size_sort'])
    except KeyError:
        magnet_list.sort(key=lambda x: x['size'])

    # put subtitled first
    _rt = []
    subtitled_strings = return_default_config_string('subtitle_filename_postfix').split(',')
    while magnet_list:
        _current = magnet_list.pop()
        if any([x in _current.get('title', '') for x in subtitled_strings]):
            _rt = [_current] + _rt
        else:
            # append to return list if it is not subtitled
            _rt.append(_current)

    return _rt

def search_javbus_magnet(car: str):
    try:
        rt = javbus_magnet_search(car)
    except Exception:
        print_exc()
        rt = []

    return rt

def search_nyaa_magnet(car: str):
    rt = []
    try:
        respBT = requests.get('https://sukebei.nyaa.si/?f=0&c=0_0&q=' + car)
        BTTree = html.fromstring(respBT.content)
        bt_xpath = '//*/tbody/tr/td[@class="text-center"]/a[2]/@href'
        if len(BTTree.xpath(bt_xpath)) > 0:
            print(f'{car} found in nyaa')
            name_xpath = '//*/tbody/tr/td[@colspan="2"]/a'
            titles = [ind.get('title', '')[0:25] for ind in BTTree.xpath(name_xpath)]

            file_xpath = '//*/tbody/tr/td'
            file_sizes = [ind.text for ind in BTTree.xpath(file_xpath) if 'GiB' in ind.text or 'Bytes' in ind.text
                          or 'MiB' in ind.text]
            magnets = BTTree.xpath(bt_xpath)

            for i in range(len(titles)):
                rt.append({'title': titles[i], 'size': file_sizes[i], 'magnet': magnets[i], 
                'car': car, 'size_sort': parsed_size_to_int(file_sizes[i])})
    except Exception:
        print_exc()
        pass

    return rt

def search_torrentkitty_magnet(car: str):
    rt = []
    try:
        # torrent kitty is good for chinese subtitled movies
        respBT = requests.get('https://www.torrentkitty.tv/search/' + car)
        BTTree = html.fromstring(respBT.content)
        bt_xpath = '//html/body//table[@id="archiveResult"]//td[@class="action"]/a[2]/@href'
        if len(BTTree.xpath(bt_xpath)) > 0:
            print(f'{car} found in torrentkitty')
            name_xpath = '//html/body//table[@id="archiveResult"]//td[@class="name"]'
            titles = [ind.text_content()[0:25] for ind in BTTree.xpath(name_xpath)]

            file_xpath = '//html/body//table[@id="archiveResult"]//td[@class="size"]/text()'
            file_sizes = [ind for ind in BTTree.xpath(file_xpath)]
            magnets = BTTree.xpath(bt_xpath)
            
            for i in range(len(titles)):
                rt.append({'title': titles[i], 'size': file_sizes[i], 'magnet': magnets[i], 
                'car': car, 'size_sort': parsed_size_to_int(file_sizes[i])})
    except Exception as e:
        print_exc()
        pass

    return rt


def parse_single_jav(jav_obj: dict, sources):
    for scrape in sources:
        if scrape not in SOURCES_MAP:
            return {'error': f'{scrape} is not a valid source'}

    for scrape in sources[::-1]:  # scrape low priority sources first
        try:
            scraped_info = SOURCES_MAP[scrape]({'car': jav_obj['car']}).scrape_jav()
        except Exception as e:
            errors = (jav_obj.get('errors') or [])
            errors.append(
                '{} cannot be found in {}'.format(jav_obj['car'], scrape)
            )
            scraped_info = {'errors': errors}
            print(scraped_info, e)
        jav_obj.update(scraped_info)
        # also save it separate key
        jav_obj[scrape] = scraped_info

    return jav_obj
