#
# A daily updated common KTH Alpine based image.
# Versions: https://hub.docker.com/r/kthse/kth-nodejs/tags
#
FROM kthse/kth-nodejs:16.0.0
LABEL maintainer="KTH StudAdm studadm.developers@kth.se"

#
# During integration-tests running with docker-compose in the pipeline
# this application might have to wait for other services to be ready
# before it is started itself. This can be done with the following
# script and its environment variables WAIT_HOSTS and WAIT_HOSTS_TIMEOUT.
#
ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait

#
# bash might be needed by "npm start"
#
RUN apk add --no-cache bash


#
# Put the application into a directory in the root.
# This will prevent file polution and possible overwriting of files.
#
WORKDIR /application
ENV NODE_PATH /application

ENV DEBIAN_FRONTEND=noninteractive
#
# Set timezone
#
ENV TZ=Europe/Stockholm

#RUN apt-get update
#RUN apt-get -y install python make g++ python2 libxml2 openssl stunnel curl git


#
# Copy the files needed to install the production dependencies
# and install them using npm.
#
# Remember to only install production dependencies.
#
COPY ["package.json", "package.json"]
COPY ["package-lock.json", "package-lock.json"]
#
# - Variant 1 - node-gyp not needed:
# RUN npm install --production --no-optional --unsafe-perm && \
#     npm audit fix --only=prod
#
# - Variant 2 - node-gyp needs build-essentials:
RUN apk stats && apk add --no-cache --virtual .gyp-dependencies python2 make g++ util-linux libxml2 openssl stunnel curl git && \
    npm set-script prepare "" && \
    npm ci --production --no-optional --unsafe-perm && \
    npm audit fix --only=prod && \
    apk del .gyp-dependencies && apk stats


# nodejs 12 RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -


COPY ["config", "config"]
COPY ["package.json", "package.json"]
COPY ["app.js", "app.js"]
COPY ["swagger.json", "swagger.json"]
COPY ["server", "server"]
COPY ["run.sh", "run.sh"]

ENV NODE_PATH /application

RUN chmod +x ./run.sh

EXPOSE 3001

CMD ["./run.sh", "node", "app.js"]
