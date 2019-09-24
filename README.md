# Kursstatistik-api

Project for course statistics from _Ladok Uppföljningsdatabas_ using _[Stunnel](https://www.stunnel.org)_.

## Stunnel

### Development Setup on macOS

#### Add Certificate from Ladok

After ordering a certificate from Ladok, you will receive an email with instructions. Follow these instructions and download certficate (PFX file) and password (copy from webpage). The email might also include instructions on how to extract key and client certificate. Below is a modified set of instructions (based in [this post](http://sharepointoscar.com/2017-03-16-extract-key-from-pfx/)). Extract key and certificate in a suitable folder.

```sh
# Extract private key from PFX file
$ openssl pkcs12 -in [certificate file name].pfx -nocerts -out [user name]@KTH.pem -nodes

# Set secure file permissions on private key file
$ chmod 400 [user name]@KTH.pem

# Extract client certificate from PFX file
$ openssl pkcs12 -in [certificate file name].pfx -out [user name]@KTH.crt -clcerts -nokeys
```

#### Install Stunnel

This assumes that you have _Homebrew_ installed. If not, follow the instructions on [brew.sh](https://brew.sh/).

```sh
$ brew install stunnel
```

#### Configure Stunnel

After ordering a certificate from Ladok, you will also receive an email with instructions on how to configure _Stunnel_. Below is a modified set of instructions and suggested configuration.

You may, or may not, choose to use a _config_ folder. These instructions assume that all files are in ```/usr/local/etc/stunnel```, simply called the _stunnel folder_,

1. Save the certificate chain file, e.g. ```UF-prod-ca-bundle.txt```, to the stunnel folder.
2. Move the private key file and the client certificate file to the stunnel folder.
3. Change the _stunnel config file_, ```stunnel.conf``` to:

```sh
debug = 7
foreground = yes
[db2_ufhsk_Prod]
client = yes
accept = localhost:11000
connect = ufhsk.ladok.se:2345
key = [user name]@KTH.pem
verify = 2
cert = [user name]@KTH.crt
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

### Add certificates and key to secrets

In secrets you need to set LADOK3_CERT, LADOK3_CERT_KEY, CA_FILE.

1. Remove password from private key with command <code>openssl rsa -in encrypted_key.pem -out decrypted_key.pem</code>.
2. Run base64 -i <name.pfx> -o <name.pfx.64> for cert, key and CAfile in your terminal.
3. Copy the content in the three name.pfx.64 - files and past them in the secrets.env.

### Data base connection string using ibm_db

Set the following variables in secrets.env for the database connection string:

```sh
LADOK3_USERNAME=xxxxx
LADOK3_PASSWORD=xxxxx
LADOK3_DATABASE=xxxx
STUNNEL_HOST=localhost
```

The connection string looks like this:

```sh
DATABASE=${process.env.LADOK3_DATABASE};HOSTNAME=${process.env.STUNNEL_HOST};UID=${process.env.LADOK3_USERNAME};PWD=${process.env.LADOK3_PASSWORD};PORT=11000;PROTOCOL=TCPIP
```
