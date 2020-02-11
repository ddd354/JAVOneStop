import aria2p

from JavHelper.core.ini_file import return_default_config_string

aria2 = aria2p.API(
    aria2p.Client(
        host=return_default_config_string('aria_address'),
        port=int(return_default_config_string('aria_port')),
        secret=return_default_config_string('aria_token')
    )
)
