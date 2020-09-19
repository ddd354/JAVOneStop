# -*- coding:utf-8 -*-
from lxml import etree
import re
from copy import deepcopy
import json

from JavHelper.core.jav_scraper import JavScraper
from JavHelper.core import JAVNotFoundException
from JavHelper.core.requester_proxy import return_html_text, return_post_res, return_get_res
from JavHelper.core.utils import re_parse_html, re_parse_html_list_field, defaultlist
from JavHelper.core.ini_file import return_config_string, return_default_config_string
from JavHelper.core.utils import parsed_size_to_int
from JavHelper.core.backend_translation import BackendTranslation

if return_default_config_string('db_type') == 'sqlite':
    from JavHelper.model.jav_manager import SqliteJavManagerDB as JavManagerDB
else:
    from JavHelper.model.jav_manager import BlitzJavManagerDB as JavManagerDB


class JavDBScraper(JavScraper):
    def __init__(self, *args, **kwargs):
        super(JavDBScraper, self).__init__(*args, **kwargs)
        self.source = 'javdb'
        self.xpath_dict = {
            'search_field': {
                'title': '//h2[@class="title is-4"]/strong/text()',
                'studio': '//div[strong="片商:"]/a/text()',
                'premiered': '//div[strong="時間:"]/span/text()',
                #'year': processed from release date
                'length': '//div[strong="時長:"]/span/text()',
                # 'director': no good source
                'image': '///img[@class="video-cover"]/@src',
                #'score': no good source
            },
            'search_list_field': {
                #'plot': no good source,
                'all_actress': '//div[./strong/text()="演員:"]/span/a/text()',
                'genres': '//div[./strong/text()="類別:"]/span/a/text()',
                'tags': '//div[./strong/text()="系列:"]/span/a/text()'
            },
        }

        self.jav_url = 'https://javdb.com/'

    def postprocess(self):
        if self.jav_obj.get('premiered'):
            self.jav_obj['premiered'] = self.jav_obj['premiered'].lstrip(' ')
            self.jav_obj['year'] = self.jav_obj['premiered'][:4]
        if self.jav_obj.get('image'):
            # get rid of https to have consistent format with other sources
            self.jav_obj['image'] = self.jav_obj['image'].lstrip('https:').lstrip('http:')

            # sometimes javdb keeps invalid image
            if 'noimage' in self.jav_obj['image']:
                self.jav_obj.pop('image')

        if self.jav_obj.get('length'):
            self.jav_obj['length'] = self.jav_obj['length'].lstrip(' ')[:-3]

    def get_single_jav_page(self):
        # new autocomplete search, no rate limit
        # https://javdb.com/videos/search_autocomplete.json?q=luxu-1298
        search_url = self.jav_url + 'videos/search_autocomplete.json?q={}'.format(self.car)
        jav_search_result = return_html_text(search_url, behind_cloudflare=True)
        try:
            jav_search_result = json.loads(jav_search_result)
            self.total_index = len(jav_search_result)
            for i, _rst in enumerate(jav_search_result):
                if _rst['number'] == self.car.upper():
                    result_first_url = self.jav_url + 'v/{}'.format(_rst['uid'])
                    return return_get_res(result_first_url).content.decode('utf-8'), self.total_index
        except Exception as e:
            print(f'issue encounter when autocomplete search javdb {self.car} - {e}')
            pass

        # perform search first, not reliable at all, often multiple results
        # https://javdb4.com/search?q=MILK-08&f=all
        search_url = self.jav_url + 'search?q={}&f=all'.format(self.car)

        jav_search_content = return_get_res(search_url).content
        search_root = etree.HTML(jav_search_content)

        search_results = search_root.xpath('//a[@class="box"]/@href')


        self.total_index = len(search_results)
        # need to match car
        matched_car = search_root.xpath('//a[@class="box"]/div[@class="uid"]/text()')
        if self.total_index < 1:
            raise Exception(f'nothing found for {self.car} from javdb')
        elif self.car.upper() != matched_car[0].upper():
            raise Exception(f'{self.car} does not match javdb search result: {matched_car}')

        result_first_url = self.jav_url + search_results[self.pick_index][1:]

        return return_get_res(result_first_url).content.decode('utf-8'), self.total_index


