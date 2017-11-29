## Backend Setup

Install (python) virtualenv

cd to <Repo>/BackEnd

Run command `virtualenv env`

We are going to activate the virtual environment. This needs to happen every time before working on the BackEnd

Run: `source env/bin/activate`

(In order to deactivate, run `deactivate`)

Run `pip install django djangorestframework`

`cd <Repo>/BackEnd/sprout`

Now setup a clean database

`python manage.py makemigrations api`

`python manage.py migrate`

Now launch the server

`python manage.py runserver`

By default, this will launch the server on port 8000. Let's launch a web browser to make sure things seem to be working

Navigate to 'localhost:8000/students.api' and make sure you don't see an error

## Add test data

Send a POST request to the server with the json data { "first_name":"Simon", "last_name":"Redman" }

For example, using httpie, run `http localhost:8000/students/ first_name=Simon last_name=Redman birthdate=1995-01-18`
