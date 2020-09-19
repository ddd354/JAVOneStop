import configparser

from JavHelper.utils import resource_path
from JavHelper.core import IniNotFoundException

DEFAULT_INI = resource_path('settings.ini')
DEFAULT_UPDATE_MAPPING = {
    'aria_address': ["Aria2设置", "Aria2地址"],
    'aria_port': ["Aria2设置", "Aria2端口"],
    'aria_token': ["Aria2设置", "Aria2 Token"],
    'file_path': ["本地设置", "默认填入目录"],
    'preserve_subtitle_filename': ["本地设置", '保留中文字幕文件名'],
    'subtitle_filename_postfix': ["本地设置", '中文字幕文件名后缀'],
    'handle_multi_cds': ["本地设置", '自动处理多CD'],
    'enable_proxy': ['代理', '是否使用代理？'],
    'proxy_setup': ['代理', '代理IP及端口'],
    'emby_address': ['emby专用', '网址'],
    'emby_api': ['emby专用', 'API ID'],
    'javlibrary_url': ['其他设置', 'javlibrary网址'],
    'jav_obj_priority': ['其他设置', '刮削信息优先度'],
    'folder_structure': ['本地设置', '保存路径模板'],
    'display_language': ["其他设置", "界面语言(cn/en)"],
    'remove_string': ["重命名影片", "移除字符"],
    'ikoa_dmmc_server': ["其他设置", "ikoa_dmmc"],
    'db_type': ["其他设置", "数据库类型"],
}
DEFAULT_UPDATE_VALUE_MAPPING = {
    'aria_address': "",
    'aria_port': "",
    'aria_token': "",
    'file_path': "",
    'preserve_subtitle_filename': "是",
    'subtitle_filename_postfix': "-C,-c",
    'handle_multi_cds':  "是",
    'enable_proxy': "否",
    'proxy_setup': "",
    'emby_address': "",
    'emby_api': "",
    'javlibrary_url': "http://www.p42u.com/cn/",
    'jav_obj_priority': "javlibrary,javbus,javdb,arzon",
    'folder_structure': "{year}/{car}",
    'display_language': 'cn',
    'remove_string': '',
    'ikoa_dmmc_server': '',
    'db_type': 'blitz'
}

def verify_ini_file(ini_file_name=DEFAULT_INI):
    """
    Verify ini file is valid and contains all the mapped field that the program loads
    """
    config_settings = configparser.RawConfigParser()
    config_settings.read(ini_file_name, encoding='utf-8-sig')

    for key_field, field_path in DEFAULT_UPDATE_MAPPING.items():
        try:
            return_config_string(field_path, config=config_settings)
        except IniNotFoundException:
            # field not found, add default value
            set_value_ini_file({key_field: DEFAULT_UPDATE_VALUE_MAPPING[key_field]}, config=config_settings)


def load_ini_file(ini_file_name=DEFAULT_INI):
    config_settings = configparser.RawConfigParser()
    config_settings.read(ini_file_name, encoding='utf-8-sig')
    return config_settings


def write_ini_file(config_obj, ini_file_name=DEFAULT_INI):
    with open(ini_file_name, 'w', encoding='utf-8-sig') as config_f:
        config_obj.write(config_f)

    return f'successfully write {ini_file_name}'


def set_value_ini_file(update_dict: dict, config=None):
    # reload ini file content
    if not config:
        config = load_ini_file()

    for k, v in update_dict.items():
        if k not in DEFAULT_UPDATE_MAPPING:
            raise Exception(f'{k} is not a valid key field')

        config.set(DEFAULT_UPDATE_MAPPING[k][0], DEFAULT_UPDATE_MAPPING[k][1], v)

    return write_ini_file(config)


def return_default_config_string(field_name: str):
    #print(f'loading {field_path} from ini file')
    if field_name not in DEFAULT_UPDATE_MAPPING:
        raise IniNotFoundException(f'{field_name} is not a valid default field')
    return return_config_string(DEFAULT_UPDATE_MAPPING[field_name])


def return_config_string(field_path: list, config=None):
    if not config:
        config = load_ini_file()
    #print(f'loading {field_path} from ini file')
    temp = config
    for each_level in field_path:
        if each_level not in temp:
            raise IniNotFoundException(f'{each_level} is not in the config file, config will be missing in form')

        temp = temp[each_level]
    return temp


def recreate_ini(ini_file_name=DEFAULT_INI):
    config_settings = configparser.RawConfigParser()
    print('正在重写ini...')
    config_settings.add_section("Aria2设置")
    config_settings.set("Aria2设置", "Aria2地址", "")
    config_settings.set("Aria2设置", "Aria2端口", "")
    config_settings.set("Aria2设置", "Aria2 Token", "")
    config_settings.add_section("本地设置")
    config_settings.set("本地设置", "默认填入目录", "")
    config_settings.set("本地设置", "保存路径模板", "{year}/{car}")
    config_settings.set("本地设置", "保留中文字幕文件名", "是")
    config_settings.set("本地设置", "中文字幕文件名后缀", "-C,-c")
    config_settings.set("本地设置", "自动处理多CD", "是")
    config_settings.add_section("重命名影片")
    config_settings.set("重命名影片", "移除字符", "")
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
    config_settings.set("其他设置", "界面语言(cn/en)", "cn")
    config_settings.set("其他设置", "刮削信息优先度", "javlibrary,javbus,javdb,arzon")
    config_settings.set("其他设置", "javlibrary网址", "http://www.p42u.com/cn/")  # supported
    config_settings.set("其他设置", "javbus网址", "https://www.buscdn.work/")
    config_settings.set("其他设置", "ikoa_dmmc", "")
    config_settings.set("其他设置", "扫描文件类型", "mp4、mkv、avi、wmv、iso、rmvb、MP4")
    config_settings.set("其他设置", "重命名中的标题长度（50~150）", "50")
    config_settings.write(open(ini_file_name, "w", encoding='utf-8-sig'))
    print('写入ini文件成功')
