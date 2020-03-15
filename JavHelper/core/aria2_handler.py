import aria2p

from JavHelper.core.ini_file import return_default_config_string

aria2 = aria2p.API(
    aria2p.Client(
        host=return_default_config_string('aria_address'),
        port=int(return_default_config_string('aria_port') or 0),
        secret=return_default_config_string('aria_token')
    )
)

def verify_aria2_configs_exist():
    if not return_default_config_string('aria_address') or \
    not int(return_default_config_string('aria_port') or 0) or \
    not return_default_config_string('aria_token'):
        return False
    else:
        return True