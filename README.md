Run the filewatcher using the following statement replacing `LOCALPATH`:

```docker run -v "/LOCALPATH/watch-folder:/application/watch-folder" -v "/LOCALPATH/export-folder:/application/export-folder" -it tobiasw/ocrmypdf-watcher```

Files added to watch-folder will be processed after 10 seconds and output to export folder with ocr information added.

# Configuration options:

## ocrmypdf options

Default options are ```--pdf-renderer tesseract --tesseract-timeout 600 --rotate-pages -l deu+eng --deskew --clean --skip-text```, they can be overridden setting ```-e OCRMYPDF_OPTIONS="..."``` as environment variable in docker or compose command.

## Delay

Default delay the process waits for file changes is 10000 milliseconds. Using DELAY as environment variable the value may be changed defining the time in milliseconds.

# Docker compose

Sample docker compose file combined with samba service to share the volumes as network folder. Replace ```LOCALFOLDER``` with your local path.

```
version: '3'
services:
  OCRmyPDF:
    image: tobiasw/ocrmypdf-watcher:latest
    container_name: ocrmypdf-watcher
    volumes:
        - /LOCALFOLDER/shares/archive:/application/export-folder
        - /LOCALFOLDER/shares/hot-folder:/application/watch-folder
    restart: always
  SAMBA:
     image: dperson/samba
     container_name: samba
     environment:
      TZ: 'EST5EDT'
     networks:
       - default
     ports:
       - "137:137/udp"
       - "138:138/udp"
       - "139:139"
       - "445:445"
     volumes:
       - /LOCALFOLDER/shares:/mount
     restart: always
     command: '-g "log level = 2" -n -r -S -s "Upload;/mount/hot-folder;yes;no;yes" -s "Download;/mount/archive;yes;no;yes"'
```
