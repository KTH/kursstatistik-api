#!/bin/sh
set -e

echo $LADOK3_CERT | base64 -d > ./config/secrets/kursstatistik-api@KTH.crt && chmod 600 ./config/secrets/kursstatistik-api@KTH.crt
echo $LADOK3_CERT_KEY | base64 -d > ./config/secrets/kursstatistik-api@KTH.key && chmod 600 ./config/secrets/kursstatistik-api@KTH.key
echo $CA_FILE | base64 -d > ./config/secrets/UF-prod-ca-bundle.txt && chmod 600 ./config/secrets/UF-prod-ca-bundle.txt

# Copy fresh template
cp ./config/secrets/stunnel.conf.in ./config/secrets/stunnel.conf 

# Insert env-variables at predefined spots
sed -i "s/STUNNEL_CONFIGURATION_NAME/${STUNNEL_CONFIGURATION_NAME}/g" ./config/secrets/stunnel.conf
sed -i "s/STUNNEL_CONFIGURATION_CONNECT_URL/${STUNNEL_CONFIGURATION_CONNECT_URL}/g" ./config/secrets/stunnel.conf
cat ./config/secrets/stunnel.conf
stunnel ./config/secrets/stunnel.conf 2>&1 &

exec $*