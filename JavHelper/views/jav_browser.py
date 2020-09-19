# -*- coding:utf-8 -*-
from flask import Blueprint, jsonify, request, Response
import json
from blitzdb.document import DoesNotExist
import requests
from lxml import html
from traceback import print_exc
from functools import partial

from JavHelper.cache import cache
from JavHelper.core.local_db import local_set_page, local_multi_search
from JavHelper.core.jav321 import jav321_set_page, jav321_search
from JavHelper.core.javbus import javbus_set_page, javbus_search
from JavHelper.core.javlibrary import javlib_set_page, javlib_search
from JavHelper.core.javdb import javdb_set_page, javdb_search
from JavHelper.core.jav777 import jav777_set_page
from JavHelper.core.OOF_downloader import OOFDownloader
from JavHelper.core.backend_translation import BackendTranslation
from JavHelper.core.aria2_handler import verify_aria2_configs_exist
from JavHelper.core.ini_file import return_default_config_string

if return_default_config_string('db_type') == 'sqlite':
    from JavHelper.model.jav_manager import SqliteJavManagerDB as JavManagerDB
else:
    from JavHelper.model.jav_manager import BlitzJavManagerDB as JavManagerDB


# support for all jav scrape library
jav_browser = Blueprint('jav_browser', __name__, url_prefix='/jav_browser')

# library map
LIB_MAP = {
    'local': {
        'set_func': local_set_page,
        'supported_set': {
            'still_wanted': 'stat=0&page={page_num}',
            'still_downloading': 'stat=4&page={page_num}',
            'iceboxed': 'stat=5&page={page_num}',
        }
    },
    'javlibrary': {
        'set_func': javlib_set_page,
        'search_func': javlib_search,
        'supported_set': {
            'most_wanted': 'vl_mostwanted.php?&mode=&page={page_num}',
            'best_rated': 'vl_bestrated.php?&mode=&page={page_num}',
            'trending_updates': 'vl_update.php?&mode=&page={page_num}',
        }
    },
    'javbus': {
        'set_func': javbus_set_page,
        'search_func': javbus_search,
        'supported_set': {
            'trending_updates': 'page/{page_num}',
            'subtitled': 'genre/sub/{page_num}',
        }
    },
    'javdb': {
        'set_func': javdb_set_page,
        'search_func': javdb_search,
        'supported_set': {
            'trending_updates': '?page={page_num}',
            'subtitled': '?page={page_num}&vft=2',
            'daily_rank': 'rankings/video_censored?period=daily',
            'weekly_rank': 'rankings/video_censored?period=weekly',
            'monthly_rank': 'rankings/video_censored?period=monthly',
        }
    },
    'jav777': {
        'set_func': jav777_set_page,
        'search_func': javbus_search,  # use javbus search instead
        'supported_set': {
            'trending_updates': 'page/{page_num}',
        }
    },
    'jav321': {
        'set_func': jav321_set_page,
        'search_func': jav321_search,
        'supported_set': {
            'trending_updates': 'type/1/{page_num}',
            'hot_downloads': 'list/hot_download/{page_num}',
            'new_release': 'list/release_date/{page_num}'
        }
    }
}

# back fill local search func
LIB_MAP['local']['search_func'] = partial(local_multi_search, [LIB_MAP[lib]['search_func'] for lib in list(LIB_MAP.keys()) if lib != 'local'])


