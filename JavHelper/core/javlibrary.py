# -*- coding:utf-8 -*-
from lxml import etree
import re
from copy import deepcopy

from JavHelper.core import JAVNotFoundException
from JavHelper.core.requester_proxy import return_html_text, return_post_res
from JavHelper.core.utils import re_parse_html, re_parse_html_list_field, defaultlist
from JavHelper.core.ini_file import return_config_string


DEFAULT_JAVLIB_CONFIG = {
    'search_field': {
        'title': r'<title>([a-zA-Z]{1,6}-\d{1,5}.+?) - JAVLibrary</title>',
        'studio': r'rel="tag">(.+?)</a> &nbsp;<span id="maker_',
        'release_date': r'<td class="text">(\d\d\d\d-\d\d-\d\d)</td>',
        'year': r'<td class="text">(\d\d\d\d)-\d\d-\d\d</td>',
        'length': r'<td><span class="text">(\d+?)</span>',
        'director': r'rel="tag">(.+?)</a> &nbsp;<span id="director',
        'image': r'src="(.+?)" width="600" height="403"',
        'score': r'&nbsp;<span class="score">\((.+?)\)</span>',
    },
    'search_list_field': {
        'genres': r'category tag">(.+?)</a>'
    },
    'proxies': None,
    'cookies': None
}


def parse_javlib(jav_obj: dict, config=None) -> dict:
    # force to get url from ini file each time
    javlib_url = return_config_string(['其他设置', 'javlibrary网址'])

    # fill missing parameters
    if config == None:
        config = deepcopy(DEFAULT_JAVLIB_CONFIG)

    # perform search first
    lib_search_url = javlib_url + 'vl_searchbyid.php?keyword=' + jav_obj['car']
    print(f'accessing {lib_search_url}')

    jav_html = return_html_text(lib_search_url, proxies=config['proxies'], cookies=config['cookies'])
    # 搜索结果的网页，大部分情况就是这个影片的网页，也有可能是多个结果的网页
    # 尝试找标题，第一种情况：找得到，就是这个影片的网页
    if jav_obj['car'].upper().startswith('T28'):
        # special filter for T28
        title_re = re.search(r'<title>((T28-|T-28)\d{1,5}.+?) - JAVLibrary<\/title>', jav_html)
        # update title re
        config['search_field']['title'] = r'<title>((T28-|T-28)\d{1,5}.+?) - JAVLibrary<\/title>'
    elif jav_obj['car'].upper().startswith('R18'):
        # special filter for T28
        title_re = re.search(r'<title>((R18-|R-18)\d{1,5}.+?) - JAVLibrary<\/title>', jav_html)
        # update title re
        config['search_field']['title'] = r'<title>((R18-|R-18)\d{1,5}.+?) - JAVLibrary<\/title>'
    else:
        title_re = re.search(r'<title>([a-zA-Z]{1,6}-\d{1,5}.+?) - JAVLibrary</title>', jav_html)  # 匹配处理“标题”
    # 搜索结果就是AV的页面
    if title_re:
        pass
    # 第二种情况：搜索结果可能是两个以上，所以这种匹配找不到标题，None！
    else:  # 继续找标题，但匹配形式不同，这是找“可能是多个结果的网页”上的第一个标题
        search_results = re.findall(r'v=javli(.+?)" title=".+?-\d+?[a-z]? ', jav_html)
        # 搜索有几个结果，用第一个AV的网页，打开它
        if search_results:
            # 只有一个结果，其实其他的被忽略的，比如avop-00127bod
            result_first_url = javlib_url + '?v=javli' + search_results[0]
            jav_html = return_html_text(result_first_url, proxies=config['proxies'], cookies=config['cookies'])
        # 第三种情况：搜索不到这部影片，搜索结果页面什么都没有
        else:
            raise JAVNotFoundException('{} cannot be found in javlib'.format(jav_obj['car']))

    print('>>正在处理：', jav_obj['car'])
    # process standard fields
    # we can use update here since each field only allows one value
    jav_obj.update(re_parse_html(config['search_field'], jav_html))
    # process list fields
    for k, v in config['search_list_field'].items():
        for each_v in re.findall(v, jav_html):
            jav_obj.setdefault(k, []).append(each_v)

    # get rid of car in title
    if 'title' in jav_obj:
        title_re = re.search(r'(.+?) (.+)', jav_obj['title'])
        if title_re:
            jav_obj['title'] = title_re.group(2)
    else:
        import ipdb; ipdb.set_trace()

    # process score to make it more realistic
    if 'score' in jav_obj:
        score = (float(jav_obj['score']) - 4) * 5 / 3
        if score >= 0:
            score = '%.1f' % score
        jav_obj['score'] = str(float(score) * 10)

    # extra processing for actress names for japanese name
    jav_obj['all_actress'] = []
    actress_jav_ids = r'<a href=\"vl_star\.php\?s=(.+?)\" rel=\"tag\">(.+?)</a>'
    if True and 'ja' not in javlib_url:  # read from ini file
        javlib_url_jp = javlib_url.replace('cn', 'ja')
        for act_id_re in re.findall(actress_jav_ids, jav_html):
            if len(act_id_re) != 2:
                print(f'skipping {act_id_re}, not enough info')
                continue

            ind_url_jp = javlib_url_jp + f'vl_star.php?s={act_id_re[0]}'
            print(f'requesting {ind_url_jp} for jp name')
            jp_html_text = return_html_text(ind_url_jp)

            # compare jp with cn name
            try:
                jp_name_filter = r'<div class="boxtitle">(.+?)のビデオ</div>'
                jp_name = re.search(jp_name_filter, jp_html_text).group(1)
                act_name = act_id_re[1]
            except:
                import ipdb; ipdb.set_trace()

            # merge jp into cn name
            if jp_name != act_name:
                act_name = '{}[{}]'.format(act_name, jp_name)

            jav_obj['all_actress'].append(act_name)
            

    # force set year if not detected
    if not jav_obj.get('year'):
        jav_obj['year'] = 'unknown'

    return jav_obj

def find_max_page(search_str: str):
    search_pattern = r'.*?page=(\d*)'
    try:
        search_result = re.match(search_pattern, search_str).groups()[0]
        return str(search_result)
    except Exception as e:
        print(e)
        return None

def javlib_set_page(page_prefix: str, page_num: int, config=None) -> dict:
    xpath_dict = {
        'title': '//*[@class="video"]/a/@title',
        'javid': '//*[@class="video"]/@id',
        'img': '//*[@class="video"]/a/img/@src',
        'car': '//*/div[@class="video"]/a/div[@class="id"]/text()'
    }
    xpath_max_page = '//*/div[@class="page_selector"]/a[@class="page last"]/@href'

    # force to get url from ini file each time
    javlib_url = return_config_string(['其他设置', 'javlibrary网址'])

    # fill missing parameters
    if config == None:
        config = deepcopy(DEFAULT_JAVLIB_CONFIG)

    lib_url = javlib_url + page_prefix + str(page_num)
    print(f'accessing {lib_url}')

    res = return_post_res(lib_url, proxies=config['proxies'], cookies=config['cookies']).content
    root = etree.HTML(res)

    jav_objs_raw = defaultlist(dict)
    for k, v in xpath_dict.items():
        _values = root.xpath(v)
        for _i, _value in enumerate(_values):
            jav_objs_raw[_i].update({k: _value})

    try:
        max_page = find_max_page(root.xpath(xpath_max_page)[0])
    except IndexError:
        max_page = page_num
    
    return jav_objs_raw, max_page