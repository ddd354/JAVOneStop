#!/usr/bin/env bash

pyinstaller --onedir \
    --icon "demo/icon.ico" \
    --add-data="JavHelper/templates:JavHelper/templates" \
    --add-data="JavHelper/static:JavHelper/static" \
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