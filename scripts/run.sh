# Source python environment
source ../server/env/bin/activate

# Setup a signal handler
trap killgroup SIGINT

killgroup()
{
  # If we recieve ctrl-c, kill ourselves
  kill 0
}

# run server and client in parallel
node ../client/server.js -f public -p 8001 &
client=$!

python ../server/manage.py runserver &
server=$!

wait $server $client

# Deactivate the python environment
deactivate
