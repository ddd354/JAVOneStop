@echo off 

pyinstaller --onedir ^
    --icon "demo\icon.ico" ^
    --add-data="JavHelper\templates;JavHelper\templates" ^
    --add-data="JavHelper\static;JavHelper\static" ^
    --add-data="C:\Users\luokerenz\Envs\javhelper\lib\site-packages\cloudscraper;cloudscraper" ^
    --hidden-import="js2py" ^
    --hidden-import="cloudscraper" ^
    --hidden-import="cloudscraper_exception" ^
    --exclude-module="FixTk" ^
    --exclude-module="tcl" ^
    --exclude-module="tk" ^
    --exclude-module="_tkinter" ^
    --exclude-module="tkinter" ^
    --exclude-module="Tkinter" ^
    --noconfirm ^
    --distpath dist-python ^
    JavHelper/run.py

"C:\Program Files\7-Zip\7z.exe" a -tzip "dist-python.zip" ".\dist-python\"