from flask import Blueprint, jsonify

from JavHelper.scripts.emby_actors import send_emby_images


emby_actress = Blueprint('emby_actress', __name__, url_prefix='/emby_actress')


@emby_actress.route('/set_actress_images', methods=['GET'])
def set_actress_images():
    send_emby_images('JavHelper/static/nv')
    return jsonify({'status': 'good'})
