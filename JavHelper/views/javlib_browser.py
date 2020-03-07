# -*- coding:utf-8 -*-
from flask import Blueprint, jsonify, request, Response
import json
from blitzdb.document import DoesNotExist
import requests
from lxml import html
from traceback import print_exc

from JavHelper.cache import cache
from JavHelper.core.javlibrary import javlib_set_page, JavLibraryScraper
from JavHelper.model.jav_manager import JavManagerDB
from JavHelper.core.OOF_downloader import OOFDownloader


javlib_browser = Blueprint('javlib_browser', __name__, url_prefix='/javlib_browser')
SET_TYPE_MAP = {
    'most_wanted': 'vl_mostwanted.php?&mode=&page={page_num}',
    'best_rated': 'vl_bestrated.php?&mode=&page={page_num}',
    'trending_updates': 'vl_update.php?&mode=&page={page_num}',
    'personal_wanted': 'hard_coded'  # this is a special hard coded category
}  # there is a hard coded list in javlibBrowser.jsx for filtering as well

def search_by_car(car: str, **kwargs):
    jav_obj = JavLibraryScraper({'car': car}).scrape_jav()
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
    """
    This only support javlibrary actress code
    """
    search_url = 'vl_star.php?&mode=&s={url_parameter}&page={page_num}'
    db_conn = JavManagerDB()

    # get actress first page
    jav_objs, max_page = javlib_set_page(search_url, 
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

@javlib_browser.route('/rebuild_db_index', methods=['GET'])
def rebuild_db_index():
    JavManagerDB().rebuild_index()
    return jsonify({'success': 'index rebuilt for stat'})

@javlib_browser.route('/get_set_javs', methods=['GET'])
@cache.cached(timeout=30, query_string=True)
def get_set_javs():
    set_type = request.args.get('set_type')
    page_num = request.args.get('page_num', 1)
    # optional search string
    search_string = request.args.get('search_string', '')
    _dedupe_car_list = []
    rt_jav_objs = []

    if set_type == 'personal_wanted':
        db_conn = JavManagerDB()
        jav_objs, max_page = db_conn.query_on_filter({'stat': 0}, page=int(page_num))
        # need additional info
        for jav_obj in jav_objs:
            if jav_obj['stat'] != 0:
                db_conn.rebuild_index()
                raise Exception('index is not up-to-date and it has been rebuild')
            if not jav_obj.get('title', None):
                _full_info = JavLibraryScraper({'car': jav_obj['car']}).scrape_jav()
                jav_obj.update(_full_info)
                db_conn.upcreate_jav(jav_obj)

            jav_obj.setdefault('img', jav_obj.get('image', ''))  # force img key to exist

        # don't need extra db operations
        return jsonify({'success': {'jav_objs': jav_objs, 'max_page': max_page}})
    elif not search_string:
        # parse set without search string
        # verify set type
        if set_type not in SET_TYPE_MAP:
            return jsonify({'error': f'{set_type} is not a supported set type'}), 400

        jav_objs, max_page = javlib_set_page(SET_TYPE_MAP[set_type], page_num)
    else:
        # search by supplied string
        search_map = {
            '番号': {'function': search_by_car, 'params': {'car': search_string}},
            '女优': {'function': search_for_actress, 'params': {
                'javlib_actress_code': search_string, 'page_num': page_num}},
            '分类': {'function': javlib_set_page, 'params': 
                {'page_template': 'vl_genre.php?&mode=&g={url_parameter}&page={page_num}',
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

@javlib_browser.route('/get_local_car', methods=['GET'])
def get_local_car():
    car = request.args.get('car')

    db_conn = JavManagerDB()
    if db_conn.pk_exist(car):
        return jsonify({'success': dict(db_conn.get_by_pk(car))})
    else:
        return jsonify({'error': f'{car} does not exist locally, car is case sensitive'}), 400

@javlib_browser.route('/update_db_jav', methods=['POST'])
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

@javlib_browser.route('/download_via_aria', methods=['POST'])
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

@javlib_browser.route('/search_magnet_link', methods=['GET'])
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
