# -*- coding:utf-8 -*-
import requests

from JavHelper.ini_file import return_config_string


def return_html_text(url, cookies=None, proxies=None, encoding='utf-8'):
    # read settings from ini file
    use_proxy = return_config_string(['代理', '是否使用代理？'])

    # prioritize passed in proxies
    if use_proxy == '是' and not proxies:
        proxies = return_config_string(['代理', '代理IP及端口'])

    res = requests.get(url, cookies=cookies, proxies=proxies)
    res.encoding = encoding
    return res.text
