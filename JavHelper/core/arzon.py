import requests
import re
from copy import deepcopy
from lxml import etree

from JavHelper.core.jav_scraper import JavScraper
from JavHelper.core import JAVNotFoundException
from JavHelper.core.requester_proxy import return_get_res, return_html_text


class ArzonScraper(JavScraper):
    def __init__(self, *args, **kwargs):
        super(ArzonScraper, self).__init__(*args, **kwargs)
        self.source = 'arzon'
        self.xpath_dict = {
            'search_field': {
                'title': '//h1/text()',
                'studio': '//tr[td="AVメーカー："]/td[2]/a/text()',
                'premiered': '//tr[td="発売日："]/td[2]/text()',
                #'year': processed from release date
                'length': '//tr[td="収録時間："]/td[2]/text()',
                'director': '//tr[td="監督："]/td[2]/a/text()',
                'image': '//a[@data-lightbox="jacket1"]/@href',
                #'score':no good source
            },
            'search_list_field': {
                'plot': '//table[@class="item_detail"]//div[@class="item_text"]/text()',
                'all_actress': '//tr[td="AV女優："]/td[2]/a/text()'
            },
        }

    def get_site_sessions(self):
        session = requests.Session()
        session.get('https://www.arzon.jp/index.php?action=adult_customer_agecheck&agecheck=1'
                    '&redirect=https%3A%2F%2Fwww.arzon.jp%2F', timeout=10)
        return session

    def postprocess(self):
        if self.jav_obj.get('plot') and isinstance(self.jav_obj['plot'], list):
            _temp = deepcopy(self.jav_obj['plot'])
            _temp = ''.join(_temp)
            _temp = _temp.replace('\r\n', '')
            _temp = _temp.strip(' ')
            self.jav_obj['plot'] = deepcopy(_temp)

        if self.jav_obj.get('length') and isinstance(self.jav_obj['length'], str):
            _temp = deepcopy(self.jav_obj['length'])
            _temp = _temp.replace('\r\n', '')
            _temp = _temp.strip(' ')
            _temp = str(re.search(r'\d+', _temp).group(0))
            self.jav_obj['length'] = deepcopy(_temp)

        if self.jav_obj.get('premiered') and isinstance(self.jav_obj['premiered'], str):
            re_pattern = r'^(\d{4})(\/\d{2}\/\d{2}).*$'
            _temp = deepcopy(self.jav_obj['premiered'])
            _temp = _temp.replace('\r\n', '')
            _temp = _temp.strip(' ')
            matched = re.match(re_pattern, _temp)
            if matched and len(matched.groups()) == 2:
                #import ipdb;ipdb.set_trace()
                self.jav_obj['year'] = str(matched.groups()[0])
                self.jav_obj['premiered'] = ''.join(matched.groups()[:1])
            else:
                # keep cleaned release date only
                self.jav_obj['premiered'] = deepcopy(_temp)


    def get_single_jav_page(self):
        arzon_cookies = self.get_site_sessions().cookies.get_dict()
        arz_search_url = 'https://www.arzon.jp/itemlist.html?t=&m=all&s=&q=' + self.car
        search_html = return_html_text(arz_search_url, cookies=arzon_cookies)

        AVs = re.findall(r'<h2><a href="(/item.+?)" title=', search_html) or []  # 所有搜索结果链接
        for av in AVs:
            arz_url = 'https://www.arzon.jp' + av  # 第i+1个链接
            print(f'accessing {arz_url}')
            page_content = return_get_res(arz_url, cookies=arzon_cookies).content

            # only verify when there are multiple results
            if len(AVs) != 1:
                self.total_index = len(AVs)
                # the search result is not reliable so need to double check
                car_xpath = '//tr[td="品番："]/td[2]/text()'
                _root = etree.HTML(page_content)
                _car = _root.xpath(car_xpath)[0]
                _car = self.clean_up_car(_car)
                if _car == self.car:
                    return page_content, self.total_index
                else:
                    continue
            else:
                return page_content, self.total_index
        return '', 0

    @staticmethod
    def clean_up_car(pre_clean: str):
        return pre_clean.replace('\xa0', '').lstrip().rstrip('  廃盤')