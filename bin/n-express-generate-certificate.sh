#!/bin/bash

openssl req -x509 -days 365 -out self-signed-ssl-certificate.pem -keyout self-signed-ssl-key.pem \
		-newkey rsa:2048 -nodes -sha256 \
		-subj '/OU=FT.com dev root for next-router /CN=*.ft.com' -extensions EXT -config <( \
		printf "[dn]\nCN=*.ft.com\n[req]\ndistinguished_name = dn\n[EXT]\nsubjectAltName=DNS:*.ft.com")

if ! grep '*.pem' .gitignore > /dev/null; then
	echo "Adding *.pem (certificate/key files) to your .gitignore, please commit this"
	echo '*.pem' >> .gitignore
fi

if which security > /dev/null; then
	# MacOS
	echo "Adding to OSX Keychain..."
	security add-trusted-cert -r trustRoot -p ssl -k ~/Library/Keychains/login.keychain "self-signed-ssl-certificate.pem"
elif which update-ca-certificates > /dev/null; then
	# Linux (Debian/Ubuntu)
	echo "Adding to Linux CA trusted certificate..."
	sudo cp "self-signed-ssl-certificate.pem" /usr/local/share/ca-certificates/
	sudo update-ca-certificates
elif which update-ca-trust > /dev/null; then
	# Linux (CentOs 6)
	echo "Adding to Linux CA trusted certificate..."
	sudo cp "self-signed-ssl-certificate.pem" /etc/pki/ca-trust/source/anchors
	sudo update-ca-trust extract
fi
