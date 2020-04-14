# -*- coding:utf-8 -*-
from flask import Blueprint, jsonify, request, Response
import json
from blitzdb.document import DoesNotExist
import requests
from lxml import html
from traceback import print_exc

from JavHelper.cache import cache
from JavHelper.core.javbus import javbus_set_page, JavBusScraper
from JavHelper.model.jav_manager import JavManagerDB
from JavHelper.core.OOF_downloader import OOFDownloader


javbus_browser = Blueprint('javbus_browser', __name__, url_prefix='/javbus_browser')
SET_TYPE_MAP = {
    'subtitled': 'genre/sub/{page_num}',
    'trending_updates': 'page/{page_num}',
}

def search_by_car(car: str, **kwargs):
    car = car.upper()
    jav_obj = JavBusScraper({'car': car}).scrape_jav()
    db_conn = JavManagerDB()

    if db_conn.pk_exist(str(jav_obj.get('car'))):
        jav_obj.update(
            dict(
                db_conn.get_by_pk(str(jav_obj.get('car')))
            )
        )
    else:
        jav_obj['stat'] = 2
        db_conn.upcreate_jav(jav_obj)

    # use the full image (image key) instead of img (much smaller)
    jav_obj['img'] = jav_obj.get('image', '')
    
    return [jav_obj], 1

def search_for_actress(javlib_actress_code: str, page_num=1):
    search_url = 'star/{url_parameter}/{page_num}'
    db_conn = JavManagerDB()

    # get actress first page
    jav_objs, max_page = javbus_set_page(search_url, 
        page_num=page_num, 
        url_parameter=javlib_actress_code
    )

    for jav_obj in jav_objs:
        if db_conn.pk_exist(str(jav_obj.get('car'))):
            jav_obj.update(
                dict(
                    db_conn.get_by_pk(str(jav_obj.get('car')))
                )
            )
        else:
            jav_obj['stat'] = 2
            db_conn.upcreate_jav(jav_obj)
    
    return jav_objs, max_page

@javbus_browser.route('/get_set_javs', methods=['GET'])
def get_set_javs():
    set_type = request.args.get('set_type')
    page_num = request.args.get('page_num', 1)
    # optional search string
    search_string = request.args.get('search_string', '')
    _dedupe_car_list = []
    rt_jav_objs = []

    if not search_string:
        # parse set without search string
        # verify set type
        if set_type not in SET_TYPE_MAP:
            return jsonify({'error': f'{set_type} is not a supported set type'}), 400

        jav_objs, max_page = javbus_set_page(SET_TYPE_MAP[set_type], page_num)
    else:
        # search by supplied string
        search_map = {
            '番号': {'function': search_by_car, 'params': {'car': search_string}},
            '女优': {'function': search_for_actress, 'params': {
                'javlib_actress_code': search_string, 'page_num': page_num}},
            '分类': {'function': javbus_set_page, 'params': 
                {'page_template': 'genre/{url_parameter}/{page_num}',
                'page_num': page_num, 'url_parameter': search_string}},
        }

        # verify set type
        if set_type not in search_map:
            return jsonify({'error': f'{set_type} is not a supported search type'}), 400

        jav_objs, max_page = search_map[set_type]['function'](**search_map[set_type]['params'])
    
    for jav_obj in jav_objs:
        if jav_obj['car'] not in _dedupe_car_list:
            _dedupe_car_list.append(jav_obj['car'])
            rt_jav_objs.append(jav_obj)

    # looooop through DB
    db_conn = JavManagerDB()
    for jav_obj in rt_jav_objs:
        if db_conn.pk_exist(str(jav_obj.get('car'))):
            jav_obj.update(
                dict(
                    db_conn.get_by_pk(str(jav_obj.get('car')))
                )
            )
        else:
            jav_obj['stat'] = 2
            db_conn.upcreate_jav(jav_obj)

    return jsonify({'success': {'jav_objs': rt_jav_objs, 'max_page': max_page}})

@javbus_browser.route('/search_magnet_link', methods=['GET'])
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


# ---------------------------utilities-------------------------------
