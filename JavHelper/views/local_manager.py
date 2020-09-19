from flask import Blueprint, jsonify, make_response, Response, request
import os
from blitzdb.document import DoesNotExist
import json
from copy import deepcopy

from JavHelper.core import JAVNotFoundException
from JavHelper.core.file_scanner import EmbyFileStructure
from JavHelper.views.parse_jav import parse_single_jav, SOURCES_MAP
from JavHelper.core.ini_file import return_default_config_string
from JavHelper.cache import cache
from JavHelper.scripts.emby_actors import send_emby_images as old_upload
from JavHelper.core.emby_actors import EmbyActorUpload
from JavHelper.utils import resource_path

if return_default_config_string('db_type') == 'sqlite':
    from JavHelper.model.jav_manager import SqliteJavManagerDB as JavManagerDB
else:
    from JavHelper.model.jav_manager import BlitzJavManagerDB as JavManagerDB


local_manager = Blueprint('local_manager', __name__, url_prefix='/local_manager')

@local_manager.route('/migrate_to_sqlite', methods=['GET'])
def migrate_to_sqlite():
    from JavHelper.model.jav_manager import migrate_blitz_to_sqlite
    migrate_blitz_to_sqlite()

    return 'ok'

@local_manager.route('/directory_path', methods=['GET'])
def directory_path():
    return jsonify({'success': return_default_config_string('file_path')})

@local_manager.route('/readme', methods=['GET'])
def readme():
    source_filename_map = {
        'changelog': 'CHANGELOG',
        'main_readme': 'README.md',
        'javdownloader_readme': 'JAV_HELP.md'
    }

    source = request.args.get('source') or 'main_readme'
    
    markdown_file = resource_path(source_filename_map[source])
    return jsonify({'success': open(markdown_file, 'r', encoding='utf8').read()})

@local_manager.route('/partial_search', methods=['GET'])
def partial_search():
    search_string = request.args.get('search_string')

    db_conn = JavManagerDB()
    rt = db_conn.partial_search(search_string)

    return jsonify({'success': [dict(x) for x in rt]})

@local_manager.route('/update_car_ikoa_stat', methods=['GET'])
def update_car_ikoa_stat():
    car = request.args.get('car').upper()
    stat = request.args.get('stat')
    need_ikoa_credit = request.args.get('need_ikoa_credit') or "0"

    db_conn = JavManagerDB()
    db_conn.upcreate_jav({
        'car': car,
        'stat': int(stat),
        'need_ikoa_credit': need_ikoa_credit
    })

    return jsonify({'success': 'ok'})

@local_manager.route('/single_scrape', methods=['POST'])
def single_scrape():
    req_data = json.loads(request.get_data() or '{}')
    each_jav = req_data['update_dict']
    sources = return_default_config_string('jav_obj_priority').split(',')
    errors = []
    emby_folder = EmbyFileStructure(return_default_config_string('file_path'))

    # some processing for postfixes
    postfix, car_str = emby_folder.extract_subtitle_postfix_filename(os.path.splitext(each_jav['file_name'])[0])
    _, car_str = emby_folder.extract_CDs_postfix_filename(car_str)
    each_jav.update({'car': car_str})

    # scrape
    jav_obj = parse_single_jav(each_jav, sources)
    # add chinese subtitle tag if any
    if postfix:
        jav_obj.setdefault('genres', []).append('中字')

    # handle error when all sources fail
    if jav_obj.get('errors') and isinstance(jav_obj['errors'], list) and len(jav_obj['errors']) == len(sources):
        errors.append(json.dumps({'log': '{} process failed, cannot find any info in all sources {}'.format(
            each_jav['car'], sources
        )}))
    elif jav_obj.get('error') and isinstance(jav_obj['error'], str):
        # handle one of the source is not valid
        errors.append(json.dumps({'log': '{} process failed, one of the source within {} is not valid on {}'.format(
            each_jav['car'], sources, jav_obj['error']
        )}))

    # file structure operations
    try:
        jav_obj = emby_folder.create_new_folder(jav_obj)
    except KeyError as e:
        _car = each_jav.get('car', 'Unknown')
        errors.append(json.dumps({'log': f'error: {e}, skipping {_car}'}))
    # write images
    emby_folder.write_images(jav_obj)
    # write nfo
    emby_folder.write_nfo(jav_obj)
    # move video file
    jav_obj = emby_folder.put_processed_file(jav_obj)

    return jsonify({'success': jav_obj, 'error': errors})

@local_manager.route('/update_jav_dict', methods=['POST'])
def update_jav_dict():
    # update db jav dict, also rewrite nfo and images

    req_data = json.loads(request.get_data() or '{}')
    update_dict = req_data['update_dict']

    # update db
    db_conn = JavManagerDB()
    db_conn.upcreate_jav(update_dict)

    file_writer = EmbyFileStructure(return_default_config_string('file_path'))
     # file structure operations
    try:
        jav_obj = file_writer.create_folder_for_existing_jav(update_dict)
    except KeyError as e:
        _car = update_dict.get('car', 'Unknown')
        update_dict.append(json.dumps({'log': f'error: {e}, skipping {_car}'}))
    # write images
    file_writer.write_images(jav_obj)
    # write nfo
    file_writer.write_nfo(jav_obj)
    # move video file
    jav_obj = file_writer.move_existing_file(jav_obj)

    return jsonify({'success': jav_obj})  # post updated jav_obj back to UI

