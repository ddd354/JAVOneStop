import requests
import re
from lxml import etree

from JavHelper.core import JAVNotFoundException
from JavHelper.core.requester_proxy import return_html_text


class JavScraper:
    def __init__(self, jav_obj: dict, pick_index=0):
        self.jav_obj = jav_obj
        self.car = jav_obj['car'].upper()
        self.source = 'main_class'

        self.xpath_dict = {
             'search_field': {
            },
            'search_list_field': {
            },
        }
        self.pick_index = pick_index
        self.total_index = 1  # default to just 1 result

    def get_site_sessions(self):
        pass

    def get_single_jav_page(self):
        pass

    def postprocess(self):
        pass

    def scrape_jav(self):
        page_content, total_index = self.get_single_jav_page()
        self.jav_obj['pick_index'] = self.pick_index
        self.jav_obj['total_index'] = total_index
        #import ipdb; ipdb.set_trace()
        if not page_content:
            print(f'cannot find {self.car} in {self.source}')
            return self.jav_obj

        root = etree.HTML(page_content)
        # search single field
        self.jav_obj.update(self.search_single_xpath(self.jav_obj, self.xpath_dict['search_field'], root))
        # search multi field
        self.jav_obj.update(self.search_multifield_xpath(self.jav_obj, self.xpath_dict['search_list_field'], root))

        # run post process
        self.postprocess()
        
        return self.jav_obj

    @staticmethod
    def search_single_xpath(update_obj: dict, search_dict: dict, source_root):
        for k, v in search_dict.items():
            _temp_v = source_root.xpath(v)
            #if k == 'title': import ipdb; ipdb.set_trace()
            if len(_temp_v) > 0:
                update_obj[k] = _temp_v[0]

        return update_obj

    @staticmethod
    def search_multifield_xpath(update_obj: dict, search_dict: dict, source_root):
        for k, v in search_dict.items():
            #if k == 'genres':
            #    import ipdb; ipdb.set_trace()
            update_obj[k] = source_root.xpath(v)

        return update_obj

