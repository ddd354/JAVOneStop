# -*- coding:utf-8 -*-
from lxml import etree

from JavHelper.core.requester_proxy import return_post_res, return_get_res
from JavHelper.core import ActorNotFoundException


class WarashiScraper:
    top_url = 'http://warashi-asian-pornstars.fr/'

    def actress_searcher(self, search_str: str):
        search_endpoint = 'en/s-12/search'  # for female search most likely, s-12 might be changing?
        search_url = self.top_url + search_endpoint
        res = return_post_res(search_url, data={'recherche_valeur': search_str, 'recherche_critere': 'f'}).content

        root = etree.HTML(res)
        search_results = root.xpath('//div[@class="resultat-pornostar correspondance_exacte"]/p/a')
        if len(search_results) < 1:
            raise ActorNotFoundException(f'cannot find actor {search_str}')
        actress_href = search_results[0].get('href')  # we only use 1st return
        
        return return_get_res(self.top_url+actress_href).content

    def get_image_from_actress_page(self, req_content, search_str=''):
        root = etree.HTML(req_content)
        image_results = root.xpath('//div[@id="pornostar-profil-photos"]/div/figure/a')
        if len(image_results) < 1:
            # only 1 image avaiable
            selected_image = root.xpath('//div[@id="pornostar-profil-photos-0"]/figure/img')
            if len(selected_image) < 1:
                raise ActorNotFoundException(f'cannot find actor {search_str}')
            else:
                selected_image = selected_image[0].get('src')
        else:
            selected_image = image_results[0].get('href')  # we choose 2nd one for now
        return self.top_url+selected_image[1:]  # need to get rid of 1st /

    def return_image_by_name(self, search_str: str):
        actress_res = self.actress_searcher(search_str)
        return self.get_image_from_actress_page(actress_res, search_str=search_str)

