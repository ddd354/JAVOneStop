# -*- coding:utf-8 -*-
from lxml import etree
import re
from copy import deepcopy
import json

from JavHelper.core.jav_scraper import JavScraper
from JavHelper.core import JAVNotFoundException
from JavHelper.core.requester_proxy import return_html_text, return_post_res, return_get_res
from JavHelper.core.utils import re_parse_html, re_parse_html_list_field, defaultlist
from JavHelper.core.ini_file import return_config_string


LOCAL_CF_COOKIES = 'javlib_cf_cookies.json'

class JavLibraryScraper(JavScraper):
    def __init__(self, *args, **kwargs):
        super(JavLibraryScraper, self).__init__(*args, **kwargs)
        self.source = 'javlibrary'
        self.xpath_dict = {
            'search_field': {
                'title': '//title/text()',
                'studio': '//tr[td="制作商:"]/td[2]/span/a/text()',
                'premiered': '//tr[td="发行日期:"]/td[2]/text()',
                #'year': processed from release date
                'length': '//tr[td="长度:"]/td[2]/span/text()',
                'director': '//tr[td="导演:"]/td[2]/text()',
                'image': '//img[@id="video_jacket_img"]/@src',
                'score': '//span[@class="score"]/text()'
            },
            'search_list_field': {
                #'plot': no good source,
                'all_actress': '//span[@class="star"]/a/text()',
                'genres': '//span[@class="genre"]/a/text()'
            },
        }

        self.jav_url = return_config_string(['其他设置', 'javlibrary网址'])

    def postprocess(self):
        if ' - JAVLibrary' in self.jav_obj['title']:
            self.jav_obj['title'] = self.jav_obj['title'].replace(' - JAVLibrary', '')

        if self.jav_obj.get('premiered') and isinstance(self.jav_obj['premiered'], str):
            self.jav_obj['year'] = self.jav_obj['premiered'][0:4]

    def get_single_jav_page(self):
        """
        This search method is currently NOT DETERMINISTIC!
        Example: SW-098 -> has 3 outputs
        """

        # perform search first
        lib_search_url = self.jav_url + 'vl_searchbyid.php?keyword=' + self.car
        #print(f'accessing {lib_search_url}')
        jav_html = return_html_text(lib_search_url, behind_cloudflare=True)
        #print('page return ok')

        # 搜索结果的网页，大部分情况就是这个影片的网页，也有可能是多个结果的网页
        # 尝试找标题，第一种情况：找得到，就是这个影片的网页
        if self.car.upper().startswith('T28'):
            # special filter for T28
            title_re = re.search(r'<title>((T28-|T-28)\d{1,5}.+?) - JAVLibrary<\/title>', jav_html)
        elif self.car.upper().startswith('R18'):
            # special filter for T28
            title_re = re.search(r'<title>((R18-|R-18)\d{1,5}.+?) - JAVLibrary<\/title>', jav_html)
        else:
            title_re = re.search(r'<title>([a-zA-Z]{1,6}-\d{1,5}.+?) - JAVLibrary</title>', jav_html)  # 匹配处理“标题”

        # 搜索结果就是AV的页面
        if title_re:
            return return_get_res(lib_search_url, behind_cloudflare=True).content, 1
        # 第二种情况：搜索结果可能是两个以上，所以这种匹配找不到标题，None！
        else:  # 继续找标题，但匹配形式不同，这是找“可能是多个结果的网页”上的第一个标题
            search_results = re.findall(r'v=javli(.+?)" title=".+?-\d+?[a-z]? ', jav_html)
            # 搜索有几个结果，用第一个AV的网页，打开它
            if search_results:
                self.total_index = len(search_results)
                result_first_url = self.jav_url + '?v=javli' + search_results[self.pick_index]
                return return_get_res(result_first_url, behind_cloudflare=True).content, self.total_index
            # 第三种情况：搜索不到这部影片，搜索结果页面什么都没有
            else:
                raise JAVNotFoundException('{} cannot be found in javlib'.format(self.car))

    @staticmethod
    def load_local_cookies(return_all=False):
        raw_cookies = json.load(open(LOCAL_CF_COOKIES, 'r'))
        if return_all:
            return raw_cookies
        else:
            return {x['name']: x['value'] for x in raw_cookies}

    @staticmethod
    def update_local_cookies(update_dict: dict or list):
        with open(LOCAL_CF_COOKIES, 'w') as oof_f:
            oof_f.write(json.dumps(update_dict))
        return f'115 cookies updated to local file {LOCAL_CF_COOKIES}'

def find_max_page(search_str: str):
    search_pattern = r'.*?page=(\d*)'
    try:
        search_result = re.match(search_pattern, search_str).groups()[0]
        return str(search_result)
    except Exception as e:
        print(e)
        return None

def javlib_set_page(page_template: str, page_num=1, url_parameter=None, config=None) -> dict:
    xpath_dict = {
        'title': '//*[@class="video"]/a/@title',
        'javid': '//*[@class="video"]/@id',
        'img': '//*[@class="video"]/a/img/@src',
        'car': '//*/div[@class="video"]/a/div[@class="id"]/text()'
    }
    xpath_max_page = '//*/div[@class="page_selector"]/a[@class="page last"]/@href'

    # force to get url from ini file each time
    javlib_url = return_config_string(['其他设置', 'javlibrary网址'])

    lib_url = javlib_url + page_template.format(page_num=page_num, url_parameter=url_parameter)
    print(f'accessing {lib_url}')

    res = return_post_res(lib_url, behind_cloudflare=True).content
    root = etree.HTML(res)

    jav_objs_raw = defaultlist(dict)
    for k, v in xpath_dict.items():
        _values = root.xpath(v)
        for _i, _value in enumerate(_values):
            jav_objs_raw[_i].update({k: _value})

    try:
        max_page = find_max_page(root.xpath(xpath_max_page)[0])
    except IndexError:
        max_page = page_num
    
    return jav_objs_raw, max_page
