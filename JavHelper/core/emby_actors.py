# -*- coding:utf-8 -*-
import base64
import os
import requests
import traceback
import argparse
import json
from smart_open import open
import re

from JavHelper.core.ini_file import load_ini_file, return_config_string
from JavHelper.core.warashi import WarashiScraper
from JavHelper.core import ActorNotFoundException

SITE_SETUP = {
    'emby': {
        'actress_yielder_url': '{req_url}emby/Persons?api_key={api_key}'
    }
}

class EmbyActorUpload:
    """
    Serve any services that use api for actor upload (emby)
    """
    def __init__(self, replace=False, config=None):
        if not config:
            self.config = load_ini_file()
        else:
            self.config = config

        self.replace = replace
        self.walked_actress = {}
    
    def setup_credentials(self):
        api_key = return_config_string(["emby专用", "api id"], config=self.config)
        return {'api_key': api_key}

    def actress_yielder(self, req_url: str, req_site: str):
        if not req_url.endswith('/'):
            req_url += '/'     
        cred_dict = self.setup_credentials()
        cred_dict['req_url'] = req_url
        url = SITE_SETUP[req_site]['actress_yielder_url'].format(**cred_dict)
        for item in requests.get(url).json()['Items']:
            yield item

    @staticmethod
    def post_image_to_actress(actress_id, image_f, emby_url, api_key):
        with open(image_f, 'rb') as f:
            b6_pic = base64.b64encode(f.read())  # 读取文件内容，转换为base64编码

        url = f'{emby_url}emby/Items/{actress_id}/Images/Primary?api_key={api_key}'
        if image_f.endswith('png'):
            header = {"Content-Type": 'image/png', }
        else:
            header = {"Content-Type": 'image/jpeg', }

        requests.post(url=url, data=b6_pic, headers=header)
        print(f'successfully post actress ID: {actress_id} image')
        return 1

    def send_emby_images(self, image_folder_path=None):
        # init
        num = 0
        up_num = []
        failed_names = []

        emby_url = return_config_string(["emby专用", "网址"], config=self.config)
        api_key = return_config_string(["emby专用", "api id"], config=self.config)
        image_scraper = WarashiScraper()

        # try correct emby url with /
        if not emby_url.endswith('/'):
            emby_url += '/'

        try:
            for actress in self.actress_yielder(emby_url, req_site='emby'):
                num += 1
                if num % 500 == 0:
                    print('have processed', num, '个actress')

                actress_name = actress['Name']
                actress_id = actress['Id']

                actress_formatter = r'(.+?)\[(.+?)\]'
                actress_groups = re.search(actress_formatter, actress_name)
                if actress_groups and len(actress_groups.groups()) == 2:
                    search_term = actress_groups.groups()[1]
                    print(f'use {search_term} for search')
                else:
                    search_term = None


                if not self.replace and actress.get('ImageTags', {}) != {}:
                    res_info = {'log': f'skipping 女优：{actress_name}, already has existing images'}
                    yield json.dumps(res_info, ensure_ascii=False)+'\n'
                    continue

                has_local_image = False
                if image_folder_path:
                    if os.path.isfile(os.path.join(image_folder_path, f'{actress_name}.jpg')):
                        file_path = os.path.join(image_folder_path, f'{actress_name}.jpg')
                        self.post_image_to_actress(actress_id, file_path, emby_url, api_key)
                        up_num.append(actress_name)
                        has_local_image = True
                    elif os.path.isfile(os.path.join(image_folder_path, f'{actress_name}.png')):
                        file_path = os.path.join(image_folder_path, f'{actress_name}.png')
                        self.post_image_to_actress(actress_id, file_path, emby_url, api_key)
                        up_num.append(actress_name)
                        has_local_image = True

                if not has_local_image:
                    try:
                        if not self.walked_actress.get(search_term or actress_name, ''):
                            image_url = image_scraper.return_image_by_name(search_term or actress_name)
                            self.walked_actress[search_term or actress_name] = image_url
                        else:
                            image_url = self.walked_actress[search_term or actress_name]
                        self.post_image_to_actress(actress_id, image_url, emby_url, api_key)
                        up_num.append(actress_name)
                    except ActorNotFoundException as e:
                        res_info = {'log': str(e)}
                        failed_names.append(actress_name)
                        yield json.dumps(res_info, ensure_ascii=False)+'\n'
                        continue
                    except Exception as e:
                        traceback_str = traceback.format_exc()
                        yield json.dumps(traceback_str, ensure_ascii=False)+'\n'
                        continue
                
                res_info = {'log': f'processed 女优：{actress_name}, ID：{actress_id}'}

                yield json.dumps(res_info, ensure_ascii=False)+'\n'

        except requests.exceptions.ConnectionError:
            print('emby服务端无法访问，请检查：', emby_url)
        except Exception as err:
            traceback.print_exc()
            print('发生未知错误，请截图给作者：', emby_url, err)

        print(f'成功upload {len(up_num)} 个女优头像！')
        yield json.dumps({'log': f'成功upload {len(up_num)} 个女优头像！succeeded on {up_num} \n failed on {failed_names}'}, ensure_ascii=False)+'\n'
