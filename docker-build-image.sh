#!/bin/bash

ENV=$1

function echoYellow() {
  MSG=$1
  printf "\033[1;33m$MSG\033[0m\n"
}

echo
echoYellow "|--------------------------------------------------------|"
echoYellow "|    Building the Docker image for development env       |"   
echoYellow "|--------------------------------------------------------|\n"

IMAGE_NAME="kursstatistik-api-image"


if [ "$ENV" == "dev" ]; then

  echo
  echoYellow "  1. Stop previous Docker image: a name tag is $IMAGE_NAME\n"
  echoYellow "  1.1 You might want to run 'docker system prune --force' to prune all previous container and networks\n"
  echoYellow "  1.2 Run 'docker container prune --force' to prune all running previous container\n"
  echoYellow "  1. Stop previous Docker image: docker stop $IMAGE_NAME\n"

  #docker system prune --force
  #docker container prune --force
  #docker stop "$IMAGE_NAME"

  echo
  echoYellow "  2. Remove previous Docker image: a name tag is $IMAGE_NAME\n"
  docker rmi "$IMAGE_NAME"

  echo
  echoYellow "  3. Build Docker image: a name tag is $IMAGE_NAME\n"
  docker build --progress=plain -f Dockerfile -t "$IMAGE_NAME" .

  echo
  echoYellow "  4. List images\n"
  docker images
fi 