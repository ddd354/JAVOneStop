import xml.etree.ElementTree as Et


class EmbyNfo:
    single_field_mapping = {
        'plot': './/plot',
        'title': './/title',
        'director': './/director',
        'rating': './/rating',
        'year': './/year',
        'release': './/release',
        'length': './/runtime',
        'studio': './/studio',
        'car': './/id'
    }
    list_field_mapping = {
        'genres': './/genre',
        'all_actress': './/actor/name'
    }

    def __init__(self):
        self.jav_obj = {}  # parsed jav object

    def parse_emby_nfo(self, file_path):
        print(file_path)
        tree = Et.parse(file_path)
        for k, v in self.single_field_mapping.items():
            self.jav_obj[k] = tree.find(v).text

        for k, v in self.list_field_mapping.items():
            self.jav_obj[k] = [ele.text for ele in tree.findall(v)]
