from math import ceil
from time import sleep
import json

from blitzdb import Document, FileBackend
from blitzdb.document import DoesNotExist
import dataset
import sqlalchemy


class JavObj(Document):
    pass


class SqliteJavManagerDB:
    def __init__(self):
        retry = 0
        while retry < 3:
            try:
                self.whole_db = dataset.connect('sqlite:///jav_manager.sqlite', engine_kwargs={'connect_args': {'check_same_thread': False}})
                self.jav_db = self.whole_db['jav_obj']
                break
            except Exception as e:
                print(f'read file sqlite db error {e}, gonna retry')
                retry += 1
                sleep(5)

    def create_indexes(self):
        #print('creating index for stat')
        #self.jav_db.create_index(JavObj, 'stat')
        #raise NotImplementedError('create_indexes hasn\'t been implemented')
        pass

    def rebuild_index(self):
        #raise NotImplementedError('rebuild_index hasn\'t been implemented')
        #self.jav_db.rebuild_index(self.jav_db.get_collection_for_cls(JavObj), 'stat')
        pass

    def bulk_list(self):
        return self.jav_db.find()

    def partial_search(self, search_string: str):
        rt = self.whole_db.query("SELECT * FROM jav_obj WHERE `car` LIKE '{}%' LIMIT 20".format(search_string))
        return [self.reverse_prepare_obj(x) for x in rt]

    def query_on_filter(self, filter_on: dict, page=1, limit=8):
        max_page = self.whole_db.query("SELECT COUNT(*) FROM jav_obj WHERE {}={}".format(
            list(filter_on.keys())[0], list(filter_on.values())[0]
        )).next()
        print(max_page)
        rt_max_page = max_page['COUNT(*)'] // limit + 1

        rt = self.whole_db.query("SELECT * FROM jav_obj WHERE {}={} ORDER BY id asc LIMIT {} OFFSET {}".format(
            list(filter_on.keys())[0], list(filter_on.values())[0], limit, (page-1)*limit
        ))
        return [self.reverse_prepare_obj(x) for x in rt], rt_max_page

    @staticmethod
    def reverse_prepare_obj(input_obj: dict):
        if input_obj is None:
            return input_obj

        rt = {}
        for k, v in input_obj.items():
            if k.startswith('_l_') and v:
                _k = k[3:]
                _v = json.loads(v)['list']
                rt[_k] = _v
            elif k.startswith('_j_') and v:
                _k = k[3:]
                _v = json.loads(v)
                rt[_k] = _v
            elif v is not None:
                rt[k] = v
        return rt

    @staticmethod
    def prepare_obj(input_obj: dict):
        rt = {}
        for k, v in input_obj.items():
            if isinstance(v, list):
                _k = '_l_{}'.format(k)
                _v = json.dumps({'list': v})
            elif isinstance(v, dict):
                _k = '_j_{}'.format(k)
                _v = json.dumps(v)
            else:
                _k = k
                _v = v
            rt[_k] = _v
        return rt

    def upcreate_jav(self, jav_obj: dict):
        # uniform car to upper case
        jav_obj['car'] = str(jav_obj['car']).upper()
        try:
            # cannot use if to avoid 0 problem
            jav_obj['stat'] = int(jav_obj['stat'])
        except KeyError:
            import ipdb; ipdb.set_trace()
            jav_obj['stat'] = 2

        # convert nested field to text
        jav_obj = self.prepare_obj(jav_obj)

        self.jav_db.upsert(jav_obj, ['car'])
        #print(f'written \n {jav_obj} \n')

    def get_by_pk(self, pk: str):
        return self.reverse_prepare_obj(self.jav_db.find_one(car=pk.upper()))

    def pk_exist(self, pk: str):
        rt = self.jav_db.find_one(car=pk.upper())
        if rt:
            return True
        else:
            return False


class BlitzJavManagerDB:
    def __init__(self):
        retry = 0
        while retry < 3:
            try:
                self.jav_db = FileBackend('jav_manager.db')
                break
            except Exception as e:
                print(f'read file db error {e}, gonna retry')
                retry += 1
                sleep(5)
        
        if not self.jav_db:
            raise Exception('read local db error')

    def create_indexes(self):
        print('creating index for stat')
        self.jav_db.create_index(JavObj, 'stat')

    def rebuild_index(self):
        self.jav_db.rebuild_index(self.jav_db.get_collection_for_cls(JavObj), 'stat')

    def bulk_list(self):
        return self.jav_db.filter(JavObj, {})

    def partial_search(self, search_string: str):
        rt = self.jav_db.filter(JavObj, {'pk': {'$regex': search_string.upper()}})[:20]
        return rt

    def query_on_filter(self, filter_on: dict, page=1, limit=8):
        rt = self.jav_db.filter(JavObj, filter_on)
        rt_max_page = ceil(len(rt)/limit)
        rt_list = rt[(page-1)*limit : (page)*limit]

        return [dict(x) for x in rt_list], rt_max_page

    def upcreate_jav(self, jav_obj: dict):
        # uniform car to upper case
        jav_obj['car'] = str(jav_obj['car']).upper()
        # set pk to car
        jav_obj['pk'] = jav_obj['car']

        # pull existing data since this is update function
        try:
            current_jav_obj = dict(self.get_by_pk(jav_obj['car']))
            #print(f'current dict {current_jav_obj}')
            # overwrite current db dict with input dict
            current_jav_obj.update(jav_obj)
            jav_obj = current_jav_obj
        except DoesNotExist:
            # set default to no opinion
            #0-want, 1-viewed, 2-no opinion 3-local 4-downloading 5-iceboxed
            jav_obj.setdefault('stat', 2)
        # safety measure to set stat to int
        jav_obj['stat'] = int(jav_obj['stat'])
        _jav_doc = JavObj(jav_obj)
        _jav_doc.save(self.jav_db)
        self.jav_db.commit()
        #print('writed ', jav_obj)

    def get_by_pk(self, pk: str):
        return self.jav_db.get(JavObj, {'pk': pk.upper()})

    def pk_exist(self, pk: str):
        try:
            self.jav_db.get(JavObj, {'pk': pk.upper()})
            return True
        except DoesNotExist:
            return False


def migrate_blitz_to_sqlite():
    #from JavHelper.model.jav_manager import migrate_blitz_to_sqlite
    b_db = BlitzJavManagerDB()
    s_db = SqliteJavManagerDB()
    n = 0

    for obj in b_db.bulk_list():
        _obj = dict(obj)
        s_db.upcreate_jav(obj)
        n += 1
        if n % 1000 == 0:
            print(f'processed {n}')