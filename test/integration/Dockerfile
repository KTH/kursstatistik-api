FROM kthse/kth-nodejs:18.0.0
LABEL maintainer="KTH StudAdm studadm.developers@kth.se"

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.7.3/wait /wait
RUN chmod +x /wait

COPY ["check-_paths.js", "check-_paths.js"]
COPY ["check-_paths.json", "check-_paths.json"]

CMD ["ash", "-c", "/wait && node check-_paths.js"]