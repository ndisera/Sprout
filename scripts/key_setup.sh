#!/bin/bash
#
# Filename: scripts/key_setup.sh
#
# Author: Simon Redman <simon@ergotech.com>
# File Created: 13 January 2018
# Last Modified: Sat 13 Jan 2018 06:29:26 PM MST
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
CERT_VALIDITY_DAYS=1024


# Helper functions

#
# generate_key
# Generate a private key
# Argument 1: The full path of the key to generate
# Return: void
#
function generate_key
{
  # Check for existing file
  if [ -f "${1}" ]; then
    echo "${1} already exists -- Not trampling"
    return
  fi

  echo "Generating the private key ${1} -- Be sure to keep this private!"
  openssl genrsa -out "${1}"
}

#
# generate_csr
# Generate a Certificate Signing Request
# Argument 1: Full path of the CSR to generate
# Argument 2: Private key for which to generate a certificate
# Return: void
#
function generate_csr
{
  # The CSR can and should be trampled, in case the key has changed

  openssl req -new -key "${2}" -out "${1}"
}

#
# generate_cert
# Generate a self-signed certificate
# Argument 1: Full path of the certificate to generate
# Argument 2: Keyfile used for signing
# Return: void
#
function generate_cert
{
  # Check for existing file
  if [ -f "${1}" ]; then
    echo "${1} already exists -- Not trampling"
    return
  fi

  echo "Generating the root CA certificate ${1} -- Please answer the following questions."
  openssl req -x509 -new -nodes -key "${2}" -sha256 -days "${CERT_VALIDITY_DAYS}" -out "${1}"
}

#
# generate_cert_with_csr
# Generate a signed certificate based on the given PKI
# Argument 1: Full path of the certificate to generate
# Argument 2: Keyfile to sign
# Argument 3: RootCA certificate file
# Argument 4: RootCA key file
# Return: void
#
function generate_cert_with_csr
{
  # Check for existing file
  if [ -f "${1}" ]; then
    echo "${1} already exists -- Not trampling"
    return
  fi

  TEMP_CSR="${PKI_PATH}/temp.csr"

  echo "Generating the certificate ${1} -- Please answer the following questions"
  echo "Be sure the Common Name is the hostname of the server as it appears in http requests"
  generate_csr "${TEMP_CSR}" "${2}"
  openssl x509 -req -in "${TEMP_CSR}" -CA "${3}" -CAkey "${4}" -CAcreateserial -out "${1}" -days "${CERT_VALIDITY_DAYS}" -sha256
}

# Check for dependencies
DEPENDENCIES=( "openssl" )

for dependency in "${DEPENDENCIES[@]}"; do
  which "${dependency}" &>/dev/null
  if [ ! $? -eq 0 ]; then
    echo "Error: ${dependency} is not on the PATH. Aborting."
    exit 1
  fi
done

# Make the directories if they do not exist
mkdir -p "${PKI_PATH}"

# Generate the private CA key
generate_key "${PKI_PATH}${CA_KEY_NAME}"

# Generate the CA certificate
generate_cert "${PKI_PATH}${CA_CERT_NAME}" "${PKI_PATH}${CA_KEY_NAME}"

# Generate the frontend encryption key
generate_key "${PKI_PATH}${FRONTEND_KEY_NAME}"

# Use our CA certificate to create a signed certificate for the frontend
generate_cert_with_csr "${PKI_PATH}${FRONTEND_CERT_NAME}" "${PKI_PATH}${FRONTEND_KEY_NAME}" "${PKI_PATH}${CA_CERT_NAME}" "${PKI_PATH}${CA_KEY_NAME}" 
