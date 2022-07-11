FROM ubuntu:latest
# Create a new user (not root)    
RUN addgroup --system kursstatistik && adduser --system --ingroup kursstatistik kursstatistikuser
LABEL maintainer="KTH StudAdm studadm.developers@kth.se"
# Ubuntu version
RUN cat /etc/issue

# Disable Prompt During Packages Installation
ARG DEBIAN_FRONTEND=noninteractive
#ENV DEBIAN_FRONTEND=noninteractive

ENV TZ=Europe/Stockholm

RUN apt-get update
# will be needed for Ubuntu 22.04 locally to upgrade to get OpenSSL 3
RUN apt upgrade -y
#RUN apt install apt-utils build-essential checkinstall zlib1g-dev -y
RUN apt-get -y install python2 make gcc g++ python2.7 libxml2 openssl stunnel curl git

# Check OpenSSL version
RUN openssl version -a
RUN ls /var/run/

#Curl and install nodejs 16
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

RUN mkdir -p /npm
WORKDIR /npm
COPY ["package-lock.json", "package-lock.json"]
COPY ["package.json", "package.json"]
RUN npm pkg delete scripts.prepare && \
    npm install --omit=dev
# RUN npm install --unsafe-perm ibm_db
# RUN npm install bindings
RUN mkdir -p /application && \
    chown -R kursstatistikuser /application
WORKDIR /application
RUN cp -a /npm/node_modules /application && \
    rm -rf /npm

COPY ["config", "config"]
COPY ["package.json", "package.json"]
COPY ["app.js", "app.js"]
COPY ["swagger.json", "swagger.json"]
COPY ["server", "server"]
COPY ["run.sh", "run.sh"]

RUN chmod +x ./run.sh

EXPOSE 3001

# Run as user node (not root)    
USER kursstatistikuser
RUN id -u

CMD ["./run.sh","node", "app.js"]
