FROM ubuntu:latest
LABEL maintainer="KTH StudAdm studadm.developers@kth.se"

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Stockholm
RUN apt-get update
#OpenSSL 3
RUN apt upgrade -y
RUN apt install apt-utils build-essential checkinstall zlib1g-dev -y
RUN apt-get -y install python2 make gcc g++ python2.7 libxml2 openssl stunnel curl git

#Stunnel
#RUN apt-get -y install python2 make g++ python2.7 libxml2 openssl stunnel curl git
# Ubuntu version
RUN cat /etc/issue

#OpenSSL 3
RUN openssl version -a
RUN ls /var/run/

#Curl and install nodejs 16
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

RUN mkdir -p /npm && \
    mkdir -p /application
WORKDIR /npm

COPY ["package-lock.json", "package-lock.json"]
COPY ["package.json", "package.json"]

RUN npm set-script prepare ""
RUN npm install --location=global node-gyp
RUN npm install --production
RUN npm install --unsafe-perm ibm_db
RUN npm install bindings

WORKDIR /application
RUN cp -a /npm/node_modules /application && \
    rm -rf /npm
RUN pwd
RUN cat /etc/security/limits.conf


COPY ["config", "config"]
COPY ["package.json", "package.json"]
COPY ["app.js", "app.js"]
COPY ["swagger.json", "swagger.json"]
COPY ["server", "server"]
COPY ["run.sh", "run.sh"]

RUN chmod +x ./run.sh

EXPOSE 3001

CMD ["./run.sh","node", "app.js"]
