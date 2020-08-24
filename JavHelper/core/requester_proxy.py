# -*- coding:utf-8 -*-
import requests
import cloudscraper
from time import sleep

from JavHelper.core.ini_file import return_config_string

DEFAULT_HEADERS = {
    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36'
}

def return_post_res(url, data=None, cookies={}, proxies=None, headers=None, encoding='utf-8', behind_cloudflare=False, **kwargs):
    #print(f'accessing {url}')
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

    if behind_cloudflare:
        res = cloudflare_post(url, data, cookies=cookies, proxies=proxies, **kwargs)
    else:
        res = requests.post(url, data, headers=headers, cookies=cookies, proxies=proxies, **kwargs)
    res.encoding = encoding
    return res

def return_get_res(url, cookies={}, proxies=None, headers=None, encoding='utf-8', behind_cloudflare=False):
    #print(f'accessing {url}')
    if not headers:
        headers = DEFAULT_HEADERS

    # read settings from ini file
    use_proxy = return_config_string(['代理', '是否使用代理？'])

    # prioritize passed in proxies
    if use_proxy == '是' and not proxies:
        proxies = return_config_string(['代理', '代理IP及端口'])

    if behind_cloudflare:
        res = cloudflare_get(url, cookies=cookies, proxies=proxies)
    else:
        res = requests.get(url, headers=headers, cookies=cookies, proxies=proxies)
    res.encoding = encoding
    return res


def return_html_text(url, cookies={}, proxies=None, encoding='utf-8', behind_cloudflare=False):
    #print(f'accessing {url}')
    # read settings from ini file
    use_proxy = return_config_string(['代理', '是否使用代理？'])

    # prioritize passed in proxies
    if use_proxy == '是' and not proxies:
        proxies = return_config_string(['代理', '代理IP及端口'])

    if behind_cloudflare:
        res = cloudflare_get(url, cookies=cookies, proxies=proxies)
    else:
        res = requests.get(url, cookies=cookies, proxies=proxies)
    res.encoding = encoding
    return res.text

def cloudflare_get(url, cookies={}, proxies=None):
    retry = 6
    from JavHelper.core.javlibrary import JavLibraryScraper
    while retry > 0:
        try:
            cookies.update(JavLibraryScraper.load_local_cookies())  # update cloudflare cookies when updating
            res = cloudscraper.create_scraper().get(url, cookies=cookies, proxies=proxies)
            #print(res.text)
            return res
        #except cloudscraper.exceptions.CloudflareIUAMError:
        except Exception as e:
            print(f'cloudflare get failed on {e}, retrying {url}')
            retry = retry - 1
            sleep(5)
    
    raise Exception(f'cloudflare get {url} failed')

def cloudflare_post(url, data=None, cookies={}, proxies=None):
    retry = 6
    from JavHelper.core.javlibrary import JavLibraryScraper
    while retry > 0:
        try:
            cookies.update(JavLibraryScraper.load_local_cookies())  # update cloudflare cookies when updating
            res = cloudscraper.create_scraper().post(url, data, cookies=cookies, proxies=proxies)
            #print(res.text)
            return res
        #except cloudscraper.exceptions.CloudflareIUAMError:
        except Exception as e:
            print(f'cloudflare get failed on {e}, retrying {url}')
            retry = retry - 1
            sleep(5)
    
    raise Exception(f'cloudflare get {url} failed')