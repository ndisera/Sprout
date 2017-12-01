# Server

------

This is the server section of Sprout. It contains the api and database.
It has a defined set of API routes with which you can query data.
When running, it contains an sqlite database file in this folder.

## Setup

Prereqs:

- python (version 2.7.*)
- pip
- virtualenv

> The easiest way to set up both the frontend and backend at the same time is to use the 
> setup.sh script in the \<Repo>/scripts folder. It performs the steps below automatically

We start in this folder (\<Repo>/server), and we run the following command
```bash
virtualenv env
```

This creates a virtual environment called "env" in your server folder. This contains all
python packages and changes to this folder, as to not affect the rest of your system.
In order to use the virtual environment, we must activate it whenever we work on the server
side code and deactivate it when we're done. Let's activate it
```bash
source env/bin/activate
```

In the future, when you want to stop working on the server, you deactivate by running the command
```bash
deactivate
```

Next, we need to install all of the server's package dependencies. We do this using pip, and we give
it the list of dependencies conveniently located in `requirements.txt`
```bash
pip install -r requirements.txt
```

Finally, we need to create the database for our server. We do this by running a migration. This will
look at the models contained in our python code, and generate appropriate tables in our database.
```bash
python manage.py migrate
```

Our setup is done! Next, we can run the server by using the command
```bash
python manage.py runserver
```

You now have a server running at [http://localhost:8000/](http://localhost:8000)

We can stop the server by pressing `Ctrl-C` on the terminal running the server

## Documentation

Accessing the documentation for the api is very simple -- the server hosts its own docs!

You can navigate to [localhost:8000/docs/](http://localhost:8000/docs/)

Or, if you like swagger, go to [localhost:8000/swagger/](http://localhost:8000/docs/)

These both have the added benefit of allowing you to test the api right there on the webpage.


## Interacting with the Server

There are a variety of ways to interact with the server. Whether it's adding test data,
seeing what's in the database, or whatever you may want, we've got you covered with the following
ways

- Through the Docs
- httpie (or cURL)
- SQLite Command Line Tool
- Django Shell

#### Through the Docs

As mentioned before, the docs located at [localhost:8000/docs/](http://localhost:8000/docs/) 
and [localhost:8000/swagger/](http://localhost:8000/docs/) have widgets that let you send real
requests to the server. You can use the docs to figure out what the requests should look like, but
if it's a POST request it may involve you writing a JSON object that looks something like...

```json
{
  "first_name": "Simon",
  "last_name": "Redman",
  "birthdate": "1995-01-18"
}
```

#### httpie (or curl)

httpie is an easy to use command line tool that lets you send HTTP requests to servers. I'll let you
look at the documentation [here](http://httpie.org/), but the command might look something like...

```bash
http localhost:8000/students/ first_name=Simon last_name=Redman
```

httpie will create a POST request and the JSON object by default.

If you want to use curl, the documentation is [here](https://curl.haxx.se/)

#### SQLite Tool

The sqlite3 tool is simple and easy to use. It's a command line tool that lets you load in a database
and explore it. To load in the database, locate the `*.sqlite3` file in the server folder (most likely
`db.sqlite3`) and run this command

```bash
sqlite3 db.sqlite3
```

This will open up a shell where you can use commands. Type `.help` to see commands, `.tables` to see a
list of tables. Finally, you can use valid SQL queries to view data in the database.

#### Django Shell

You can also use the Django Shell to use python to interact with the database. Navigate to the \<Repo>/server
folder, and run the following command

```bash
python manage.py shell
```

You have now opened a python shell connected to the Sprout django project. You can view anything about the
server, but if you want, for example, to view the name of the first student in the database you could run 
the following commands

```python
from api.models import Student
all_students = Student.objects.all()
print all_students[0].first_name
```
