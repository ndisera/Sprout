# Client

------

Sprout's client is an AngularJS SPA served by a simple Express Node.js static web server.

## Setup

Prereqs:

- Node.js
- npm
- bower

> The easiest way to set up both the frontend and backend at the same time is to use the 
> setup.sh script in the \<Repo\>/scripts folder. It performs the steps below automatically

We start in this folder (\<Repo\>/client), and we run the following command
```bash
npm install
```

This will tell npm to look at our `package.json` and `package-lock.json` files and install all
the dependencies listed.

After npm has finished installing, We next go to \<Repo\>/client/src and run the following command
```bash
bower install
```

This will tell bower to install all of the needed frontend (js, css, etc...) dependencies and put
them in \<Repo\>/client/src/bower\_components

After bower is finished installing, you should be all set up!

## Running the Node.js Server

The Node.js server is a very simple static file server. It allows clients to download the
AngularJS, HTML, CSS, etc... files needed to run the client from their browser. To whit, the code
is very simple and running it is very simple. Navigate to the folder that contains server.js
(\<Repo\>/client) and run the command

```bash
node server.js
```

When run, the server will use port 8001 and server the \<Repo>/client/public folder. Alternatively, it 
takes two optional command line arguments.

#### -p "port"

You may include a -p flag, which must be immediately followed by the port number on which you want
the server to listen. i.e.

```bash
node server.js -p 8080
```

#### -f "folder"

You may include a -f flag, which must be immediately followed by the folder which you want
the server to serve. i.e.

```bash
node server.js -f other
```

This will serve the `other` folder inside the directory where serve.js resides.

## Wait... Something's Wrong!

Don't panic -- Sprout's frontend uses gulp to simplify and minimize the frontend source code.
Chances are you didn't run gulp after you made changes. Fortunately, the run.sh script in \<Repo\>/scripts 
does this for you. If you're not using the run script, then simply navigate to \<Repo\>/client and run the
following command

```bash
gulp
```

## How Do I Add a Dependency?

There's a few steps

First, go to [bower](http://bower.io/search/) and find the package you want

Then navigate to \<Repo\>/client/src and run 

```bash
bower install NAME\_OF\_PACKAGE --save 
```

The "--save" flag will update the bower.json file so that this package is automatically installed in the future
(when running the setup script of bower install).

Next, we'll tell gulp to copy over the file to the public/includes folder so that index.html can access it when the
frontend is built.

Navigate to \<Repo\>/client and edit the gulpfile.js. You're going to add both the normal AND minified js filepaths.
You can find the file path by searching through \<Repo\>/client/src/bower\_components/NAME\_OF\_PACKAGE. (Protip: sometimes
it's in the 'dist' folder). We're adding both normal and minified so that gulp can make a debug and production version of our
frontend. Add the two filepaths to the "include\_paths" variable. You should follow the example of the other paths already added,
but it will probably look something like

```
bower_path + 'NAME_OF_PATH/where/it/is/file.min.js'
bower_path + 'NAME_OF_PATH/where/it/is/file.js'
```

Finally, we're going to make tell index.html to load the files. Navigate to \<Repo\>/client/src/index.html and add the
minified file under the `@ifndef DEBUG` comment and the normal file under the `@ifdef DEBUG` comment.

You should be done!











