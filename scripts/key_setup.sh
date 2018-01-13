#!/bin/bash
#
# Filename: scripts/key_setup.sh
#
# Author: Simon Redman <simon@ergotech.com>
# File Created: 13 January 2018
# Last Modified: Sat 13 Jan 2018 02:07:18 PM MST
# Description: Setup keys and certificates for use with Sprout
#

# Constant parameter definitions
SCRIPT_PATH=$(dirname "$0")
PKI_PATH="${SCRIPT_PATH}"/../pki/
FRONTEND_KEY_PATH="${PKI_PATH}"/frontend
CA_KEY_NAME="private_sproutCA.key" # KEEP THIS PRIVATE!! Used to sign our CA certificate
CA_CERT_NAME="rootCA_cert.pem" # Install this onto client workstations to avoid untrusted CA warnings
FRONTEND_KEY_NAME="private_frontend_key.key" # KEEP THIS PRIVATE!! Used to encrypt Sprout's HTTPS connection
FRONTEND_CERT_NAME="frontend_cert.pem" # Used to authenticate the HTTPS connection
FRONTEND_CSR_NAME="frontend.csr" # Certificate Signing Request to create the signed certificate for the frontend
CERT_VALIDITY_DAYS=1024

# Check for dependencies
DEPENDENCIES=( "openssl" )

for dependency in "${DEPENDENCIES[@]}"; do
  which "${dependency}" &>/dev/null
  if [ ! $? -eq 0 ]; then
    echo "Error: ${dependency} is not on the PATH. Aborting."
    exit 1
  fi
done

# Check for existing files
# Since these cannot be recreated, we don't want to just trample them
EXISTING_FILES=( "${CA_KEY_NAME}" "${CA_CERT_NAME}" "${NODE_KEY_NAME}" "${NODE_CERT_NAME}" )

for file in "${EXISTING_FILES[@]}"; do
  fullpath="${PKI_PATH}${file}"
  if [ -f "${fullpath}" ]; then
    echo "${fullpath} already exists. Refusing to trample. Aborting."
    exit 1
  fi
done

# Make the directories if they do not exist
mkdir -p "${PKI_PATH}"

# Generate the private CA key
echo "Generating the private key ${PKI_PATH}${CA_KEY_NAME} -- Be sure to keep this private!"
openssl genrsa -out "${PKI_PATH}${CA_KEY_NAME}"

# Generate the CA certificate
echo "Generating the root CA certificate ${PKI_PATH}${CA_CERT_NAME} -- Please answer the following questions."
openssl req -x509 -new -nodes -key "${PKI_PATH}${CA_KEY_NAME}" -sha256 -days "${CERT_VALIDITY_DAYS}" -out "${PKI_PATH}${CA_CERT_NAME}"

# Generate the frontend CA key
echo "Generating the frontend encryption key ${PKI_PATH}${FRONTEND_KEY_NAME} -- Be sure to keep this private!"
openssl genrsa -out "${PKI_PATH}${FRONTEND_KEY_NAME}"

# Use our CA certificate to create a signed certificate for the frontend
echo "Generating the frontend certificate ${PKI_PATH}${FRONTEND_CERT_NAME} -- Please answer the following questions"
echo "Be sure the Common Name is the hostname of the front end server as it appears in the browser address bar"
openssl req -new -key "${PKI_PATH}${FRONTEND_KEY_NAME}" -out "${PKI_PATH}${FRONTEND_CSR_NAME}"
openssl x509 -req -in "${PKI_PATH}${FRONTEND_CSR_NAME}" -CA "${PKI_PATH}${CA_CERT_NAME}" -CAkey "${PKI_PATH}${CA_KEY_NAME}" -CAcreateserial -out "${PKI_PATH}${FRONTEND_CERT_NAME}" -days "${CERT_VALIDITY_DAYS}" -sha256
