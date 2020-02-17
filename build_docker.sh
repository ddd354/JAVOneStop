#!/bin/bash
imageName=jav_onestop_docker
containerName=jav_onestop

docker cp $containerName:/usr/src/app/jav_manager.db .

docker build -t $imageName -f Dockerfile  .

echo Delete old container...
docker rm -f $containerName

echo Run new container...
docker run -d -p 8009:8009 --mount src=`` target=/usr/data1 --name $containerName $imageName
