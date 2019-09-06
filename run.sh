#!/bin/sh
set -e

echo $LADOK3_CERT | base64 -d > ./config/secrets/chonny@KTH.crt && chmod 600 ./config/secrets/chonny@KTH.crt
echo $LADOK3_CERT_KEY | base64 -d > ./config/secrets/chonny@KTH.key && chmod 600 ./config/secrets/chonny@KTH.key
echo $CA_FILE | base64 -d > ./config/secrets/UF-prod-ca-bundle.txt && chmod 600 ./config/secrets/UF-prod-ca-bundle.txt


stunnel ./config/secrets/stunnel.conf 2>&1 &

exec $*