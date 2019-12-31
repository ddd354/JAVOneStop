import re
import requests
from PIL import Image


def re_parse_html(config, html_text):
    info = {}
    for k, v in config.items():
        parsed_info = re.search(v, html_text)
        if str(parsed_info) != 'None':
            info[k] = parsed_info.group(1)

    return info


def re_parse_html_list_field(config, html_text):
    info = {}
    for k, v in config.items():
        info[k] = re.findall(v, html_text)

    return info