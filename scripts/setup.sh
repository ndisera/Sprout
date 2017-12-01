# BACKEND SETUP
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
