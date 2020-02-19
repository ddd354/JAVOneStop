from flask import Blueprint, jsonify, make_response, Response, request
import os

from JavHelper.scripts.emby_actors import send_emby_images as old_upload
from JavHelper.core.emby_actors import EmbyActorUpload
from JavHelper.utils import resource_path
from JavHelper.model.jav_manager import JavManagerDB


local_manager = Blueprint('local_manager', __name__, url_prefix='/local_manager')

@local_manager.route('/partial_search', methods=['GET'])
def partial_search():
    search_string = request.args.get('search_string')

    db_conn = JavManagerDB()
    rt = db_conn.partial_search(search_string)

    return jsonify({'success': [dict(x) for x in rt]})

