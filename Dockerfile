FROM ubuntu:latest

RUN apt-get update
    #apt-get upgrade && \
RUN apt-get -y install python make g++ python2.7 libxml2 openssl stunnel 
   # rm -rf /var/cache/apt-get/*
RUN apt-get -y install nodejs
RUN apt-get -y install npm

RUN mkdir -p /npm && \
    mkdir -p /application
WORKDIR /npm

COPY ["package-lock.json", "package-lock.json"]
COPY ["package.json", "package.json"]
RUN npm install --global node-gyp
RUN apt-get -y install git
RUN npm install --production
RUN npm install --unsafe-perm ibm_db


WORKDIR /application
RUN cp -a /npm/node_modules /application && \
    rm -rf /npm
# Copy files used by Gulp.
COPY ["config", "config"]

COPY ["package.json", "package.json"]

# Copy source files, so changes does not trigger gulp.
COPY ["app.js", "app.js"]
COPY ["swagger.json", "swagger.json"]
COPY ["server", "server"]
COPY ["run.sh", "run.sh"]

RUN chmod +x ./run.sh


EXPOSE 3001

CMD ["./run.sh","node", "app.js"]

