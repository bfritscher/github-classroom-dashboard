ECHO on
for /F "tokens=*" %%A in (urls.txt) do call :CAPTURE %%A
goto END

:CAPTURE
set url=%1
set url=%url:https://=%
set url=%url:/=!%
call capture-website %1 --full-page --emulate-device="Nexus 6" --overwrite %url%-phone.png
call capture-website %1 --full-page --emulate-device="iPad landscape" --overwrite %url%-tablet.png
call capture-website %1 --full-page --width 1600 --height 1200 --overwrite %url%-desktop.png

:END
