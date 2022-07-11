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


RUN mkdir -p /application && \
    # make /application is owned by the user kursstatistikuser (not root)    
    chown -R kursstatistikuser /application
WORKDIR /application
# Run as user kursstatistikuser (not root)    
USER kursstatistikuser
RUN id -u

COPY --chown=kursstatistikuser ["package-lock.json", "package-lock.json"]
COPY --chown=kursstatistikuser ["package.json", "package.json"]

RUN npm pkg delete scripts.prepare && \
    npm install --omit=dev
# RUN npm install --unsafe-perm ibm_db


COPY --chown=kursstatistikuser ["config", "config"]
COPY --chown=kursstatistikuser ["app.js", "app.js"]
COPY --chown=kursstatistikuser ["swagger.json", "swagger.json"]
COPY --chown=kursstatistikuser ["server", "server"]
COPY --chown=kursstatistikuser ["run.sh", "run.sh"]

RUN chown -R kursstatistikuser /application/node_modules
RUN chmod +x ./run.sh

EXPOSE 3001



CMD ["./run.sh","node", "app.js"]
