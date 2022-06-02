FROM ubuntu:latest
LABEL maintainer="KTH StudAdm studadm.developers@kth.se"

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Stockholm

RUN apt-get update
RUN apt-get -y install python2 make g++ python2 libxml2 openssl stunnel curl git

# nodejs v16
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
#RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

WORKDIR /application
ENV NODE_PATH /application

COPY ["package-lock.json", "package-lock.json"]
COPY ["package.json", "package.json"]

# RUN npm install --global node-gyp
# RUN npm install --production
#RUN npm install --unsafe-perm ibm_db

RUN npm set-script prepare "" && npm install --global node-gyp && npm install --production --no-optional --unsafe-perm && \
    npm audit fix --only=prod

COPY ["config", "config"]
COPY ["package.json", "package.json"]
COPY ["app.js", "app.js"]
COPY ["swagger.json", "swagger.json"]
COPY ["server", "server"]
COPY ["run.sh", "run.sh"]

RUN chmod +x ./run.sh

EXPOSE 3001

CMD ["./run.sh","node", "app.js"]
