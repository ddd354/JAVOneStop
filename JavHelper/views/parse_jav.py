# -*- coding:utf-8 -*-
from flask import Blueprint, jsonify, request

from JavHelper.core import JAVNotFoundException
from JavHelper.core.javlibrary import parse_javlib
from JavHelper.core.arzon import parse_arzon
from JavHelper.core.file_scanner import EmbyFileStructure


parse_jav = Blueprint('parse_jav', __name__, url_prefix='/parse_jav')
SOURCES_MAP = {
    'javlibrary': parse_javlib,
    'arzon': parse_arzon
}


@parse_jav.route('/parse_emby_folder', methods=['GET'])
def parse_emby_folder():
    path = request.args.get('path')
    sources = request.args.get('sources')

    # verify sources
    if not sources:
        sources = ['javlibrary', 'arzon']
    else:
        sources = str(sources).split(',')

    emby_folder = EmbyFileStructure(path)
    # scan folder
    emby_folder.scan_emby_root_path()

    processed = []

    for each_jav in emby_folder.file_list:
        # scrape
        jav_obj = parse_single_jav(each_jav, sources)

        # file structure operations
        # write images
        emby_folder.write_images(jav_obj)
        # write nfo
        emby_folder.write_nfo(jav_obj)
        processed.append(each_jav['car'])

    return jsonify({'success': processed})


@parse_jav.route('/parse_unprocessed_folder', methods=['GET'])
def parse_unprocessed_folder():
    path = request.args.get('path')
    sources = request.args.get('sources')

    # verify sources
    if not sources:
        sources = ['javlibrary', 'arzon']
    else:
        sources = str(sources).split(',')

    emby_folder = EmbyFileStructure(path)
    # scan folder
    emby_folder.scan_new_root_path()

    processed = []

    for each_jav in emby_folder.file_list:
        # scrape
        jav_obj = parse_single_jav(each_jav, sources)

        # file structure operations
        # move video file
        jav_obj = emby_folder.put_processed_file(jav_obj)
        # write images
        emby_folder.write_images(jav_obj)
        # write nfo
        emby_folder.write_nfo(jav_obj)
        processed.append(each_jav['car'])

    return jsonify({'success': processed})


@parse_jav.route('/parse_single', methods=['GET'])
def parse_single():
    car = request.args.get('car')
    sources = request.args.get('sources')
    if not car:
        return jsonify({'error': 'cannot find car from request'}), 400

    # verify sources
    if not sources:
        sources = ['javlibrary', 'arzon']
    else:
        sources = str(sources).split(',')

    res = parse_single_jav({'car': car}, sources)

    return jsonify({'car': car, 'sources': sources, 'parsed_output': res})

# ---------------------------utilities-------------------------------


def parse_single_jav(jav_obj: dict, sources):
    for scrape in sources:
        if scrape not in SOURCES_MAP:
            return jsonify({'error': f'{scrape} is not a valid source'}), 400

    for scrape in sources:
        try:
            scraped_info = SOURCES_MAP[scrape](jav_obj)
        except JAVNotFoundException:
            errors = (jav_obj.get('errors') or [])
            errors.append(
                '{} cannot be found in {}'.format(jav_obj['car'], scrape)
            )
            scraped_info = {'errors': errors}
            print(scraped_info)
        jav_obj.update(scraped_info)

    return jav_obj
