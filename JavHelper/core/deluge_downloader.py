import requests
import json
from datetime import datetime
import re
from blitzdb.document import DoesNotExist
from time import sleep
from traceback import print_exc

from JavHelper.core.backend_translation import BackendTranslation
from JavHelper.core.ini_file import return_default_config_string

if return_default_config_string('db_type') == 'sqlite':
    from JavHelper.model.jav_manager import SqliteJavManagerDB as JavManagerDB
else:
    from JavHelper.model.jav_manager import BlitzJavManagerDB as JavManagerDB


class DelugeDownloader:
    @staticmethod
    def create_deluge_cookies(url: str, secret: str):
        res = requests.post(url, json={'id': 0, 'method': 'auth.login', 'params': [secret]})
        if res.json().get('result'):
            return res.cookies
        else:
            raise Exception('cannot connect to deluge server {} with secret {}'.format(url, secret))

    def __init__(self):
        self.deluge_address = '{}json'.format(return_default_config_string('deluge_address'))
        deluge_secret = return_default_config_string('deluge_secret')
        self.cookies = self.create_deluge_cookies(self.deluge_address, deluge_secret)
        self.translate_map = BackendTranslation()

    def handle_jav_download(self, car: str, magnet: str):
        db_conn = JavManagerDB()
        try:
            jav_obj = dict(db_conn.get_by_pk(car))
        except (DoesNotExist, TypeError) as e:
            # typeerror to catch dict(None)
            jav_obj = {'car': car}

        retry_num = 0
        e = None

        # send download info to aria2
        try:
            res = requests.post(self.deluge_address, json={
                    'id': 0, 'method': 'core.add_torrent_magnet', 'params': [magnet, {}]
                }, cookies=self.cookies).json()
            
            if res.get('result'):
                # if everything went well, update stat
                jav_obj['stat'] = 4
                db_conn.upcreate_jav(jav_obj)
                return jav_obj
            else:
                raise Exception(res.get('error', {}).get('message'))
        except Exception as _e:
            print_exc()
            e = _e

        return {'error': self.translate_map['oof_general_failure'].format(car=car, retry_num=retry_num, e=e)}
