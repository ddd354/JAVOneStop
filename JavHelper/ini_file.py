import configparser

from JavHelper.utils import resource_path

DEFAULT_INI = resource_path('settings.ini')
DEFAULT_UPDATE_MAPPING = {
    'enable_proxy': ['代理', '是否使用代理？'],
    'proxy_setup': ['代理', '代理IP及端口'],
    'emby_address': ['emby专用', '网址'],
    'emby_api': ['emby专用', 'API ID'],
    'javlibrary_url': ['其他设置', 'javlibrary网址']
}


def load_ini_file(ini_file_name=DEFAULT_INI):
    config_settings = configparser.RawConfigParser()
    config_settings.read(ini_file_name, encoding='utf-8-sig')
    return config_settings


def write_ini_file(config_obj, ini_file_name=DEFAULT_INI):
    with open(ini_file_name, 'w') as config_f:
        config_obj.write(config_f)

    return f'successfully write {ini_file_name}'


def set_value_ini_file(update_dict: dict, config=load_ini_file()):
    for k, v in update_dict.items():
        if k not in DEFAULT_UPDATE_MAPPING:
            raise Exception(f'{k} is not a valid key field')

        config.set(DEFAULT_UPDATE_MAPPING[k][0], DEFAULT_UPDATE_MAPPING[k][1], v)

    return write_ini_file(config)


def return_config_string(field_path: list, config=load_ini_file()):
    print(f'loading {field_path} from ini file')
    temp = config
    for each_level in field_path:
        if each_level not in temp:
            raise Exception(f'{each_level} not in {temp} config')
        temp = temp[each_level]

    return temp


def recreate_ini(ini_file_name=DEFAULT_INI):
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
    config_settings.set("emby专用", "网址", "")  # supported
    config_settings.set("emby专用", "API ID", "")  # supported
    config_settings.add_section("代理")
    config_settings.set("代理", "是否使用代理？", "否")  # supported
    config_settings.set("代理", "代理IP及端口", "127.0.0.1:1080")  # supported
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
    config_settings.set("其他设置", "javlibrary网址", "http://www.h28o.com/cn/")  # supported
    config_settings.set("其他设置", "javbus网址", "https://www.buscdn.work/")
    config_settings.set("其他设置", "素人车牌(若有新车牌请自行添加)",
                        "LUXU、MIUM、GANA、NTK、ARA、DCV、MAAN、HOI、NAMA、SWEET、SIRO、SCUTE、CUTE、SQB、JKZ")
    config_settings.set("其他设置", "扫描文件类型", "mp4、mkv、avi、wmv、iso、rmvb、MP4")
    config_settings.set("其他设置", "重命名中的标题长度（50~150）", "50")
    config_settings.write(open(ini_file_name, "w", encoding='utf-8-sig'))
    print('写入ini文件成功')
