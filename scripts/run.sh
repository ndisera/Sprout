# Source python environment
SCRIPT_PATH="${PWD}/$(dirname "$0")"
source "${SCRIPT_PATH}"/../server/env/bin/activate

# Check for dependencies
DEPENDENCIES=( "nginx" )

for dependency in "${DEPENDENCIES[@]}"; do
  which "${dependency}" &>/dev/null
  if [ ! $? -eq 0 ]; then
    echo "Error: ${dependency} is not on the PATH. Aborting."
    exit 1
  fi
done


# Setup a signal handler
trap killgroup SIGINT

killgroup()
{
  # If we recieve ctrl-c, kill ourselves
  kill 0
}

# run server and client in parallel
node "${SCRIPT_PATH}"/../client/server.js -f public -p 8001 &
client=$!

# Start uwsgi server
uwsgi --socket /tmp/django_api.sock --chdir="${SCRIPT_PATH}"/../server/ --module api.wsgi -H "${SCRIPT_PATH}/../server/env" &
uwsgi=$!

echo ""
echo "Starting nginx server"
echo ""
# Start the nginx server
nginx -c api_nginx.conf -p "${SCRIPT_PATH}"/../server/nginx &
nginx=$!

wait $uwsgi $client $nginx

# Deactivate the python environment
deactivate