def javbus_magnet_search(car: str):
    jav_url = return_config_string(['其他设置', 'javbus网址'])
    gid_match = r'.*?var gid = (\d*);.*?'
    magnet_xpath = {
        'magnet': '//tr/td[position()=1]/a[1]/@href',
        'title': '//tr/td[position()=1]/a[1]/text()',
        'size': '//tr/td[position()=2]/a[1]/text()'
    }
    main_url_template = jav_url+'{car}'
    magnet_url_template = jav_url+'ajax/uncledatoolsbyajax.php?gid={gid}&uc=0'

    res = return_get_res(main_url_template.format(car=car)).text
    gid = re.search(gid_match, res).groups()[0]

    res = return_get_res(magnet_url_template.format(gid=gid), headers={'referer': main_url_template.format(car=car)}).content
    root = etree.HTML(res)

    magnets = defaultlist(dict)
    for k, v in magnet_xpath.items():
        _values = root.xpath(v)
        for _i, _value in enumerate(_values):
            magnets[_i].update({k: _value.strip('\t').strip('\r').strip('\n').strip()})
            if k == 'size':
                magnets[_i].update({'size_sort': parsed_size_to_int(_value.strip('\t').strip('\r').strip('\n').strip())})
    
    return magnets


def javdb_set_page(page_template: str, page_num=1, url_parameter=None, config=None) -> dict:
    """
    website parse function
    """
    xpath_dict = {
        'title': '//a[@class="box"]/div[@class="video-title"]/text()',
        'javid': '//a[@class="box"]/div[@class="uid"]/text()',
        'img': '//div[@class="item-image fix-scale-cover"]/img/@data-src',
        'car': '//a[@class="box"]/div[@class="uid"]/text()'
    }
    xpath_max_page = '//ul[@class="pagination-list"]/li/a[@class="pagination-link"][last()]/text()'

    # force to get url from ini file each time
    javdb_url = 'https://javdb4.com/'
    set_url = javdb_url + page_template.format(page_num=page_num, url_parameter=url_parameter)
    print(f'accessing {set_url}')

    # not really behind cloudflare but may prevent python scrape
    res = return_get_res(set_url, cookies={'over18': "1"}, behind_cloudflare=True).content
    root = etree.HTML(res.decode('utf-8'))

    jav_objs_raw = defaultlist(dict)
    for k, v in xpath_dict.items():
        _values = root.xpath(v)
        for _i, _value in enumerate(_values):
            jav_objs_raw[_i].update({k: _value})

    try:
        max_page = root.xpath(xpath_max_page)[-1]
    except:
        max_page = page_num
    if not max_page:
        max_page = page_num
    
    return jav_objs_raw, max_page


def javdb_search(set_type: str, search_string: str, page_num=1):
    def search_by_car(car: str, **kwargs):
        car = car.upper()
        jav_obj = JavDBScraper({'car': car}).scrape_jav()
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
        search_url = 'actors/{url_parameter}?page={page_num}'
        db_conn = JavManagerDB()

        # get actress first page
        jav_objs, max_page = javdb_set_page(search_url, 
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

    search_map = {
        '番号': {'function': search_by_car, 'params': {'car': search_string}},
        '女优': {'function': search_for_actress, 'params': {
            'javlib_actress_code': search_string, 'page_num': page_num}},
        '分类': {'function': javdb_set_page, 'params': 
            {'page_template': 'tags?c6={url_parameter}&page={page_num}',
            'page_num': page_num, 'url_parameter': search_string}
        },
        '系列': {'function': javdb_set_page, 'params': 
            {'page_template': 'series/{url_parameter}?page={page_num}',
            'page_num': page_num, 'url_parameter': search_string}
        }
    }

    # verify set type
    if set_type not in search_map:
        raise Exception(BackendTranslation()['no_support_set_search'].format(set_type))

    jav_objs, max_page = search_map[set_type]['function'](**search_map[set_type]['params'])
    return jav_objs, max_page