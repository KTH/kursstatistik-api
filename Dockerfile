FROM --platform=linux/x86_64 ubuntu:latest
# Create a new user (not root)    
RUN addgroup --system kursstatistik && adduser --system --ingroup kursstatistik kursstatistikuser

LABEL maintainer="KTH StudAdm studadm.developers@kth.se"
# Ubuntu version
RUN cat /etc/issue

# Disable Prompt During Packages Installation
ARG DEBIAN_FRONTEND=noninteractive

ENV TZ=Europe/Stockholm

RUN apt-get update
# will be needed for Ubuntu 22.04 locally to upgrade to get OpenSSL 3
RUN apt upgrade -y
RUN apt-get -y install python2 make gcc g++ python2.7 libxml2 openssl stunnel curl git

# Check OpenSSL version
RUN openssl version -a

#Curl and install nodejs 16
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt-get install -y nodejs

# make /var/run/ directory to be used by kursstatistikuser
RUN chown -R kursstatistikuser:kursstatistik /var/run/ 

RUN mkdir -p /application && \
    # make /application is owned by the user kursstatistikuser (not root)    
    chown -R kursstatistikuser:kursstatistik /application
WORKDIR /application

# Run as user kursstatistikuser (not root)    
USER kursstatistikuser

COPY --chown=kursstatistikuser:kursstatistik ["package-lock.json", "package-lock.json"]
COPY --chown=kursstatistikuser:kursstatistik ["package.json", "package.json"]

RUN npm pkg delete scripts.prepare && \
    npm install --omit=dev
# change premission of node_modules for unit/integration tests
RUN chown -R kursstatistikuser /application/node_modules

COPY --chown=kursstatistikuser:kursstatistik ["config", "config"]
COPY --chown=kursstatistikuser:kursstatistik ["app.js", "app.js"]
COPY --chown=kursstatistikuser:kursstatistik ["swagger.json", "swagger.json"]
COPY --chown=kursstatistikuser:kursstatistik ["server", "server"]
COPY --chown=kursstatistikuser:kursstatistik ["run.sh", "run.sh"]


RUN chmod +x ./run.sh

EXPOSE 3001

CMD ["./run.sh","node", "app.js"]
