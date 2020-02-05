import os

from JavHelper.app import create_app

if __name__ == '__main__':
    os.environ['FLASK_ENV'] = 'development'
    app = create_app()
    app.run()
