# -*- coding:utf-8 -*-
import requests

from JavHelper.core.ini_file import return_config_string

DEFAULT_HEADERS = {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36'
}

def return_post_res(url, data=None, cookies=None, proxies=None, headers=None, encoding='utf-8'):
    if not headers:
        headers = DEFAULT_HEADERS

    # read settings from ini file
    use_proxy = return_config_string(['代理', '是否使用代理？'])

    # prioritize passed in proxies
    if use_proxy == '是' and not proxies:
        proxies = return_config_string(['代理', '代理IP及端口'])
    else:
        pass
        #print('not using proxy for requests')

    res = requests.post(url, data, headers=headers, cookies=cookies, proxies=proxies)
    res.encoding = encoding
    return res

def return_get_res(url, cookies=None, proxies=None, headers=None, encoding='utf-8'):
    if not headers:
        headers = DEFAULT_HEADERS

    # read settings from ini file
    use_proxy = return_config_string(['代理', '是否使用代理？'])

    # prioritize passed in proxies
    if use_proxy == '是' and not proxies:
        proxies = return_config_string(['代理', '代理IP及端口'])

    res = requests.get(url, headers=headers, cookies=cookies, proxies=proxies)
    res.encoding = encoding
    return res


def return_html_text(url, cookies=None, proxies=None, encoding='utf-8'):
    # read settings from ini file
    use_proxy = return_config_string(['代理', '是否使用代理？'])

    # prioritize passed in proxies
    if use_proxy == '是' and not proxies:
        proxies = return_config_string(['代理', '代理IP及端口'])

    res = requests.get(url, cookies=cookies, proxies=proxies)
    res.encoding = encoding
    return res.text
