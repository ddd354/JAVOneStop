from flask import Blueprint, jsonify, make_response, Response
import os

from JavHelper.scripts.emby_actors import send_emby_images as old_upload
from JavHelper.core.emby_actors import EmbyActorUpload
from JavHelper.utils import resource_path


emby_actress = Blueprint('emby_actress', __name__, url_prefix='/emby_actress')


@emby_actress.route('/set_actress_images', methods=['GET'])
def set_actress_images():
    path = resource_path('JavHelper/static/nv')
    def long_process():
        for json_l in EmbyActorUpload().send_emby_images(path):
            yield json_l

    return Response(long_process(), mimetype='text/event-stream')


def actress_image_exists(image_folder_path=resource_path('JavHelper/static/nv')):
    if not os.path.exists(image_folder_path):
        return make_response(jsonify({'status': f'{image_folder_path} doesn\'t exists'}), 403)
    else:
        return jsonify({'status': True})
