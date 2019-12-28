import requests


def return_html_text(url, cookies=None, proxies=None, encoding='utf-8'):
    res = requests.get(url, cookies=cookies, proxies=proxies)
    res.encoding = encoding
    return res.text
