import requests
import json
from datetime import datetime
import re
from blitzdb.document import DoesNotExist
from time import sleep
from traceback import print_exc

from JavHelper.core.backend_translation import BackendTranslation
from JavHelper.core.aria2_handler import get_aria2
from JavHelper.core.utils import byte_to_MB
from JavHelper.core.ini_file import return_default_config_string

if return_default_config_string('db_type') == 'sqlite':
    from JavHelper.model.jav_manager import SqliteJavManagerDB as JavManagerDB
else:
    from JavHelper.model.jav_manager import BlitzJavManagerDB as JavManagerDB


LOCAL_OOF_COOKIES = '115_cookies.json'
STANDARD_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36'
STANDARD_HEADERS = {"Content-Type": "application/x-www-form-urlencoded", 'User-Agent': STANDARD_UA}


class NoTaskException(Exception):
    pass

class OOFDownloader:
    def __init__(self):
        self.cookies = self.load_local_cookies()
        self.translate_map = BackendTranslation()

    def check_quota(self):
        r = requests.get('https://115.com/web/lixian/?ct=lixian&ac=get_quota_package_info', cookies=self.cookies)
        r = json.loads(r.text)
        return '{} / {}'.format(
            r['surplus'], r['count']
        )

    def get_oof_userid(self):
        r = requests.get('https://115.com/?cid=0&offset=0&mode=wangpan', cookies=self.cookies)
        userid_filter = r'.*user_id\ \=\ \'(\d*)\'\;'
        a = r.text.split('\n')
        for l in a:
            if 'user_id =' in l:
                x = re.match(userid_filter, l)
                return x.groups()[0]

    def get_oof_signiture(self):
        now = datetime.now()
        r_url = 'http://115.com/?ct=offline&ac=space&_={}'

        r = requests.get(r_url.format(now), cookies=self.cookies)
        try:
            r_json = json.loads(r.text)
        except json.decoder.JSONDecodeError:
            raise Exception(self.translate_map['oof_cookie_error'])

        return r_json['sign'], r_json['time']

    def post_magnet_to_oof(self, magnet: str):
        post_url = 'http://115.com/web/lixian/?ct=lixian&ac=add_task_url'
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        try:
            oof_sign, oof_time = self.get_oof_signiture()
            post_data = {
                'url': magnet,
                'uid': self.get_oof_userid(),
                'sign': oof_sign,
                'time': oof_time
            }

            r = requests.post(post_url, headers=headers, data=post_data, cookies=self.cookies)
            
            json_r = r.json()
            if json_r.get('errno') == 99:
                raise Exception(self.translate_map['oof_code99'])
            elif json_r.get('errno') == 911:
                raise Exception(self.translate_map['oof_code911'].format(magnet=magnet))
            elif json_r.get('errno') == 0:
                print('Successfully add magnet')
                return json_r
        except Exception as e:
            raise Exception(self.translate_map['unknown_e'].format(e=e))
    
    def get_first_lixian_list(self):
        url = 'https://115.com/web/lixian/'
        headers = {"Content-Type": "application/x-www-form-urlencoded"}
        post_data = {'ct': 'lixian', 'ac': 'task_lists'}

        r = requests.post(url, headers=headers, data=post_data, cookies=self.cookies)
        try:
            return r.json()
        except json.decoder.JSONDecodeError as e:
            print(r.text)
            raise e

    def get_task_detail_from_hash(self, hash_str: str):
        """
        Only works if task is in first page
        """
        oof_file_id = None
        task_list = self.get_first_lixian_list().get('tasks', [])
        for task in task_list:
            if task.get('info_hash') == hash_str:
                oof_file_id = task.get('file_id')  # this is actually cid
                break

        if not oof_file_id:
            raise NoTaskException(f'cannot find {hash_str} task from task list')

        url_template = """https://webapi.115.com/files?aid=1&cid={}&o=user_ptime&asc=0&offset=0
        &show_dir=1&limit=56&code=&scid=&snap=0&natsort=1&record_open_time=1&source=&format=json"""
        r = requests.get(url_template.format(oof_file_id), headers=STANDARD_HEADERS, cookies=self.cookies)
        try:
            return r.json()
        except json.decoder.JSONDecodeError as json_e:
            print(r.text)
            raise json_e
        except Exception as other_e:
            print(r.text)
            raise other_e

    @staticmethod
    def filter_task_details(task_detail: dict):
        rt = []
        in_shas = []
        for file_obj in task_detail.get('data', []):
            processed_file_obj = {
                'cid': file_obj.get('cid'),
                'sha': file_obj.get('sha'),
                'pickup_code': file_obj.get('pc'),  # IMPORTANT, used for download
                'size': byte_to_MB(file_obj.get('s', 0)),
            }
            if processed_file_obj['size'] < 200 or processed_file_obj['sha'] in in_shas:
                continue
            else:
                processed_file_obj['size'] = str(processed_file_obj['size'])+'MB'
            in_shas.append(file_obj.get('sha'))
            rt.append(processed_file_obj)

        return rt

    def download_aria_on_pcode(self, cid: str, pickup_code: str):
        referer_url = f'https://115.com/?ct=file&ac=userfile&is_wl_tpl=1&aid=1&cid={cid}'
        download_header = ''
        url = 'http://webapi.115.com/files/download?pickcode={}'.format(pickup_code)

        r = requests.get(url, headers=STANDARD_HEADERS, cookies=self.cookies)
        try:
            # process header for valid cookie
            download_header = dict(r.headers)['Set-Cookie']
            download_header = download_header.split(';')[0]

            file_url = r.json()['file_url']
            aria_r = get_aria2().add_uris([file_url], options={'referer': referer_url, 'header': 
                [f'Cookie: {download_header}', f'User-Agent: {STANDARD_UA}']})
            #TODO: check aria_r for success or not
        except json.decoder.JSONDecodeError as e:
            print(r.text)
            print(f'Error {e} processing {pickup_code}, manual clean up may be needed')
        except requests.exceptions.InvalidSchema as e:
            raise Exception(self.translate_map['aria2_wrong_server'])
        except requests.exceptions.ConnectionError as e:
            raise Exception(self.translate_map['aria2_cannot_contact_server'])

    def handle_jav_download(self, car: str, magnet: str):
        db_conn = JavManagerDB()
        try:
            jav_obj = dict(db_conn.get_by_pk(car))
        except (DoesNotExist, TypeError) as e:
            # typeerror to catch dict(None)
            jav_obj = {'car': car}

        retry_num = 0
        e = None

        # create download using magnet link
        try:
            created_task = self.post_magnet_to_oof(magnet)
            if created_task.get('errcode') == 10008:
                #return {'error': self.translate_map['oof_magnet_exists'].format(car=car)}
                print(f'{car} magnet already exist continue')
        except Exception as create_magnet_e:
            return {'error': self.translate_map['oof_fail_magnet'].format(car=car, create_magnet_e=create_magnet_e)}

        while retry_num < 3:
            try:
                # get task detail from list page
                search_hash = created_task['info_hash']
                task_detail = self.get_task_detail_from_hash(search_hash)
                # filter out unwanted files
                download_files = self.filter_task_details(task_detail)
                if not download_files:
                    return {'error': self.translate_map['oof_no_file'] + f' {car}'}
                break
            except NoTaskException as _e:
                return {'error': self.translate_map['oof_no_task_found'].format(car)}
            except Exception as _e:
                retry_num += 1
                sleep(15)
                print(f'current error: {_e}, retrying')
                e = _e

        # send download info to aria2
        try:
            for download_file in download_files:
                self.download_aria_on_pcode(download_file['cid'], 
                    download_file['pickup_code'])

            # if everything went well, update stat
            jav_obj['stat'] = 4
            db_conn.upcreate_jav(jav_obj)
            return jav_obj
        except Exception as _e:
            print_exc()
            e = _e
                
        return {'error': self.translate_map['oof_general_failure'].format(car=car, retry_num=retry_num, e=e)}

    @staticmethod
    def load_local_cookies(return_all=False):
        raw_cookies = json.load(open(LOCAL_OOF_COOKIES, 'r'))
        if return_all:
            return raw_cookies
        else:
            return {x['name']: x['value'] for x in raw_cookies}

    @staticmethod
    def update_local_cookies(update_dict: dict or list):
        with open(LOCAL_OOF_COOKIES, 'w') as oof_f:
            oof_f.write(json.dumps(update_dict))
        return f'115 cookies updated to local file {LOCAL_OOF_COOKIES}'