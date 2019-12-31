@echo off 

pyinstaller --onedir ^
    --add-data="JavHelper\templates;JavHelper\templates" ^
    --add-data="JavHelper\static;JavHelper\static" ^
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