# -*- coding:utf-8 -*-
from lxml import etree
import re
from copy import deepcopy

from JavHelper.core.jav_scraper import JavScraper
from JavHelper.core import JAVNotFoundException
from JavHelper.core.requester_proxy import return_html_text, return_post_res, return_get_res
from JavHelper.core.utils import re_parse_html, re_parse_html_list_field, defaultlist
from JavHelper.core.ini_file import return_config_string
from JavHelper.core.utils import parsed_size_to_int
from JavHelper.core.file_scanner import DEFAULT_FILENAME_PATTERN


JAV777_URL = 'https://www.jav777.xyz/'   # hard coded for now

class Jav777Scraper(JavScraper):
    def __init__(self, *args, **kwargs):
        super(Jav777Scraper, self).__init__(*args, **kwargs)
        self.source = 'jav777'
        self.xpath_dict = {
            'search_field': {
                'title': '//a[@class="bigImage"]/img/@title',
                'studio': '//p[span="製作商:"]/a/text()',
                'premiered': '//p[span="發行日期:"]/text()',
                #'year': processed from release date
                'length': '//p[span="長度:"]/text()',
                'director': '//p[span="導演:"]/a/text()',
                'image': '//a[@class="bigImage"]/img/@src',
                #'score': no good source
            },
            'search_list_field': {
                #'plot': no good source,
                'all_actress': '//span[@class="genre" and @onmouseover]/a/text()',
                'genres': '//span[@class="genre"]/a[contains(@href, "genre")]/text()'
            },
        }

        self.jav_url = JAV777_URL

    def postprocess(self):
        if self.jav_obj.get('premiered'):
            self.jav_obj['premiered'] = self.jav_obj['premiered'].lstrip(' ')
            self.jav_obj['year'] = self.jav_obj['premiered'][:4]
        if self.jav_obj.get('image'):
            # get rid of https to have consistent format with other sources
            self.jav_obj['image'] = self.jav_obj['image'].lstrip('https:').lstrip('http:')
        if self.jav_obj.get('length'):
            self.jav_obj['length'] = self.jav_obj['length'].lstrip(' ')[:-2]
        if self.jav_obj.get('title'):
            self.jav_obj['title'] = '{} {}'.format(self.jav_obj['car'], self.jav_obj['title'])

    def get_single_jav_page(self):
        """
        This search method is currently NOT DETERMINISTIC!
        Example: SW-098 -> has 3 outputs
        """

        # perform search first
        # https://www.javbus.com/search/OFJE-235&type=&parent=ce
        search_url = self.jav_url + '?s={}'.format(self.car)
        print(f'accessing {search_url}')

        jav_search_content = return_get_res(search_url).content
        search_root = etree.HTML(jav_search_content)

        search_results = search_root.xpath('//h2[@class="post-title"]/a/@href')

        if not search_results:
            raise JAVNotFoundException('{} cannot be found in {}'.format(self.car, self.source))

        self.total_index = len(search_results)
        result_first_url = search_results[self.pick_index]

        return return_get_res(result_first_url).content, self.total_index


def jav777_download_search(car: str):
    jav_site = Jav777Scraper({'car': car})
    jav_page, _ = jav_site.get_single_jav_page()

    search_root = etree.HTML(jav_page)
    search_results = search_root.xpath('//a[@class="exopopclass"]/@href')
    title = search_root.xpath('//h1[@class="post-title"]/a/@title')

    if search_results:
        return [{'web_link': search_results[0], 'title': title[0], 'size': '--'}]
    else:
        return []


def jav777_set_page(page_template: str, page_num=1, url_parameter=None, config=None) -> dict:
    xpath_dict = {
        'title': '//h2[@class="post-title"]/a/@title',
        'javid': '//div[@class="post-container"]/div/@id',
        'img': '//div[@class="featured-media"]/a/img/@src',
        'car': '//h2[@class="post-title"]/a/@title'
    }
    xpath_max_page = '//center/a[position() = (last()-1)]/text()'

    # force to get url from ini file each time
    jav777_url = JAV777_URL
    set_url = jav777_url + page_template.format(page_num=page_num, url_parameter=url_parameter)
    print(f'accessing {set_url}')

    res = return_post_res(set_url).content
    root = etree.HTML(res)

    jav_objs_raw = defaultlist(dict)
    for k, v in xpath_dict.items():
        _values = root.xpath(v)
        for _i, _value in enumerate(_values):
            # need to extract car from title, reusing file_scanner function
            if k == 'car':
                # remove hd prefixes
                _value = _value.lstrip('(HD)')

                name_group = re.search(DEFAULT_FILENAME_PATTERN, _value)
                name_digits = name_group.group('digit')

                # only keep 0 under 3 digits
                # keep 045, 0830 > 830, 1130, 0002 > 002, 005
                if name_digits.isdigit():
                    name_digits = str(int(name_digits))
                while len(name_digits) < 3:
                    name_digits = '0' + name_digits
                _value = name_group.group('pre') + '-' + name_digits
            jav_objs_raw[_i].update({k: _value})

    try:
        max_page = root.xpath(xpath_max_page)[0]
    except:
        max_page = page_num
    if not max_page:
        max_page = page_num
    
    return jav_objs_raw, max_page
