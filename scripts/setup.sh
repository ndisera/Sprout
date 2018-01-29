#!/usr/bin/env bash

SCRIPT_PATH="${PWD}/$(dirname "$0")"

# BACKEND SETUP

# Check if virtualenv is installed
which virtualenv &>/dev/null
if [ ! $? -eq 0 ]; then
  echo "Error: virtualenv is not on the PATH. Aborting."
  exit 1
fi

# Check if npm is installed
which npm &>/dev/null
if [ ! $? -eq 0 ]; then
  echo "Error: npm is not on the PATH. Aborting."
  exit 1
fi

# set up the virtualenv
cd "${SCRIPT_PATH}"/../server
virtualenv env

# activate the virtualenv
source env/bin/activate

# install api server dependencies
pip install -r requirements.txt

# Install Haraka SMTP server
pushd haraka-smtp

npm install

popd # End Haraka setup

# set up database
python manage.py makemigrations
python manage.py migrate

# FRONTEND SETUP
# install the node dependencies
cd "${SCRIPT_PATH}"/../client
pwd
npm install

cd src
pwd
"${SCRIPT_PATH}"/../client/node_modules/bower/bin/bower install
