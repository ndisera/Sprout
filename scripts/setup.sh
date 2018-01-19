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
cd ../server
virtualenv env

# activate the virtualenv
source env/bin/activate

# install api server dependencies
pip install -r requirements.txt

# set up database
python manage.py migrate

# FRONTEND SETUP
# install the node dependencies
cd ../client
npm install

cd src
bower install
