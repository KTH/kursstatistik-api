#!/bin/sh
set -e
echo $LADOK3_CERT
echo $LADOK3_CERT | awk  '{gsub("\\\\n","\n")};1' > /config/secrets/chonny@KTH.crt && chmod 600 /config/secrets/chonny@KTH.crt
echo $LADOK3_CERT_KEY | awk  '{gsub("\\\\n","\n")};1' > /config/secrets/chonny@KTH.key && chmod 600 /config/secrets/chonny@KTH.key

stunnel /config/secrets/stunnel.conf 2>&1 &

exec $*