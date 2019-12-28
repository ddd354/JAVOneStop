# -*- coding:utf-8 -*-
import os

from flask import Blueprint, jsonify, request

"""
This endpoint is pretty dangerous since it needs permission to r/w no-app directory
"""

directory_scan = Blueprint('directory_scan', __name__, url_prefix='/directory_scan')


@directory_scan.route('/pre_scan_files', methods=['GET'])
def pre_scan_files():
    path = request.args.get('path')
    file_list = []

    # handle usual error
    if not os.path.exists(path):
        return jsonify({'response': [{'file_name': f'{path} does not exist'}]}), 400
    if not os.path.isdir(path):
        return jsonify({'response': [{'file_name': f'{path} is not a valid directory for scan'}]}), 400

    for file_name in os.listdir(path):
        # filter out dot file
        if file_name.startswith('.'):
            continue
        # don't care about directory size
        elif os.path.isdir(os.path.join(path, file_name)):
            file_list.append({'file_name': file_name, 'size': 'folder - will not process'})
        else:
            file_size = os.path.getsize(os.path.join(path, file_name)) >> 20
            file_list.append({'file_name': file_name, 'size': f'{file_size}MB'})

    return jsonify({'response': file_list})
