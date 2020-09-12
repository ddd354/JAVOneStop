# -*- coding:utf-8 -*-
import os
from urllib.parse import urlparse
from PIL import Image
import requests
import re
import traceback
import codecs
from copy import deepcopy

from JavHelper.core.backend_translation import BackendTranslation
from JavHelper.core.nfo_parser import EmbyNfo

from JavHelper.core.ini_file import return_default_config_string

if return_default_config_string('db_type') == 'sqlite':
    from JavHelper.model.jav_manager import SqliteJavManagerDB as JavManagerDB
else:
    from JavHelper.model.jav_manager import BlitzJavManagerDB as JavManagerDB


POSTER_NAME = 'poster'
FANART_NAME = 'fanart'
DEFAULT_FILENAME_PATTERN = r'^.*?(?P<pre>[a-zA-Z]{2,6})\W*(?P<digit>\d{1,6}).*?$'


class EmbyFileStructure:
    def __init__(self, root_path=return_default_config_string('file_path')):
        if not os.path.exists(root_path):
            raise Exception(f'{root_path} does not exist')
        if not os.path.isdir(root_path):
            raise Exception(f'{root_path} is not a valid directory for scan')

        self.root_path = root_path
        self.file_list = []
        self.folder_structure = return_default_config_string('folder_structure')

        # settings from ini file
        self.handle_multi_cds = ( return_default_config_string('handle_multi_cds')== '是' )
        self.preserve_subtitle_filename = ( return_default_config_string('preserve_subtitle_filename')== '是' )
        self.subtitle_filename_postfix = return_default_config_string('subtitle_filename_postfix').split(',')
        self.remove_string = return_default_config_string('remove_string').split(',')
        print(self.remove_string)

    @property
    def jav_manage(self):
        # need to dynamically return this so this is not called everytime init the class
        # may encounter weird error
        return JavManagerDB()

    def write_images(self, jav_obj, fail_on_error=False):
        poster_name = POSTER_NAME
        fanart_name = FANART_NAME

        if 'image' not in jav_obj:
            raise Exception('no image field in jav_obj')
        image_url = jav_obj['image']

        if 'directory' not in jav_obj:
            raise Exception('no directory field in jav_obj')
        # windows and linux compatible
        directory = jav_obj['directory'].replace('/', os.sep).replace('\\', os.sep)
        directory = os.path.join(self.root_path, directory)

        # 下载海报的地址 cover
        url_obj = urlparse(image_url, scheme='http')
        image_ext = os.path.splitext(url_obj.path)[1]

        poster_path = os.path.join(directory, poster_name+image_ext)
        fanart_path = os.path.join(directory, fanart_name+image_ext)

        try:
            r = requests.get(url_obj.geturl(), stream=True)
        except Exception as e:
            print('Image download failed for {} due to {}'.format(url_obj.geturl(), e))
            return 
        if r.status_code != 200 or "now_printing" in r.url:
            if fail_on_error:
                # raise error if we are just writing images
                raise Exception('Image download failed for {}'.format(url_obj.geturl()))
            # print the error but not fail the write
            print('Image download failed for {}'.format(url_obj.geturl()))
            return 

        with open(fanart_path, 'wb') as pic:
            for chunk in r:
                pic.write(chunk)

        # 裁剪生成 poster
        img = Image.open(fanart_path)
        w, h = img.size  # fanart的宽 高
        ex = int(w * 0.52625)  # 0.52625是根据emby的poster宽高比较出来的
        poster = img.crop((ex, 0, w, h))  # （ex，0）是左下角（x，y）坐标 （w, h)是右上角（x，y）坐标
        try:
            # quality=95 是无损crop，如果不设置，默认75
            poster.save(poster_path, quality=95)  
        except OSError:
            # handle RGBA error
            if poster.mode in ('RGBA', 'LA'):
                background = Image.new(poster.mode[:-1], poster.size, '#ffffff')
                background.paste(poster, poster.split()[-1])
                poster = background
            poster.save(poster_path, quality=95)  

        return

    def write_nfo(self, jav_obj: dict, verify=False):
        if 'file_name' not in jav_obj:
            raise Exception('no file_name field in jav_obj')
        file_name = jav_obj['file_name']
        if 'directory' not in jav_obj:
            raise Exception('no directory field in jav_obj')
        # windows and linux compatible
        directory = jav_obj['directory'].replace('/', os.sep).replace('\\', os.sep)
        directory = os.path.join(self.root_path, directory)

        if verify:
            # verify there is a corresponding video file
            directory_files = os.listdir(directory)
            correct_file_exists = False
            for _filename in directory_files:
                if _filename == os.path.splitext(file_name)[0] + '.nfo':
                    continue
                if _filename.startswith(os.path.splitext(file_name)[0]):
                    correct_file_exists = True; break
            if not correct_file_exists:
                raise Exception('there is no correct file exists in {} for {}'.format(os.path.splitext(file_name)[0], directory))


        nfo_file_name = os.path.splitext(file_name)[0] + '.nfo'
        nfo_path = os.path.join(directory, nfo_file_name)

        with codecs.open(nfo_path, 'w', 'utf-8') as f:
            if not jav_obj.get('title'):
                #import ipdb; ipdb.set_trace()
                raise Exception('[FATAL ERROR] There is no valid title for {}'.format(jav_obj['car']))
            f.write(
                "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\" ?>\n"
                "<movie>\n"
                "  <plot>{plot}</plot>\n"
                "  <title>{title}</title>\n"
                "  <director>{director}</director>\n"
                "  <rating>{score}</rating>\n"
                # "  <criticrating>" + criticrating + "</criticrating>\n"
                "  <year>{year}</year>\n"
                "  <premiered>{premiered}</premiered>\n"
                "  <runtime>{length}</runtime>\n"
                "  <studio>{studio}</studio>\n"
                "  <id>{car}</id>\n".format(
                    plot=jav_obj.get('plot', ''),
                    title=jav_obj.get('title', ''),
                    director=jav_obj.get('director', ''),
                    score=jav_obj.get('score', ''),
                    year=jav_obj.get('year', ''),
                    premiered=jav_obj.get('premiered', ''),
                    length=jav_obj.get('length', ''),
                    studio=jav_obj.get('studio', ''),
                    car=jav_obj.get('car', '')
                )
            )

            for i in jav_obj.get('genres', []):
                f.write("  <genre>" + i + "</genre>\n")
            f.write("  <genre>片商：{}</genre>\n".format(jav_obj.get('studio', '')))
            for i in jav_obj.get('tags', []):
                f.write("  <tag>" + i + "</tag>\n")
            #for i in jav_obj.get('genres', []):
            #    f.write("  <tag>" + i + "</tag>\n")
            #f.write("  <tag>片商：{}</tag>\n".format(jav_obj.get('studio', '')))
            for i in jav_obj.get('all_actress', []):
                f.write("  <actor>\n    <name>" + i + "</name>\n    <type>Actor</type><role>{}</role>\n  </actor>\n".format(self.return_actor_role()))
            f.write("</movie>\n")

    @staticmethod
    def return_actor_role():
        language_map = {
            'cn': '女优',
            'en': 'Porn Star'
        }
        language = return_default_config_string('display_language')
        return language_map[language]

    def extract_subtitle_postfix_filename(self, file_name: str):
        subtitle_postfix = ''
        
        if self.preserve_subtitle_filename:
            for postfix in self.subtitle_filename_postfix:
                if file_name.endswith(postfix):
                    print(f'find subtitle postfix {postfix} in {file_name}')
                    #subtitle_postfix = postfix
                    subtitle_postfix = '-C'
                    file_name = file_name[:-len(postfix)]
                    break
        return subtitle_postfix, file_name

    def extract_CDs_postfix_filename(self, file_name: str):
        """
        Cannot have -C or -CD2 in the sametime
        """
        allowed_postfixes = {
            r'^(.+?)([ABab])$': {'a': 'cd1', 'b': 'cd2'},
            r'^(.+?)(CD\d|cd\d)$': None,
        }
        cd_postfix = ''
        if not self.handle_multi_cds:
            return cd_postfix, file_name
        
        for pattern, part_map in allowed_postfixes.items():
            file_name_match = re.match(pattern, file_name)
            if file_name_match:
                file_name = file_name_match.group(1)
                cd_postfix = file_name_match.group(2).lower()
                print(file_name, cd_postfix)
                if part_map:
                    cd_postfix = part_map[cd_postfix]
                break
        return cd_postfix, file_name

    def remove_preconfigured_string(self, file_name: str):
        for rm_str in self.remove_string:
            file_name = file_name.replace(rm_str, '')

        return file_name

    def rename_single_file(self, file_name: str, name_pattern=DEFAULT_FILENAME_PATTERN):
        file_name = self.remove_preconfigured_string(file_name)
        subtitle_postfix, file_name = self.extract_subtitle_postfix_filename(file_name)
        cd_postfix, file_name = self.extract_CDs_postfix_filename(file_name)

        name_group = re.search(name_pattern, file_name)
        name_digits = name_group.group('digit')

        # only keep 0 under 3 digits
        # keep 045, 0830 > 830, 1130, 0002 > 002, 005
        if name_digits.isdigit():
            name_digits = str(int(name_digits))
        while len(name_digits) < 3:
            name_digits = '0' + name_digits

        new_file_name = name_group.group('pre') + '-' + name_digits + subtitle_postfix + cd_postfix
        return new_file_name

    def preview_rename_single_file(self, full_file_name: str, name_pattern=DEFAULT_FILENAME_PATTERN):
        # this is used for true single rename, not path rename
        file_name, ind_ext = os.path.splitext(full_file_name)

        file_name = self.remove_preconfigured_string(file_name)
        subtitle_postfix, file_name = self.extract_subtitle_postfix_filename(file_name)
        cd_postfix, file_name = self.extract_CDs_postfix_filename(file_name)

        name_group = re.search(name_pattern, file_name)
        name_digits = name_group.group('digit')

        # only keep 0 under 3 digits
        # keep 045, 0830 > 830, 1130, 0002 > 002, 005
        if name_digits.isdigit():
            name_digits = str(int(name_digits))
        while len(name_digits) < 3:
            name_digits = '0' + name_digits

        new_file_name = name_group.group('pre') + '-' + name_digits + subtitle_postfix + cd_postfix
        return new_file_name+ind_ext

    def rename_directory_preview(self, name_pattern=None):
        # apply default name pattern
        if not name_pattern:
            name_pattern = DEFAULT_FILENAME_PATTERN

        res = []

        for ind_file in os.listdir(self.root_path):
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
                    new_file_name = self.rename_single_file(ind_file_name, t28_pattern) + ind_ext
                else:
                    # normal case
                    new_file_name = self.rename_single_file(ind_file_name, name_pattern) + ind_ext

            except Exception as e:
                traceback.print_exc()
                res.append({'file_name': f'cannot process {ind_file} due to {e}'})
                continue

            # log before rename
            if ind_file == new_file_name:
                res.append({'file_name': ind_file})
            else:
                res.append({'file_name': ind_file, 'new_file_name': new_file_name})

        return res

    def rename_single_file_actual(self, jav_obj):
        try:
            ind_file = jav_obj['file_name']
            new_file_name = jav_obj['new_file_name']
            # rename
            os.rename(os.path.join(self.root_path, ind_file), os.path.join(self.root_path, new_file_name))
            return BackendTranslation()['rename_ok_msg'].format(ind_file, new_file_name), ind_file
        except Exception as e:
            raise Exception(f'failed to renamed {ind_file} to due to {e}')

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
            # fill car
            postfix, car_str = self.extract_subtitle_postfix_filename(os.path.splitext(file_name)[0])
            _, car_str = self.extract_CDs_postfix_filename(car_str)
            jav_obj = {'file_name': file_name, 'car': car_str}
            if postfix:
                jav_obj.setdefault('genres', []).append('中字')
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
                    # we only save Relative path to the root in db to make the db work across different machine
                    nfo_obj.jav_obj['directory'] = os.path.relpath(root, self.root_path)
                    nfo_obj.jav_obj['stat'] = 3
                    self.jav_manage.upcreate_jav(nfo_obj.jav_obj)
                    self.file_list.append(nfo_obj.jav_obj)
                    print('scanned {}'.format(nfo_obj.jav_obj['directory']))

    def remove_tags(self):
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
                    try:
                        nfo_obj = EmbyNfo()
                        nfo_obj.parse_emby_nfo(os.path.join(root, each_file))
                        # we only save Relative path to the root in db to make the db work across different machine
                        nfo_obj.jav_obj['directory'] = os.path.relpath(root, self.root_path)
                        nfo_obj.jav_obj['stat'] = 3
                        self.jav_manage.upcreate_jav(nfo_obj.jav_obj)
                        self.file_list.append(nfo_obj.jav_obj)
                        self.write_nfo(nfo_obj.jav_obj, verify=True)
                        print('deleted tag for {}'.format(nfo_obj.jav_obj['directory']))
                    except Exception as e:
                        print('**********error {} detected for {}***********'.format(e, each_file))

    def create_new_folder(self, jav_obj: dict):
        # file_name has to be in incoming jav_obj
        if 'file_name' not in jav_obj:
            raise Exception(f'file_name has to be in incoming jav object')
        file_name = jav_obj['file_name']

        if not os.path.exists(os.path.join(self.root_path, file_name)):
            raise Exception(f'{file_name} does not exist')

        # configure all necessary folders
        try:
            new_full_path = os.path.join(self.root_path, self.folder_structure.format(**jav_obj))
        except KeyError:
            raise KeyError('required fields not filled for path {} and parsed {}'.format(
                self.folder_structure, jav_obj.keys()
            ))
        os.makedirs(new_full_path, exist_ok=True)
        print(f'{new_full_path} created')

        # we only save relative directory excluding root
        # since root is configurable among different machines
        jav_obj['directory'] = self.folder_structure.format(**jav_obj)
        return jav_obj

    def create_folder_for_existing_jav(self, jav_obj: dict):
        # file_name has to be in incoming jav_obj
        if 'file_name' not in jav_obj:
            raise Exception(f'file_name has to be in incoming jav object')
        file_name = jav_obj['file_name']

        if not os.path.exists(os.path.join(self.root_path, jav_obj['directory'], file_name)):
            raise Exception('{} does not exist'.format(os.path.join(self.root_path, jav_obj['directory'], file_name)))

        # configure all necessary folders
        try:
            new_full_path = os.path.join(self.root_path, self.folder_structure.format(**jav_obj))
        except KeyError:
            raise KeyError('required fields not filled for path {} and parsed {}'.format(
                self.folder_structure, jav_obj.keys()
            ))
        os.makedirs(new_full_path, exist_ok=True)
        print(f'{new_full_path} created')

        # we only save relative directory excluding root
        # since root is configurable among different machines
        jav_obj['old_directory'] = deepcopy(jav_obj['directory'])
        jav_obj['directory'] = self.folder_structure.format(**jav_obj)
        print('{} >> {}'.format(jav_obj['old_directory'], jav_obj['directory']))
        return jav_obj

    @staticmethod
    def find_corresponding_video_file(file_name: str, root_path: str, relative_directory: str):
        """
        This function will attempt to find nfo file's corresponding video file
        """
        if not file_name.endswith('.nfo'):
            return file_name

        filename, _ = os.path.splitext(file_name)
        for f in os.scandir(os.path.join(root_path, relative_directory)):
            _f, _ext = os.path.splitext(f.name)
            if _f == filename and _ext != '.nfo':
                return f.name
        
        # by default just return input file name since nothing is found
        print('[WARNING] cannot find video file for {} in {}'.format(
            file_name, os.path.join(root_path, relative_directory)
        ))
        return file_name


    def move_existing_file(self, jav_obj: dict):
        # file_name has to be in incoming jav_obj
        if 'file_name' not in jav_obj or 'directory' not in jav_obj:
            raise Exception(f'required file_name or directoy has to be in incoming {jav_obj} object')
        if 'old_directory' not in jav_obj:
            raise Exception(f'required old_directoy has to be in incoming {jav_obj} object')
        if jav_obj['directory'].replace('/', os.sep).replace('\\', os.sep) == \
            jav_obj['old_directory'].replace('/', os.sep).replace('\\', os.sep):
            print('old & new directories {} are already the same, no need to move'.format(jav_obj['directory']))
            return jav_obj

        file_name = jav_obj['file_name']
        # join relative directory with root
        # windows and linux compatible
        directory = jav_obj['directory'].replace('/', os.sep).replace('\\', os.sep)
        new_full_path = os.path.join(self.root_path, directory)

        old_directory = jav_obj['old_directory'].replace('/', os.sep).replace('\\', os.sep)

        # need to find corresponding video files
        _move_file_name = self.find_corresponding_video_file(file_name, self.root_path, old_directory)

        if not os.path.exists(os.path.join(self.root_path, old_directory, _move_file_name)):
            raise Exception(f'{_move_file_name} does not exist')

        try:
            os.rename(
                os.path.join(self.root_path, old_directory, _move_file_name),
                os.path.join(new_full_path, _move_file_name)
            )
        except FileExistsError:
            print('[WARNING] {} already exists in target path'.format(os.path.join(new_full_path, _move_file_name)))
        # default to exists locally
        jav_obj.setdefault('stat', 3)
        # write to db
        self.jav_manage.upcreate_jav(jav_obj)

        print('move {} to {}'.format(
            os.path.join(self.root_path, old_directory, _move_file_name),
            os.path.join(new_full_path, _move_file_name)
        ))

        return jav_obj

    def put_processed_file(self, jav_obj: dict):
        # file_name has to be in incoming jav_obj
        if 'file_name' not in jav_obj or 'directory' not in jav_obj:
            raise Exception(f'required file_name or directoy has to be in incoming {jav_obj} object')
        file_name = jav_obj['file_name']
        # join relative directory with root
        # windows and linux compatible
        directory = jav_obj['directory'].replace('/', os.sep).replace('\\', os.sep)
        new_full_path = os.path.join(self.root_path, directory)

        if not os.path.exists(os.path.join(self.root_path, file_name)):
            raise Exception(f'{file_name} does not exist')

        os.rename(
            os.path.join(self.root_path, file_name),
            os.path.join(new_full_path, file_name)
        )
        # default to exists locally
        jav_obj.setdefault('stat', 3)
        # write to db
        self.jav_manage.upcreate_jav(jav_obj)

        print('move {} to {}'.format(
            os.path.join(self.root_path, file_name),
            os.path.join(new_full_path, file_name)
        ))

        return jav_obj
