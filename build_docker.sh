#!/bin/bash
imageName=jav_onestop_docker
containerName=jav_onestop

# download user specific data from existing container
docker cp $containerName:/usr/src/app/jav_manager.db .
docker cp $containerName:/usr/src/app/settings.ini .
docker cp $containerName:/usr/src/app/115_cookies.json .

docker build -t $imageName -f Dockerfile  .

echo Delete old container...
docker rm -f $containerName

echo Run new container...
docker run -d -p 8009:8009 -v "${source_folder}":/usr/data1 --name $containerName $imageName
