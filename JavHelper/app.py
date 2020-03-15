# -*- coding:utf-8 -*-
import os
from flask import Flask, render_template, jsonify, send_from_directory
from werkzeug.exceptions import HTTPException
from traceback import format_exc, print_exc

from JavHelper.core.ini_file import recreate_ini, DEFAULT_INI, verify_ini_file
# init setting file
if not os.path.isfile(DEFAULT_INI):
    print('ini file {} doesn\'t exists, recreate one and apply default settings'.format(DEFAULT_INI))
    recreate_ini(DEFAULT_INI)
# verify all fields exist
verify_ini_file()

from JavHelper.cache import cache
from JavHelper.model.jav_manager import JavManagerDB
from JavHelper.views.emby_actress import emby_actress
from JavHelper.views.parse_jav import parse_jav
from JavHelper.views.javlib_browser import javlib_browser
from JavHelper.views.javbus_browser import javbus_browser
from JavHelper.views.local_manager import local_manager
from JavHelper.views.scan_directory import directory_scan
from JavHelper.utils import resource_path


def create_app():
    # initialize local db and index
    _db = JavManagerDB()
    _db.create_indexes()

    # create and configure the app
    app = Flask(__name__, template_folder='templates')
    cache.init_app(app)

    app.register_blueprint(emby_actress)
    app.register_blueprint(parse_jav)
    app.register_blueprint(javlib_browser)
    app.register_blueprint(javbus_browser)
    app.register_blueprint(directory_scan)
    app.register_blueprint(local_manager)

    app.config['JSON_AS_ASCII'] = False

    # a simple page that says hello
    @app.route('/')
    def hello():
        return render_template('home.html')

    @app.route('/demo/<path:path>')
    def serve_demo_images(path):
        return send_from_directory(resource_path('demo'), path)

    @app.errorhandler(Exception)
    def handle_exception(e):
        # pass through HTTP errors
        if isinstance(e, HTTPException):
            return e

        print_exc()
        # now you're handling non-HTTP exceptions only
        return jsonify({'error': format_exc()}), 500

    return app
