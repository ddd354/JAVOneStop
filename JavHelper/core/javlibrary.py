# -*- coding:utf-8 -*-
import re
from copy import copy

from JavHelper.core import JAVNotFoundException
from JavHelper.core.requester_proxy import return_html_text
from JavHelper.core.utils import re_parse_html, re_parse_html_list_field
from JavHelper.ini_file import return_config_string


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
        'genres': r'category tag">(.+?)</a>',
        'all_actress': r'<a href=\"vl_star\.php\?s=.+?\" rel=\"tag\">(.+?)</a>'
    },
    'proxies': None,
    'cookies': None
}


def parse_javlib(jav_obj: dict, config=copy(DEFAULT_JAVLIB_CONFIG)) -> dict:
    # force to get url from ini file each time
    javlib_url = return_config_string(['其他设置', 'javlibrary网址'])

    # fill missing parameters
    if config != DEFAULT_JAVLIB_CONFIG:
        config.update(DEFAULT_JAVLIB_CONFIG)
    # perform search first
    lib_search_url = javlib_url + 'vl_searchbyid.php?keyword=' + jav_obj['car']
    print(f'accessing {lib_search_url}')

    jav_html = return_html_text(lib_search_url, proxies=config['proxies'], cookies=config['cookies'])
    # 搜索结果的网页，大部分情况就是这个影片的网页，也有可能是多个结果的网页
    # 尝试找标题，第一种情况：找得到，就是这个影片的网页
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
    jav_obj.update(re_parse_html(config['search_field'], jav_html))
    # process list fields
    jav_obj.update(re_parse_html_list_field(config['search_list_field'], jav_html))

    # get rid of car in title
    if 'title' in jav_obj:
        title_re = re.search(r'(.+?) (.+)', jav_obj['title'])
        if title_re:
            jav_obj['title'] = title_re.group(2)

    # process score to make it more realistic
    if 'score' in jav_obj:
        score = (float(jav_obj['score']) - 4) * 5 / 3
        if score >= 0:
            score = '%.1f' % score
        jav_obj['score'] = str(float(score) * 10)

    # javlibrary的精彩影评   (.+?\s*.*?\s*.*?\s*.*?) 下面的匹配可能很奇怪，没办法，就这么奇怪
    review = re.findall(
        r'(hidden">.+?</textarea>)</td>\s*?<td class="scores"><table>\s*?<tr><td><span class="scoreup">\d\d+?</span>',
        jav_html, re.DOTALL)
    if len(review) != 0:
        plot_review = '\n【精彩影评】：'
        for rev in review:
            right_review = re.findall(r'hidden">(.+?)</textarea>', rev, re.DOTALL)
            if len(right_review) != 0:
                plot_review = plot_review + right_review[-1] + '////'
                continue
        jav_obj['review'] = plot_review

    # force set year if not detected
    if not jav_obj.get('year'):
        jav_obj['year'] = 'unknown'

    return jav_obj
