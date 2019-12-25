import base64
import configparser
import os
import requests
import traceback
import argparse

DEFAULT_INI = 'settings.ini'


def recreate_ini(ini_file_name):
    config_settings = configparser.RawConfigParser()
    print('正在重写ini...')
    config_settings.add_section("收集nfo")
    config_settings.set("收集nfo", "是否跳过已存在nfo的文件夹？", "否")
    config_settings.set("收集nfo", "是否收集nfo？", "是")
    config_settings.set("收集nfo", "是否收集javlibrary上的影评？", "是")
    config_settings.set("收集nfo", "nfo中title的格式", "车牌+空格+标题")
    config_settings.set("收集nfo", "是否中字的表现形式", "中字-")
    config_settings.add_section("重命名影片")
    config_settings.set("重命名影片", "是否重命名影片？", "是")
    config_settings.set("重命名影片", "重命名影片的格式", "车牌+空格+标题")
    config_settings.add_section("修改文件夹")
    config_settings.set("修改文件夹", "是否重命名或创建独立文件夹？", "是")
    config_settings.set("修改文件夹", "新文件夹的格式", "【+全部女优+】+车牌")
    config_settings.add_section("归类影片")
    config_settings.set("归类影片", "是否归类影片？", "否")
    config_settings.set("归类影片", "归类的根目录", "所选文件夹")
    config_settings.set("归类影片", "归类的标准", "首个女优")
    config_settings.add_section("下载封面")
    config_settings.set("下载封面", "是否下载封面海报？", "是")
    config_settings.set("下载封面", "DVD封面的格式", "视频+-fanart.jpg")
    config_settings.set("下载封面", "海报的格式", "视频+-poster.jpg")
    config_settings.add_section("kodi专用")
    config_settings.set("kodi专用", "是否收集女优头像", "否")
    config_settings.add_section("emby专用")
    config_settings.set("emby专用", "网址", "http://localhost:8096/")
    config_settings.set("emby专用", "API ID", "")
    config_settings.add_section("代理")
    config_settings.set("代理", "是否使用代理？", "否")
    config_settings.set("代理", "代理IP及端口", "127.0.0.1:1080")
    config_settings.add_section("百度翻译API")
    config_settings.set("百度翻译API", "是否需要日语简介？", "是")
    config_settings.set("百度翻译API", "是否翻译为中文？", "否")
    config_settings.set("百度翻译API", "APP ID", "")
    config_settings.set("百度翻译API", "密钥", "")
    config_settings.add_section("百度人体分析")
    config_settings.set("百度人体分析", "是否需要准确定位人脸的poster？", "否")
    config_settings.set("百度人体分析", "AppID", "")
    config_settings.set("百度人体分析", "API Key", "")
    config_settings.set("百度人体分析", "Secret Key", "")
    config_settings.add_section("其他设置")
    config_settings.set("其他设置", "简繁中文？", "简")
    config_settings.set("其他设置", "javlibrary网址", "http://www.h28o.com/")
    config_settings.set("其他设置", "javbus网址", "https://www.buscdn.work/")
    config_settings.set("其他设置", "素人车牌(若有新车牌请自行添加)",
                        "LUXU、MIUM、GANA、NTK、ARA、DCV、MAAN、HOI、NAMA、SWEET、SIRO、SCUTE、CUTE、SQB、JKZ")
    config_settings.set("其他设置", "扫描文件类型", "mp4、mkv、avi、wmv、iso、rmvb、MP4")
    config_settings.set("其他设置", "重命名中的标题长度（50~150）", "50")
    config_settings.write(open(ini_file_name, "w", encoding='utf-8-sig'))
    print('写入ini文件成功')


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


def send_emby_images(image_folder_path, ini_name=None):
    # init
    num = 0
    up_num = 0
    if not ini_name:
        ini_name = DEFAULT_INI

    if not os.path.exists(image_folder_path):
        raise Exception('{} image folder doesn\'t exist, please specify correct path'.format(image_folder_path))
    if not os.path.isfile(ini_name):
        print('ini file {} doesn\'t exists, recreate one and apply default settings'.format(ini_name))
        recreate_ini(ini_name)

    # 读取配置文件，这个ini文件用来给用户设置重命名的格式和jav网址
    config_settings = configparser.RawConfigParser()
    print('正在读取ini中的设置...')
    try:
        config_settings.read(ini_name, encoding='utf-8-sig')
        emby_url = config_settings.get("emby专用", "网址")
        api_key = config_settings.get("emby专用", "api id")
    except Exception as err:
        print(err)
        traceback.print_exc()
        raise Exception('无法读取ini文件，请修改它为正确格式，或者打开“【ini】重新创建ini.exe”创建全新的ini！')

    print('读取ini文件成功!')

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
            print('女优：', actress_name, 'ID：', actress_id)

            if os.path.isfile(os.path.join(image_folder_path, f'{actress_name}.jpg')):
                file_path = os.path.join(image_folder_path, f'{actress_name}.jpg')
            elif os.path.isfile(os.path.join(image_folder_path, f'{actress_name}.png')):
                file_path = os.path.join(image_folder_path, f'{actress_name}.png')
            else:
                print(f'{actress_name} image file doen\'t exist\n')
                continue
            up_num += post_image_to_actress(actress_id, file_path, emby_url, api_key)

    except requests.exceptions.ConnectionError:
        print('emby服务端无法访问，请检查：', emby_url, '\n')
    except Exception as err:
        traceback.print_exc()
        print('发生未知错误，请截图给作者：', emby_url, err)

    print('\n成功upload', up_num, '个女优头像！\n')
    return up_num


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Submit AV actress images to emby')
    parser.add_argument('--image-folder-path', required=True, help='parsable path to the image folder directory')
    parser.add_argument('--ini-name', help='filename for ini file')

    args = parser.parse_args()
    send_emby_images(args.image_folder_path, args.ini_name)
