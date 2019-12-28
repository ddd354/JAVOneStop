import requests
import re

from JavHelper.core import JAVNotFoundException


def get_arzon_session_cookie():
    session = requests.Session()
    session.get('https://www.arzon.jp/index.php?action=adult_customer_agecheck&agecheck=1'
                '&redirect=https%3A%2F%2Fwww.arzon.jp%2F', timeout=10)
    return session.cookies.get_dict()


def parse_arzon(jav_obj: dict):
    plot = ''
    arzon_cookie = get_arzon_session_cookie()
    while 1:
        arz_search_url = 'https://www.arzon.jp/itemlist.html?t=&m=all&s=&q=' + jav_obj['car']
        print('    >正在查找简介：', arz_search_url)
        search_html = requests.get(arz_search_url, cookies=arzon_cookie).text

        if plot == '':
            # <dt><a href="https://www.arzon.jp/item_1376110.html" title="限界集落に越してきた人妻 ～村民"><img src=
            AVs = re.findall(r'<h2><a href="(/item.+?)" title=', search_html)  # 所有搜索结果链接
            # 搜索结果为N个AV的界面
            if AVs:  # arzon有搜索结果
                results_num = len(AVs)
                for i in range(results_num):
                    arz_url = 'https://www.arzon.jp' + AVs[i]  # 第i+1个链接
                    print(f'accessing {arz_url}')
                    jav_html = requests.get(arz_url, cookies=arzon_cookie)
                    jav_html.encoding = 'utf-8'
                    if plot == '':
                        # 在该arz_url网页上查找简介
                        plotg = re.search(r'<h2>作品紹介</h2>([\s\S]*?)</div>', jav_html.text)
                        # 成功找到plot
                        if str(plotg) != 'None':
                            plot_br = plotg.group(1)
                            plot = ''
                            for line in plot_br.split('<br />'):
                                line = line.strip()
                                plot += line
                            plot = '【影片简介】：' + plot
                            break  # 跳出for AVs
                # 几个搜索结果查找完了，也没有找到简介
                if plot == '':
                    plot = '【arzon有该影片，但找不到简介】'
                break  # 跳出while
            # arzon返回的页面实际是18岁验证
            else:
                adultg = re.search(r'１８歳以上', search_html)
                if str(adultg) != 'None':
                    raise Exception('under 18 failure')
                else:  # 不是成人验证，也没有简介
                    raise JAVNotFoundException('plot not found on arzon')

    jav_obj['plot'] = plot

    return jav_obj
