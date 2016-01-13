cd preview
for /F "tokens=*" %%A in (urls.txt) do pageres --delay 2 320x480 1024x768 1600x1200 %%A