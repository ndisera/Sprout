SCRIPT_PATH="${PWD}/$(dirname "$0")"

# run gulp build
(cd "${SCRIPT_PATH}"/../client && ./node_modules/gulp/bin/gulp.js)

# Source python environment
source "${SCRIPT_PATH}"/../server/env/bin/activate

# Check for dependencies
DEPENDENCIES=( "nginx" "node" )

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

# Check for and get any new static files for the backend
pushd "${SCRIPT_PATH}/../server/"
yes yes | python manage.py collectstatic > /dev/null
popd

# Start uwsgi server
uwsgi --socket /tmp/django_api.sock --chdir="${SCRIPT_PATH}"/../server/ --module api.wsgi -H "${SCRIPT_PATH}/../server/env" &
uwsgi=$!

echo ""
echo "Starting nginx server"
echo ""
# Start the nginx server
nginx -c api_nginx.conf -p "${SCRIPT_PATH}"/../server/nginx &
nginx=$!

# echo ""
# echo "Starting Haraka SMTP server"
# echo ""
# HARAKA_EXE="${SCRIPT_PATH}/../server/haraka-smtp/node_modules/Haraka/bin/haraka"
# haraka() { "${HARAKA_EXE}" "$@" ; } # Like an alias, but cooler

# haraka -c "${SCRIPT_PATH}/../server/haraka-smtp/" 1>"${SCRIPT_PATH}/../server/haraka-smtp/haraka.log" 2>"${SCRIPT_PATH}/../server/haraka-smtp/haraka.err" &

# haraka=$!

wait $uwsgi $client $nginx

# Deactivate the python environment
deactivate
