# -*- coding:utf-8 -*-
import os
from urllib.parse import urlparse
from PIL import Image
import requests
import re
import traceback

from JavHelper.core.nfo_parser import EmbyNfo


FOLDER_STRUCTURE = '{year}/{car}'
POSTER_NAME = 'poster'
FANART_NAME = 'fanart'
DEFAULT_FILENAME_PATTERN = r'^.*?(?P<pre>[a-zA-Z]{2,6})\W*(?P<digit>\d{1,5}).*?$'


class EmbyFileStructure:
    def __init__(self, root_path):
        if not os.path.exists(root_path):
            raise Exception(f'{root_path} does not exist')
        if not os.path.isdir(root_path):
            raise Exception(f'{root_path} is not a valid directory for scan')

        self.root_path = root_path
        self.file_list = []
        self.folder_structure = FOLDER_STRUCTURE

    @staticmethod
    def write_images(jav_obj):
        poster_name = POSTER_NAME
        fanart_name = FANART_NAME

        if 'image' not in jav_obj:
            raise Exception('no image field in jav_obj')
        image_url = jav_obj['image']

        if 'directory' not in jav_obj:
            raise Exception('no directory field in jav_obj')
        directory = jav_obj['directory']

        # 下载海报的地址 cover
        url_obj = urlparse(image_url, scheme='http')
        image_ext = os.path.splitext(url_obj.path)[1]

        poster_path = os.path.join(directory, poster_name+image_ext)
        fanart_path = os.path.join(directory, fanart_name+image_ext)

        r = requests.get(url_obj.geturl(), stream=True)
        with open(fanart_path, 'wb') as pic:
            for chunk in r:
                pic.write(chunk)

        # 裁剪生成 poster
        img = Image.open(fanart_path)
        w, h = img.size  # fanart的宽 高
        ex = int(w * 0.52625)  # 0.52625是根据emby的poster宽高比较出来的
        poster = img.crop((ex, 0, w, h))  # （ex，0）是左下角（x，y）坐标 （w, h)是右上角（x，y）坐标
        poster.save(poster_path, quality=95)  # quality=95 是无损crop，如果不设置，默认75

        return

    @staticmethod
    def write_nfo(jav_obj: dict):
        if 'car' not in jav_obj:
            raise Exception('no car field in jav_obj')
        car = jav_obj['car']
        if 'directory' not in jav_obj:
            raise Exception('no directory field in jav_obj')
        directory = jav_obj['directory']

        nfo_path = os.path.join(directory, f'{car}.nfo')

        with open(nfo_path, 'w') as f:
            f.write(
                "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\" ?>\n"
                "<movie>\n"
                "  <plot>{plot}</plot>\n"
                "  <title>{title}</title>\n"
                "  <director>{director}</director>\n"
                "  <rating>{score}</rating>\n"
                # "  <criticrating>" + criticrating + "</criticrating>\n"
                "  <year>{year}</year>\n"
                "  <release>{release_date}</release>\n"
                "  <runtime>{length}</runtime>\n"
                "  <studio>{studio}</studio>\n"
                "  <id>{car}</id>\n".format(
                    plot=jav_obj.get('plot', ''),
                    title=jav_obj.get('title', ''),
                    director=jav_obj.get('director', ''),
                    score=jav_obj.get('score', ''),
                    year=jav_obj.get('year', ''),
                    release_date=jav_obj.get('release_date', ''),
                    length=jav_obj.get('length', ''),
                    studio=jav_obj.get('studio', ''),
                    car=jav_obj.get('car', '')
                )
            )

            for i in jav_obj.get('genres', []):
                f.write("  <genre>" + i + "</genre>\n")
            f.write("  <genre>片商：{}</genre>\n".format(jav_obj.get('studio', '')))
            for i in jav_obj.get('genres', []):
                f.write("  <tag>" + i + "</tag>\n")
            f.write("  <tag>片商：{}</tag>\n".format(jav_obj.get('studio', '')))
            for i in jav_obj.get('all_actress', []):
                f.write("  <actor>\n    <name>" + i + "</name>\n    <type>Actor</type>\n  </actor>\n")
            f.write("</movie>\n")

    @staticmethod
    def rename_single_file(file_name, name_pattern=DEFAULT_FILENAME_PATTERN):
        name_group = re.search(name_pattern, file_name)
        name_digits = new_digits = name_group.group('digit')

        # only keep 0 under 3 digits
        # keep 045, 0830 > 830, 1130, 0002 > 002, 005
        if len(name_digits) > 3:
            new_digits = ''
            seen_0 = False
            r_digits = name_digits[::-1]
            for digit in r_digits:
                if digit == '0' and seen_0 and len(new_digits) >= 3:
                    continue
                elif digit == '0' and not seen_0:
                    seen_0 = True
                    new_digits += digit
                else:
                    new_digits += digit

                if len(new_digits) >= 3:
                    seen_0 = True

            new_digits = new_digits[::-1]

        new_file_name = name_group.group('pre') + '-' + new_digits
        return new_file_name

    @staticmethod
    def rename_directory_preview(path, name_pattern=None):
        # apply default name pattern
        if not name_pattern:
            name_pattern = DEFAULT_FILENAME_PATTERN

        res = []

        for ind_file in os.listdir(path):
            if str(ind_file) == '.DS_Store' or str(ind_file).startswith('.'):
                continue
            ind_file_name, ind_ext = os.path.splitext(ind_file)
            print(ind_file)
            try:
                if ind_file_name.startswith('hjd2048.com'):
                    ind_file_name = ind_file_name[11:]
                elif ind_file_name.startswith('[Thz.la]'):
                    ind_file_name = ind_file_name[8:]
                elif '_' in ind_file_name:
                    ind_file_name = ind_file_name.replace('_', '-')

                if ind_file_name.startswith('T28'):
                    # TODO: might need to rename this
                    continue
                elif ind_file_name.startswith('T-28'):
                    ind_file_name = ind_file_name.replace('T-28', 'T28-')
                    t28_pattern = r'^.*?(?P<pre>T28)\W*(?P<digit>\d{1,5}).*?$'
                    new_file_name = EmbyFileStructure.rename_single_file(ind_file_name, t28_pattern) + ind_ext
                else:
                    # normal case
                    new_file_name = EmbyFileStructure.rename_single_file(ind_file_name, name_pattern) + ind_ext

            except Exception as e:
                res.append({'file_name': f'cannot process {ind_file} due to {e}'})
                continue

            # log before rename
            if ind_file == new_file_name:
                res.append({'file_name': ind_file})
            else:
                res.append({'file_name': ind_file, 'new_file_name': new_file_name})

        return res

    @staticmethod
    def rename_directory(path, file_objs):
        for each_file in file_objs:
            if not each_file.get('new_file_name'):
                # not rename unnecessary files
                continue
            try:
                ind_file = each_file['file_name']
                new_file_name = each_file['new_file_name']
                # rename
                os.rename(os.path.join(path, ind_file), os.path.join(path, new_file_name))
                yield f'renamed {ind_file} to {new_file_name}'
            except Exception as e:
                yield f'failed to renamed {ind_file} to due to {e}'

    def scan_new_root_path(self):
        """
        This function is used to scan unprocessed video files
        which means it only append file object from root path and
        will not return any sub-directory files.
        """
        # fill file list from scan
        for file_name in os.listdir(self.root_path):
            # don't care about directory
            # also ignore file starts with . (auto generated by macos)
            if os.path.isdir(os.path.join(self.root_path, file_name)) or \
                    os.path.splitext(file_name)[0].startswith('.'):
                continue

            # ini jav obj
            jav_obj = {'file_name': file_name, 'car': os.path.splitext(file_name)[0]}
            self.file_list.append(jav_obj)

    def scan_emby_root_path(self):
        """
        This function is used to scan processed emby profile, so it will only
        scan correct directories and their nfo files
        """
        for (root, dirs, files) in os.walk(self.root_path):
            for each_file in files:
                # we only process nfo file from here
                # also ignore file starts with . (auto generated by macos)
                if os.path.splitext(each_file)[1] == '.nfo' and \
                        not os.path.splitext(each_file)[0].startswith('.'):
                    nfo_obj = EmbyNfo()
                    nfo_obj.parse_emby_nfo(os.path.join(root, each_file))
                    nfo_obj.jav_obj['directory'] = root
                    self.file_list.append(nfo_obj.jav_obj)

    def put_processed_file(self, jav_obj: dict):
        # file_name has to be in incoming jav_obj
        if 'file_name' not in jav_obj:
            raise Exception(f'file_name has to be in incoming jav object')
        file_name = jav_obj['file_name']

        if not os.path.exists(os.path.join(self.root_path, file_name)):
            raise Exception(f'{file_name} does not exist')

        # configure all necessary folders
        new_full_path = os.path.join(self.root_path, self.folder_structure.format(**jav_obj))
        os.makedirs(new_full_path, exist_ok=True)

        os.rename(
            os.path.join(self.root_path, file_name),
            os.path.join(new_full_path, file_name)
        )
        print('move {} to {}'.format(
            os.path.join(self.root_path, file_name),
            os.path.join(new_full_path, file_name)
        ))

        jav_obj['directory'] = new_full_path

        return jav_obj
