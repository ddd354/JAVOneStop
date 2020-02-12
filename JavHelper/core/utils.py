import re
import requests
from PIL import Image


def byte_to_MB(some_input):
    if isinstance(some_input, int) or str(some_input).isdigit():
        return int(some_input)/1024/1024
    else:
        return 0

class defaultlist(list):
    def __init__(self, fx):
        self._fx = fx

    def __setitem__(self, index, value):
        while len(self) <= index:
            self.append(self._fx())
        list.__setitem__(self, index, value)

    def __getitem__(self, index):
        while len(self) <= index:
            self.append(self._fx())
        return super(defaultlist, self).__getitem__(index)


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