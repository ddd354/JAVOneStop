import base64
import os
import requests
import traceback
import argparse
import json

from JavHelper.core.ini_file import return_config_string


def list_emby_actress(emby_url, api_key):
    url = f'{emby_url}emby/Persons?api_key={api_key}'
    return requests.get(url).json()['Items']


def post_image_to_actress(actress_id, image_f, emby_url, api_key):
    with open(image_f, 'rb') as f:
        b6_pic = base64.b64encode(f.read())  # 读取文件内容，转换为base64编码

    url = f'{emby_url}emby/Items/{actress_id}/Images/Primary?api_key={api_key}'
    if image_f.endswith('png'):
        header = {"Content-Type": 'image/png', }
    else:
        header = {"Content-Type": 'image/jpeg', }

    requests.post(url=url, data=b6_pic, headers=header)
    print(f'successfully post actress ID: {actress_id} image\n')
    return 1


def send_emby_images(image_folder_path):
    # init
    num = 0
    up_num = 0

    if not os.path.exists(image_folder_path):
        print('current path: {}'.format(os.getcwd()))
        raise Exception('{} image folder doesn\'t exist, please specify correct path'.format(image_folder_path))

    emby_url = return_config_string(["emby专用", "网址"])
    api_key = return_config_string(["emby专用", "api id"])

    # try correct emby url with /
    if not emby_url.endswith('/'):
        emby_url += '/'

    try:
        for actress in list_emby_actress(emby_url, api_key):
            num += 1
            if num % 500 == 0:
                print('have processed', num, '个actress')

            actress_name = actress['Name']
            actress_id = actress['Id']
            res_info = {'log': f'processed 女优：{actress_name}, ID：{actress_id}'}

            if os.path.isfile(os.path.join(image_folder_path, f'{actress_name}.jpg')):
                file_path = os.path.join(image_folder_path, f'{actress_name}.jpg')
                up_num += post_image_to_actress(actress_id, file_path, emby_url, api_key)

            elif os.path.isfile(os.path.join(image_folder_path, f'{actress_name}.png')):
                file_path = os.path.join(image_folder_path, f'{actress_name}.png')
                up_num += post_image_to_actress(actress_id, file_path, emby_url, api_key)

            else:
                res_info = {'log': f'{actress_name} image file doen\'t exist'}
            print(res_info)

            yield json.dumps(res_info)+'\n'

    except requests.exceptions.ConnectionError:
        print('emby服务端无法访问，请检查：', emby_url, '\n')
    except Exception as err:
        traceback.print_exc()
        print('发生未知错误，请截图给作者：', emby_url, err)

    print(f'成功upload {up_num} 个女优头像！')
    yield json.dumps({'log': f'成功upload {up_num} 个女优头像！'})+'\n'


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Submit AV actress images to emby')
    parser.add_argument('--image-folder-path', required=True, help='parsable path to the image folder directory')
    parser.add_argument('--ini-name', help='filename for ini file')

    args = parser.parse_args()
    send_emby_images(args.image_folder_path, args.ini_name)
