# -*- coding:utf-8 -*-
from lxml import etree
import re
from copy import deepcopy

from JavHelper.core.jav_scraper import JavScraper
from JavHelper.core import JAVNotFoundException
from JavHelper.core.requester_proxy import return_html_text, return_post_res, return_get_res
from JavHelper.core.utils import re_parse_html, re_parse_html_list_field, defaultlist
from JavHelper.core.ini_file import return_default_config_string
from JavHelper.core.utils import parsed_size_to_int
from JavHelper.core.file_scanner import DEFAULT_FILENAME_PATTERN
from JavHelper.core.backend_translation import BackendTranslation

if return_default_config_string('db_type') == 'sqlite':
    from JavHelper.model.jav_manager import SqliteJavManagerDB as JavManagerDB
else:
    from JavHelper.model.jav_manager import BlitzJavManagerDB as JavManagerDB


class Jav321Scraper(JavScraper):
    def __init__(self, *args, **kwargs):
        super(Jav321Scraper, self).__init__(*args, **kwargs)
        self.source = 'jav321'
        self.xpath_dict = {
            'search_field': {
                'title': '//div[@class="panel-heading"]/h3/text()',
                'studio': '//a[contains(@href, "/company/")]/text()',
                'premiered': '//b[text()="发行日期"]/following-sibling::text()',
                #'year': processed from release date
                'length': '//b[text()="播放时长"]/following-sibling::text()',
                'image': '//video/@poster',
                'backup_image': '//body/div[@class="row"][2]/div[2]/div/p/a/img/@src'
                #'score': no good source
            },
            'search_list_field': {
                'all_actress': '//a[contains(@href, "/star/")]/text()',
                'genres': '//a[contains(@href, "/genre/")]/text()'
            },
        }

        #self.jav_url = return_config_string(['其他设置', 'jav321网址'])
        self.jav_url = 'https://www.jav321.com/'

    def postprocess(self):
        if self.jav_obj.get('premiered'):
            self.jav_obj['premiered'] = self.jav_obj['premiered'].lstrip(':').lstrip(' ')
            self.jav_obj['year'] = self.jav_obj['premiered'][:4]
        # use backup if no image
        if not self.jav_obj.get('image') and self.jav_obj.get('backup_image'):
            self.jav_obj['image'] = self.jav_obj['backup_image']
        if self.jav_obj.get('image'):
            # get rid of https to have consistent format with other sources
            self.jav_obj['image'] = self.jav_obj['image'].lstrip('https:').lstrip('http:')
        if self.jav_obj.get('length'):
            # strip "分钟" and remove space
            self.jav_obj['length'] = self.jav_obj['length'].lstrip(':')[:-2].strip(' ')
        if self.jav_obj.get('title'):
            self.jav_obj['title'] = '{} {}'.format(self.jav_obj['car'], self.jav_obj['title'])

        if self.jav_obj.get('all_actress'):
            # dedupe actress
            self.jav_obj['all_actress'] = list(set(self.jav_obj['all_actress']))

    def get_single_jav_page(self):
        # perform search first
        # https://www.jav321.com/search POST form data: sn: ssni-854
        search_url = self.jav_url + 'search'
        print(f'accessing {search_url}')

        jav_search_content = return_post_res(search_url, data={'sn': self.car}, behind_cloudflare=True).content

        if '抱歉，未找到您要找的AV' in str(jav_search_content):
            raise JAVNotFoundException('{} cannot be found in jav321'.format(self.car))

        self.total_index = 1  # jav321 only return optimal result

        return jav_search_content, self.total_index


def jav321_set_page(page_template: str, page_num=1, url_parameter=None, config=None) -> dict:
    xpath_dict = {
        'title': '//div[@class="thumbnail"]/a/text()',
        'javid': '//div[@class="thumbnail"]/a/@href',  # need to extract from link
        'img': '//div[@class="thumbnail"]/a/img/@src',
        'car': '//div[@class="thumbnail"]/a/text()'  # need to extract from title
    }
    xpath_max_page = '//ul[@class="pager"]/li[@class="next"]/a/text()'
    max_page = page_num  # default value

    # force to get url from ini file each time
    #javbus_url = return_config_string(['其他设置', 'javbus网址'])
    jav_url = 'https://www.jav321.com/'
    set_url = jav_url + page_template.format(page_num=page_num, url_parameter=url_parameter)
    print(f'accessing {set_url}')

    res = return_post_res(set_url).content
    root = etree.HTML(res)

    jav_objs_raw = defaultlist(dict)
    for k, v in xpath_dict.items():
        _values = root.xpath(v)
        for _i, _value in enumerate(_values):
            # need to extract car from title, reusing file_scanner function
            if k == 'car':
                # need to separate text with car first
                _preprocess = _value.split(' ')[-1]
                
                # try to extract proper car
                try:
                    name_group = re.search(DEFAULT_FILENAME_PATTERN, _preprocess)
                    name_digits = name_group.group('digit')

                    # only keep 0 under 3 digits
                    # keep 045, 0830 > 830, 1130, 0002 > 002, 005
                    if name_digits.isdigit():
                        name_digits = str(int(name_digits))
                    while len(name_digits) < 3:
                        name_digits = '0' + name_digits
                    _value = name_group.group('pre') + '-' + name_digits
                except AttributeError as e:
                    print(f'cannot extract standard car format from {_preprocess} due to {e}')
                    _value = _preprocess
            jav_objs_raw[_i].update({k: _value})

    try:
        _new_max = root.xpath(xpath_max_page)
        if len(_new_max) > 0:
            max_page = int(max_page) + 1
    except:
        pass

    # max page override
    #if 'type' in page_template:
    #    max_page = max_page * 100
    
    return jav_objs_raw, max_page


def jav321_search(set_type: str, search_string: str, page_num=1):
    def search_by_car(car: str, **kwargs):
        car = car.upper()
        jav_obj = Jav321Scraper({'car': car}).scrape_jav()
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
        jav_objs, max_page = jav321_set_page(search_url, 
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
        '分类': {'function': jav321_set_page, 'params': 
            {'page_template': 'genre/{url_parameter}/{page_num}',
            'page_num': page_num, 'url_parameter': search_string}
        },
        '系列': {'function': jav321_set_page, 'params': 
            {'page_template': 'series/{url_parameter}/{page_num}',
            'page_num': page_num, 'url_parameter': search_string}
        }
    }

    # verify set type
    if set_type not in search_map:
        raise Exception(BackendTranslation()['no_support_set_search'].format(set_type))

    jav_objs, max_page = search_map[set_type]['function'](**search_map[set_type]['params'])
    return jav_objs, max_page