@jav_browser.route('/get_set_javs', methods=['GET'])
def get_set_javs():
    lib_type = request.args.get('lib_type')
    set_type = request.args.get('set_type')
    page_num = request.args.get('page_num', 1)

    # check lib type exists
    if lib_type not in LIB_MAP:
        return jsonify({'error': f'{lib_type} is not a supported jav library'}), 400
    else:
        _set_map = LIB_MAP[lib_type]['supported_set']
        _search_func = LIB_MAP[lib_type].get('search_func')
        _set_func = LIB_MAP[lib_type]['set_func']

    # optional search string
    search_string = request.args.get('search_string', '')
    _dedupe_car_list = []
    rt_jav_objs = []

    if not search_string:
        # parse set without search string
        # verify set type
        if set_type not in _set_map:
            set_type = list(_set_map)[0]

        jav_objs, max_page = _set_func(_set_map[set_type], page_num)
    else:
        # search by supplied string
        jav_objs, max_page = _search_func(set_type, search_string, page_num)
        
    
    for jav_obj in jav_objs:
        if jav_obj['car'] not in _dedupe_car_list:
            _dedupe_car_list.append(jav_obj['car'])
            rt_jav_objs.append(jav_obj)

    # looooop through DB
    db_conn = JavManagerDB()
    for jav_obj in rt_jav_objs:
        if db_conn.pk_exist(str(jav_obj.get('car'))):
            # we cannot use img stored in db if it was from javdb due to
            # dynamically verified id
            db_obj = dict( db_conn.get_by_pk(str(jav_obj.get('car'))) )
            if db_obj.get('img') and 'jdbimgs' in db_obj['img']:
                db_obj.pop('img')
            
            jav_obj.update(db_obj)
        else:
            jav_obj['stat'] = 2
            db_conn.upcreate_jav(jav_obj)

    return jsonify({'success': {'jav_objs': rt_jav_objs, 'max_page': max_page}})

@jav_browser.route('/search_magnet_link', methods=['GET'])
@cache.cached(timeout=3600, query_string=True)
def search_magnet_link():
    car = request.args.get('car')

    rt = []
    # check whether magnet is available
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
                rt.append({'title': titles[i], 'size': file_sizes[i], 'magnet': magnets[i], 'car': car})
            return jsonify({'success': rt[:10]})
    except Exception as e:
        print_exc()
        pass

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
                rt.append({'title': titles[i], 'size': file_sizes[i], 'magnet': magnets[i], 'car': car})
            return jsonify({'success': rt[:10]})
    except Exception:
        pass

    return jsonify({'error': f'{car} not found in all sources'})


@jav_browser.route('/update_db_jav', methods=['POST'])
def update_db_jav():
    req_data = json.loads(request.get_data() or '{}')
    jav_pk = req_data.get('pk')
    update_data = req_data.get('data')

    if not jav_pk:
        return jsonify({'error': 'no pk found in posted json'}), 400

    db_conn = JavManagerDB()
    try:
        current_jav_obj = dict(db_conn.get_by_pk(jav_pk))
    except (DoesNotExist, TypeError) as e:
        # typeerror to catch dict(None)
        current_jav_obj = {'car': jav_pk}

    current_jav_obj.update(update_data)
    db_conn.upcreate_jav(current_jav_obj)

    return jsonify({'success': dict(current_jav_obj)})

@jav_browser.route('/oof_quota', methods=['GET'])
def oof_quota():
    try:
        return jsonify({'success': OOFDownloader().check_quota()})
    except FileNotFoundError:
        return jsonify({'error': BackendTranslation()['oof_cookies_not_found']}), 500

    

@jav_browser.route('/download_via_aria', methods=['POST'])
def download_via_aria():
    req_data = json.loads(request.get_data() or '{}')
    car = req_data.get('car')
    magnet = req_data.get('magnet')

    if not car or not magnet:
        return jsonify({'error': 'required fields are not found in posted json'}), 400

    oof_downloader = OOFDownloader()

    jav_obj = oof_downloader.handle_jav_download(car, magnet)
    if not jav_obj.get('error'):
        return jsonify({'success': jav_obj})
    else:
        return jsonify({'error': jav_obj.get('error')}), 400

@jav_browser.route('/diagnose_downloader_setup', methods=['GET'])
def diagnose_downloader_setup():
    error_list = {}
    try:
        OOFDownloader()
    except FileNotFoundError:
        error_list['oof_cookies'] = BackendTranslation()['oof_cookies_not_found']

    if not verify_aria2_configs_exist():
        error_list['aria2_setup'] = BackendTranslation()['aria2_setup_error']

    if error_list:
        return jsonify({'error': error_list}), 500
    
    return jsonify({'success': 1})

# ---------------------------utilities-------------------------------
