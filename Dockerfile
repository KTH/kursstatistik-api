FROM kthse/kth-nodejs:10.14.0


RUN apk update && \
    apk upgrade && \
    apk add --no-cache --virtual .gyp python make g++ python2 stunnel && \
    rm -rf /var/cache/apk/*

COPY ["package-lock.json", "package-lock.json"]
COPY ["package.json", "package.json"]
RUN npm install --global node-gyp
RUN npm install --unsafe-perm ibm_db
RUN npm install --global --production


# Copy files used by Gulp.
COPY ["config", "config"]

# Copy source files, so changes does not trigger gulp.
COPY ["app.js", "app.js"]
COPY ["swagger.json", "swagger.json"]
COPY ["server", "server"]

EXPOSE 3001

CMD ["node", "app.js"]
