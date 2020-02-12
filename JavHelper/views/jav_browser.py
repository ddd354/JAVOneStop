# -*- coding:utf-8 -*-
from flask import Blueprint, jsonify, request, Response
import json
from blitzdb.document import DoesNotExist
import requests
from lxml import html

from JavHelper.cache import cache
from JavHelper.core.javlibrary import javlib_set_page
from JavHelper.model.jav_manager import JavManagerDB
from JavHelper.core.OOF_downloader import OOFDownloader


jav_browser = Blueprint('jav_browser', __name__, url_prefix='/jav_browser')
SET_TYPE_MAP = {
    'most_wanted': 'vl_mostwanted.php?&mode=&page=',
    'best_rated': 'vl_bestrated.php?&mode=&page='
}

@jav_browser.route('/get_set_javs', methods=['GET'])
@cache.cached(timeout=30, query_string=True)
def get_set_javs():
    set_type = request.args.get('set_type')
    page_num = request.args.get('page_num', 1)

    # verify set type
    if set_type not in SET_TYPE_MAP:
        return jsonify({'error': f'{set_type} is not a supported set type'}), 400

    jav_objs, max_page = javlib_set_page(SET_TYPE_MAP[set_type], page_num)
    db_conn = JavManagerDB()
    for jav_obj in jav_objs:
        if db_conn.pk_exist(str(jav_obj.get('car'))):
            jav_obj.update(
                dict(
                    db_conn.get_by_pk(str(jav_obj.get('car')))
                )
            )

    return jsonify({'success': {'jav_objs': jav_objs, 'max_page': max_page}})

@jav_browser.route('/get_local_car', methods=['GET'])
def get_local_car():
    car = request.args.get('car')

    db_conn = JavManagerDB()
    if db_conn.pk_exist(car):
        return jsonify({'success': dict(db_conn.get_by_pk(car))})
    else:
        return jsonify({'error': f'{car} does not exist locally, car is case sensitive'}), 400

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
    except DoesNotExist:
        current_jav_obj = {'car': jav_pk}

    current_jav_obj.update(update_data)
    db_conn.upcreate_jav(current_jav_obj)

    return jsonify({'success': dict(current_jav_obj)})

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
            name_xpath = '//html/body//table[@id="archiveResult"]//td[@class="name"]/text()'
            titles = [ind[0:25] for ind in BTTree.xpath(name_xpath)]

            file_xpath = '//html/body//table[@id="archiveResult"]//td[@class="size"]/text()'
            file_sizes = [ind for ind in BTTree.xpath(file_xpath)]
            magnets = BTTree.xpath(bt_xpath)
            
            for i in range(len(titles)):
                rt.append({'title': titles[i], 'size': file_sizes[i], 'magnet': magnets[i], 'car': car})
            return jsonify({'success': rt[:10]})
    except Exception:
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

    try:
        respBT = requests.get('http://btdb.io/?s=' + car)
        BTTree = html.fromstring(respBT.content)
        bt_xpath = '//*/div[@class="item-meta-info"]/a'
        if len(BTTree.xpath(bt_xpath)) > 0:
            print(f'{car} found in btdb')

            name_xpath = '//*/h2[@class="item-title"]/a'
            titles = [ind.get('title') for ind in BTTree.xpath(name_xpath)]

            file_xpath = '//*/div[@class="item-meta-info"]/span'
            file_sizes = [ind.text for ind in BTTree.xpath(file_xpath) if 'GB' in ind.text or 'MB' in ind.text]

            for i in range(len(titles)):
                rt.append({'title': titles[i], 'size': file_sizes[i], 'magnet': magnets[i]})
            return jsonify({'success': rt[:10]})
    except Exception:
        pass

    try:
        respBT = requests.get('http://btso.pw/search/' + car)
        BTTree = html.fromstring(respBT.content)
        bt_xpath = '//*[@class="data-list"]/div'
        if len(BTTree.xpath(bt_xpath)) > 0:
            print(f'{car} found in btso')

            for i in range(len(titles)):
                rt.append({'title': titles[i], 'size': file_sizes[i], 'magnet': magnets[i]})
            return jsonify({'success': rt[:10]})
    except Exception:
        pass

    return jsonify({'error': f'{car} not found in all sources'})


# ---------------------------utilities-------------------------------
