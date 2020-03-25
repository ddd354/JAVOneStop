#!/usr/bin/env bash

pyinstaller --onedir \
    --add-data="demo:demo" \
    --add-data="translation.json:." \
    --add-data="README.md:." \
    --add-data="JAV_HELP.md:." \
    --add-data="JavHelper/templates:JavHelper/templates" \
    --add-data="JavHelper/static:JavHelper/static" \
    --add-data="fillin/cloudscraper:cloudscraper" \
    --hidden-import="js2py" \
    --hidden-import="cloudscraper" \
    --hidden-import="cloudscraper_exception" \
    --exclude-module="FixTk" \
    --exclude-module="tcl" \
    --exclude-module="tk" \
    --exclude-module="_tkinter" \
    --exclude-module="tkinter" \
    --exclude-module="Tkinter" \
    --noconfirm \
    --distpath dist-python \
    JavHelper/run.py

tar -czf dist-python.tar.gz dist-python