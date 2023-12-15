# Welcome to Kursstatistik-api 👋

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?cacheSeconds=2592000)
![Prerequisite](https://img.shields.io/badge/node-18-blue.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

Micro service for course statistics from _Ladok Uppföljningsdatabas_ using _[Stunnel](https://www.stunnel.org)_.

## Setup in Azure

### Stunnel

#### Add or Change Certificate from Ladok

See document _Certifikat för uppföljningsdatabasen i kursstatistik-api_ in Confluence.

## Development Setup on macOS

### Stunnel

#### Add Certificate from Ladok

After ordering a certificate from Ladok, you will receive an email with instructions. Follow these instructions and download certficate (PFX file) and password files. The email might also include instructions on how to extract key and client certificate. Below is a modified set of instructions (based in [this post](http://sharepointoscar.com/2017-03-16-extract-key-from-pfx/)). The modification is necessary so that the password to the key can be removed later (this modification might not be necessary with an improved Stunnel configuration.) Extract key and certificate in a suitable folder.

```sh
# Extract private key from PFX file
$ openssl pkcs12 -in [certificate file name].pfx -nocerts -out kursstatistik-api@KTH.key -nodes

# Set secure file permissions on private key file
$ chmod 400 kursstatistik-api@KTH.pem

# Extract client certificate from PFX file
$ openssl pkcs12 -in [certificate file name].pfx -out kursstatistik-api@KTH.crt -clcerts -nokeys
```

Afterwards, make sure to remove anything before the initial `-----BEGIN PRIVATE KEY-----` from the kursstatistik-api@KTH.key file before running the following commands.

```sh
# Convert private key to base64 and copy to clipboard
$ cat kursstatistik-api@KTH.key | base64 | pbcopy

# Convert client certificate to base64 and copy to clipboard
$ cat kursstatistik-api@KTH.crt | base64 | pbcopy
```

Set the resulting strings as `LADOK3_CERT_KEY` and `LADOK3_CERT` respectively

#### Install Stunnel

This assumes that you have _Homebrew_ installed. If not, follow the instructions on [brew.sh](https://brew.sh/).

```sh
$ brew install stunnel
```

#### Configure Stunnel

After ordering a certificate from Ladok, you will also receive an email with instructions on how to configure _Stunnel_. Below is a modified set of instructions and suggested configuration. A certificate chain file will also be attached to the email.

You may, or may not, choose to use a _config_ folder. These instructions assume that all files are in `/usr/local/etc/stunnel`, simply called the _stunnel folder_,

1. Save the certificate chain file, e.g. `UF-prod-ca-bundle.txt`, to the stunnel folder.
2. Move the private key file and the client certificate file to the stunnel folder.
3. Change the _stunnel config file_, `stunnel.conf` to:

```sh
debug = 7
foreground = yes
[db2_ufhsk_Prod]
client = yes
accept = localhost:11000
connect = kth.ufhsk.ladok.se:2345
key = kursstatistik-api@KTH.pem
verify = 2
cert = kursstatistik-api@KTH.crt
CAfile = [certificate chain file]
```

#### Start Stunnel

```sh
# In /usr/local/etc/stunnel
$ stunnel
```

_TODO: Add instructions to run Stunnel in any folder._

#### Troubleshooting

If localhost port 11000 is already in use:

```sh
# Find out which service that uses port 11000
$ lsof -nP -i4TCP:11000 | grep LISTEN

# stunnel 6850 [account name]   12u  IPv4 0x9fb72bfe23991e4b      0t0  TCP 127.0.0.1:11000 (LISTEN)

# Kill process
$ kill 6850
```

## Database Connection String Using ibm_db

Database connection details will also be included in the emails sent from Ladok. Set the following variables in .env for the database connection string:

```sh
LADOK3_USERNAME=xxxxx
LADOK3_PASSWORD=xxxxx
LADOK3_DATABASE=xxxxx
STUNNEL_HOST=localhost
```

The connection string looks like this:

```sh
DATABASE=${process.env.LADOK3_DATABASE};HOSTNAME=${process.env.STUNNEL_HOST};UID=${process.env.LADOK3_USERNAME};PWD=${process.env.LADOK3_PASSWORD};PORT=11000;PROTOCOL=TCPIP
```

## Test

Test data is available in document _KIP - Testdata - Förstagångsregistrerade och examinationsgrad.xlsx_.

## Developing on a Macbook with M1 or M2 chip

The `ibm_db` package does not run on newer macs with M1/M2 chipset. If you are using VSCode and want to develop/test locally, you can use the supplied devcontainer-configuration to start the project in a devcontainer.

If you want to run the docker image, you have to replace line 1 in the [Dockerfile](./Dockerfile) with the following:

```Docker
# FROM ubuntu:latest # Replace this
FROM --platform=linux/amd64 ubuntu:latest # with this
```

Make sure that only the `NODE_ENV: 'development'`
Then run `docker-compose -f docker-compose.yml up`