@local_manager.route('/restructure_jav', methods=['POST'])
def restructure_jav():
    req_data = json.loads(request.get_data() or '{}')
    update_dict = req_data['update_dict']

    file_writer = EmbyFileStructure(return_default_config_string('file_path'))
     # file structure operations
    try:
        jav_obj = file_writer.create_folder_for_existing_jav(update_dict)
    except KeyError as e:
        _car = update_dict.get('car', 'Unknown')
        update_dict.append(json.dumps({'log': f'error: {e}, skipping {_car}'}))
    # write images
    file_writer.write_images(jav_obj)
    # write nfo
    file_writer.write_nfo(jav_obj)
    # move video file
    jav_obj = file_writer.move_existing_file(jav_obj)

    return jsonify({'success': 'good'})

@local_manager.route('/rewrite_nfo', methods=['POST'])
def rewrite_nfo():
    req_data = json.loads(request.get_data() or '{}')
    update_dict = req_data['update_dict']

    JavManagerDB().upcreate_jav(update_dict)

    file_writer = EmbyFileStructure(return_default_config_string('file_path'))
    # we can directly call this since it only writes top level key fields
    file_writer.write_nfo(update_dict, verify=True)

    return jsonify({'success': 'good'})

@local_manager.route('/rewrite_images', methods=['POST'])
def rewrite_images():
    req_data = json.loads(request.get_data() or '{}')
    update_dict = req_data['update_dict']

    JavManagerDB().upcreate_jav(update_dict)

    file_writer = EmbyFileStructure(return_default_config_string('file_path'))
    # we can directly call this since it only writes top level key fields
    file_writer.write_images(update_dict, fail_on_error=True)

    return jsonify({'success': 'good'})

@local_manager.route('/get_necessary_sources', methods=['GET'])
def get_necessary_sources():
    return jsonify({'success': return_default_config_string('jav_obj_priority').split(',')})


@local_manager.route('/find_images', methods=['GET'])
def find_images():
    car = request.args.get('car')
    sources = request.args.get('sources')
    if not car:
        return jsonify({'error': 'cannot find car from request'}), 400

    db_conn = JavManagerDB()
    try:
        jav_obj = dict(db_conn.get_by_pk(car))
    except (DoesNotExist, TypeError) as e:
        # typeerror to catch dict(None)
        jav_obj = {'car': car}

    # verify sources
    if not sources:
        sources = return_default_config_string('jav_obj_priority').split(',')
    else:
        sources = str(sources).split(',')

    res = parse_single_jav({'car': car}, sources)

    if res != jav_obj:
        jav_obj.update(res)
        db_conn.upcreate_jav(jav_obj)
    return jsonify({'success': jav_obj})

@local_manager.route('/new_pick_index_rescrape', methods=['GET'])
def new_pick_index_rescrape():
    car = request.args.get('car')
    source = request.args.get('source')
    pick_index = request.args.get('pick_index')
    if not car:
        return jsonify({'error': 'cannot find car from request'}), 400
    if not pick_index.isdigit():
        return jsonify({'error': f'{pick_index} is not a valid index'}), 400

    # incremental pick index jav obj must exists currently
    db_conn = JavManagerDB()
    db_jav_obj = dict(db_conn.get_by_pk(car))
    db_jav_obj_old = deepcopy(db_jav_obj)

    # verify sources
    sources = return_default_config_string('jav_obj_priority').split(',')
    if source not in sources:
        raise Exception(f'{source} is not a valid source for pick index update')

    try:
        scraped_info = SOURCES_MAP[source]({'car': car}, pick_index=int(pick_index)).scrape_jav()
    except JAVNotFoundException:
        errors = (db_jav_obj.get('errors') or [])
        errors.append(
            '{} cannot be found in {}'.format(db_jav_obj['car'], source)
        )
        scraped_info = {'errors': errors}
        print(scraped_info)
    db_jav_obj.update(scraped_info)
    # also save it separate key
    db_jav_obj[source] = scraped_info

    if db_jav_obj_old != db_jav_obj:
        db_conn.upcreate_jav(db_jav_obj)
    return jsonify({'success': db_jav_obj})

@local_manager.route('/clean_up_directory', methods=['GET'])
def clean_up_directory():
    original_root = request.args.get('original_root') or None
    if not original_root:
        return jsonify({'error': 'original_root is required parameter'})

    db_conn = JavManagerDB()
    jav_objs = db_conn.bulk_list()

    for jav_obj in jav_objs:
        if jav_obj.get('directory') and original_root in jav_obj['directory']:
            _temp = jav_obj['directory']
            _temp = _temp.replace(original_root, '')
            print('updating {} to {}'.format(jav_obj['directory'], _temp))
            jav_obj['directory'] = _temp
            db_conn.upcreate_jav(dict(jav_obj))
            #break

    return jsonify({'success': 'ok'})

