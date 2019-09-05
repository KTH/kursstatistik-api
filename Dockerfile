FROM kthse/kth-nodejs:10.14.0

MAINTAINER KTH Webb "cortina.developers@kth.se"




#STUNNEL
RUN install
RUN apk add make gcc gcc-c++ kernel-devel openssl-devel bzip2-devel
RUN install python2.7.x
RUN install node.js
RUN npm install --unsafe-perm ibm_db

RUN apk --no-cache add stunnel

RUN mkdir -p /npm && \
    mkdir -p /application



#RUN npm install --save bcrypt-nodejs && npm uninstall --save bcrypt
# We do this to avoid npm install when we're only changing code
WORKDIR /npm
#COPY ["package-lock.json", "package-lock.json"]
COPY ["package.json", "package.json"]
RUN npm install --global --production

#RUN npm install bindings

# Add the code and copy over the node_modules-catalog
WORKDIR /application
RUN cp -a /npm/node_modules /application && \
    rm -rf /npm

#RUN cd /application/node_modules/ibm_db/installer source setenv.sh db2cli bind /application/node_modules/bnd/@db2cli.lst -database LADOK3_USERNAME:STUNNEL_HOST:11000 -user LADOK3_USERNAME -passwd LADOK3_PASSWORD -options "grant public action replace blocking no"
#RUN npm rebuild  

# Copy files used by Gulp.
COPY ["config", "config"]

COPY ["package.json", "package.json"]

# Copy source files, so changes does not trigger gulp.
COPY ["app.js", "app.js"]
COPY ["swagger.json", "swagger.json"]
COPY ["server", "server"]

ENV NODE_PATH /application

EXPOSE 3001

#RUN chmod +x ./run.sh

CMD ["node", "app.js"]
