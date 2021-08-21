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


class TushyrawScraper(JavScraper):
    def __init__(self, *args, **kwargs):
        super(TushyrawScraper, self).__init__(*args, **kwargs)
        self.source = 'tushyraw'
        self.xpath_dict = {
            'search_field': {
                'title': '//h1[@data-test-component="VideoTitle"]/text()',
                #'studio': '//p[span="製作商:"]/a/text()',
                'premiered': '//span[@data-test-component="ReleaseDataFormatted"]/text()',
                #'year': processed from release date
                'length': '//span[@data-test-component="RunLengthFormatted"]/text()',
                'director': '//span[@data-test-component="DirectorText"]/text()',
                'image': '//picture[@data-test-component="ProgressiveImageImage"]/source[1]/@src',
                'score': '//span[@data-test-component="RatingNumber"]/text()',
                'plot': '//span[@data-test-component="VideoDescription"]/div/p/text()'
            },
            'search_list_field': {
                'all_actress': '//div[@data-test-component="VideoModels"]/a/text()',
                'genres': '//span[@class="genre"]/a[contains(@href, "genre")]/text()'
            },
        }

        self.jav_url = 'https://www.tushyraw.com/'

    def postprocess(self):
        if not self.jav_obj.get('studio'):
            self.jav_obj['studio'] = 'tushyraw'
        if self.jav_obj.get('premiered'):
            self.jav_obj['premiered'] = self.jav_obj['premiered'].lstrip(' ')
            self.jav_obj['year'] = self.jav_obj['premiered'][:4]
        if self.jav_obj.get('image'):
            # get rid of https to have consistent format with other sources
            self.jav_obj['image'] = self.jav_obj['image'].lstrip('https:').lstrip('http:')

    def get_single_jav_page(self):
        """
        This not a search, rather, this goes directly in url
        """

        # perform search first
        # https://www.javbus.com/search/OFJE-235&type=&parent=ce
        _search_str = self.car.lstrip('tushyraw').replace(' ', '-')
        search_url = self.jav_url + 'videos/{}'.format(_search_str)
        print(f'accessing {search_url}')

        jav_search_content = return_get_res(search_url).content
        search_root = etree.HTML(jav_search_content)

        search_results = search_root.xpath('//a[@class="movie-box"]/@href')

        if not search_results:
            # sometimes the access will fail, try directly access by car
            direct_url = self.jav_url + self.car
            print(f'no search result, try direct accessing {search_url}')
            jav_search_content = return_get_res(direct_url).content
            search_root = etree.HTML(jav_search_content)

            if search_root.xpath('//a[@class="bigImage"]/img/@title'):
               search_results = [direct_url]

        if not search_results:
            raise JAVNotFoundException('{} cannot be found in tushyraw'.format(self.car))

        self.total_index = len(search_results)
        result_first_url = search_results[self.pick_index]

        return return_get_res(result_first_url).content, self.total_index


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
    root = etree.HTML(res.decode('utf-8'))

    magnets = defaultlist(dict)
    for k, v in magnet_xpath.items():
        _values = root.xpath(v)
        for _i, _value in enumerate(_values):
            magnets[_i].update({k: _value.strip('\t').strip('\r').strip('\n').strip()})
            if k == 'size':
                magnets[_i].update({'size_sort': parsed_size_to_int(_value.strip('\t').strip('\r').strip('\n').strip())})

    return magnets


def tushyraw_set_page(page_template: str, page_num=1, url_parameter=None, config=None) -> dict:

    def extract_imgs(res):
        imgs = []
        for line in res.iter_lines():
            if '__APOLLO_STATE__' in line.decode('latin1'):
                structured_var = json.loads(line.decode('latin1')[38:-1])
                del structured_var['ROOT_QUERY']
                for k, v in structured_var.items():
                    if 'images' in v:
                        imgs.append(v['images']['listing'][0]['src'])

        return imgs

    xpath_dict = {
        'title': '//a[@data-test-component="TitleLink"]/text()',
        'javid': '//a[@data-test-component="TitleLink"]/text()',
        #'img': need to convert from js var
        'car': '//a[@data-test-component="TitleLink"]/text()'
    }
    xpath_max_page = '//a[@data-test-component="PaginationLast"]/@href'
    max_page = page_num  # default value

    # force to get url from ini file each time
    javbus_url = 'https://www.tushyraw.com/'
    set_url = javbus_url + page_template.format(page_num=page_num, url_parameter=url_parameter)
    print(f'accessing {set_url}')

    res = return_get_res(set_url, behind_cloudflare=True)
    root = etree.HTML(res.content)

    jav_objs_raw = defaultlist(dict)
    for k, v in xpath_dict.items():
        _values = root.xpath(v)
        for _i, _value in enumerate(_values):
            jav_objs_raw[_i].update({k: _value})

    imgs = extract_imgs(res)
    for _i, _value in enumerate(imgs):
            jav_objs_raw[_i].update({'img': _value})

    for wav in jav_objs_raw:
        if wav.get('car'):
            wav['car'] = 'TUSHYRAW {}'.format(wav['car'])
            wav['javid'] = 'TUSHYRAW {}'.format(wav.get('javid', wav['car']))

    try:
        _new_max = root.xpath(xpath_max_page)[0]
        _new_max = ''.join(c for c in _new_max if c.isdigit())
        if int(_new_max) > int(page_num):
            max_page = _new_max
    except:
        pass
    
    return jav_objs_raw, max_page


def javbus_search(set_type: str, search_string: str, page_num=1):

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
        raise Exception(BackendTranslation()['no_support_set_search'].format(set_type))

    jav_objs, max_page = search_map[set_type]['function'](**search_map[set_type]['params'])
    return jav_objs, max_page
