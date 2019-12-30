import os

from JavHelper.app import create_app, create_app_backend

if __name__ == '__main__':
    ui_instance = create_app()
    ui_instance.run()

    #os.environ['FLASK_ENV'] = 'development'
    #app = create_app_backend()
    #app.run()
