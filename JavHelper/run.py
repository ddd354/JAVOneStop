import os

from JavHelper.app import create_app

if __name__ == '__main__':
    os.environ['FLASK_ENV'] = 'development'
    app = create_app()
    app.run(threaded=False, host='0.0.0.0', port=8009)
