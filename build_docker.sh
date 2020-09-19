#!/bin/bash
if [ -z "$1" ]
  then
    echo "Have to supplied source map path"
else

imageName=jav_onestop_docker
containerName=jav_onestop

# download user specific data from existing container
docker cp $containerName:/usr/src/app/settings.ini .
docker cp $containerName:/usr/src/app/115_cookies.json .
docker cp $containerName:/usr/src/app/javlib_cf_cookies.json .

# use local back up 
#cp -r ./jav_manager.db ./"$(date +"%Y_%m_%d_%I_%M_%p")_db.backup"
# sync existing to local for build and backup
docker cp $containerName:/usr/src/app/jav_manager.sqlite .
docker cp $containerName:/usr/src/app/jav_manager.sqlite ./"$(date +"%Y_%m_%d_%I_%M_%p")_sqlite.backup"

docker build -t $imageName -f Dockerfile  .

echo Delete old container...
docker rm -f $containerName

echo Run new container...
docker run -d -p 8009:8009 -v "$1":/usr/data1 --name $containerName $imageName

fi
