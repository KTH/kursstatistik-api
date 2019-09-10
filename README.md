# Kursstatistik-api
## Project for course statistics from Ladok Uppföljningsdatabas using Stunnel

### Stunnel config

```
debug = 7
foreground = yes
[db2_ufhsk_Prod]
client = yes
accept = 11000
connect = ufhsk.ladok.se:2345
key = ./config/secrets/xxx.key
verify = 4
cert = ./config/secrets/xxx.crt
CAfile = ./config/secrets/UF-prod-ca-bundle.txt
```

### Add certificates and key to secrets

In secrets you need to set LADOK3_CERT, LADOK3_CERT_KEY, CA_FILE.

1. Remove password from private key with command <code>openssl rsa -in encrypted_key.pem -out decrypted_key.pem</code>.
2. Run base64 -i <name.pfx> -o <name.pfx.64> for cert, key and CAfile in your terminal.
3. Copy the content in the three name.pfx.64 - files and past them in the secrets.env.

### Data base connection string using ibm_db

Set the following variables in secrets.env for the database connection string:

```
LADOK3_USERNAME=xxxxx
LADOK3_PASSWORD=xxxxx
LADOK3_DATABASE=xxxx
STUNNEL_HOST=localhost
```

The connection string looks like this:

```
DATABASE=${process.env.LADOK3_DATABASE};HOSTNAME=${process.env.STUNNEL_HOST};UID=${process.env.LADOK3_USERNAME};PWD=${process.env.LADOK3_PASSWORD};PORT=11000;PROTOCOL=TCPIP
```
