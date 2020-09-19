import json

from JavHelper.utils import resource_path
from JavHelper.core.ini_file import return_default_config_string


class BackendTranslation:
    translate_json = json.load(open(resource_path('translation.json'), 'r', encoding='utf8'))
    language = return_default_config_string('display_language')

    def __getitem__(self, key):
        return self.translate_json.get(key, {}).get(self.language, None)

    