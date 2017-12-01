# Client

------

Sprout's client is an AngularJS SPA served by a simple Express Node.js static web server.

## Setup

Prereqs:

- Node.js
- npm

> The easiest way to set up both the frontend and backend at the same time is to use the 
> setup.sh script in the \<Repo>/scripts folder. It performs the steps below automatically

We start in this folder (\<Repo>/client), and we run the following command
```bash
npm install
```

This will tell npm to look at our `package.json` and `package-lock.json` files and install all
the dependencies listed.

After npm is finished install, you should be all set up!

## Running the Node.js Server

The Node.js server is a very simple static file server. It allows clients to download the
AngularJS, HTML, CSS, etc... files needed to run the client from their browser. To whit, the code
is very simple and running it is very simple. Navigate to the folder that contains server.js
(\<Repo>/client) and run the command

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

