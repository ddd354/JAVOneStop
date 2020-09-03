from urllib.parse import parse_qs
from blitzdb.document import DoesNotExist

from JavHelper.core.ini_file import return_default_config_string, return_config_string
from JavHelper.views.parse_jav import parse_single_jav

if return_default_config_string('db_type') == 'sqlite':
    from JavHelper.model.jav_manager import SqliteJavManagerDB as JavManagerDB
else:
    from JavHelper.model.jav_manager import BlitzJavManagerDB as JavManagerDB


def local_set_page(page_template: str, page_num=1, url_parameter=None, config=None):
    """
    local return func
    currently only support stat search
    """
    stat_type = parse_qs(page_template)
    _stat = str(stat_type.get('stat', [0])[0])
    db = JavManagerDB()

    print(f'searching jav with stat {_stat}')
    # search on both stat string and int
    s_result, max_page = db.query_on_filter({'stat': int(_stat)}, page=int(page_num))
    for jav_obj in s_result:
        # get rid of invalid image url from javdb
        if 'jdbimgs' in jav_obj.get('image', ''):
            jav_obj.pop('image')
        elif 'jdbimgs' in jav_obj.get('img', ''):
            jav_obj.pop('img')

        if not jav_obj.get('image') and not jav_obj.get('img'):
            # need to refresh db to get image 
            jav_obj.update(find_images(jav_obj['car']))
    
    return s_result, max_page

def local_multi_search(search_funcs: list, *args, **kwargs):
    for search_func in search_funcs:
        try:
            _rt, _max = search_func(*args, **kwargs)
            if len(_rt) > 0:
                return _rt, _max
        except Exception as e:
            print(f'error {e} occurs, continue to next')
    
    return [], 0

#------------------------------------ utils ---------------------------------------------

def find_images(car: str):
    db_conn = JavManagerDB()
    try:
        jav_obj = dict(db_conn.get_by_pk(car))
    except (DoesNotExist, TypeError) as e:
        # typeerror to catch dict(None)
        jav_obj = {'car': car}

    sources = return_default_config_string('jav_obj_priority').split(',')

    res = parse_single_jav({'car': car}, sources)

    if res != jav_obj:
        jav_obj.update(res)
        db_conn.upcreate_jav(jav_obj)
    return jav_obj