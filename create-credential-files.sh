
#!/bin/sh
set -e

set -o allexport
source .env set
set +o allexport

echo $LADOK3_CERT | base64 -d > ./config/secrets/kursstatistik-api@KTH.crt && chmod 600 ./config/secrets/kursstatistik-api@KTH.crt
echo $LADOK3_CERT_KEY | base64 -d > ./config/secrets/kursstatistik-api@KTH.key && chmod 600 ./config/secrets/kursstatistik-api@KTH.key
echo $CA_FILE | base64 -d > ./config/secrets/UF-prod-ca-bundle.txt && chmod 600 ./config/secrets/UF-prod-ca-bundle.txt
