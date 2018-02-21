SCRIPT_PATH="${PWD}/$(dirname "$0")"

# Source python environment
source "${SCRIPT_PATH}"/../server/env/bin/activate

FRONTEND_SRC_DIR="${SCRIPT_PATH}"/../client
#
# gulp_build
# Use gulp to assemble all of our script files
# Arguments: None
# Return: void
#
function gulp_build {
# run gulp build
  cd "${FRONTEND_SRC_DIR}"
  ./node_modules/gulp/bin/gulp.js
}

# Check for dependencies
DEPENDENCIES=( "nginx" "node" "inotifywait" )

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

# Setup to run gulp on any frontend change
gulp_build
(
while true; do
  inotifywait -e close_write,moved_to,create -m "${FRONTEND_SRC_DIR}/src"
  gulp_build
done
) &

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

echo ""
echo "Starting Haraka SMTP server"
echo ""
HARAKA_EXE="${SCRIPT_PATH}/../server/haraka-smtp/node_modules/Haraka/bin/haraka"
haraka() { "${HARAKA_EXE}" "$@" ; } # Like an alias, but cooler

haraka -c "${SCRIPT_PATH}/../server/haraka-smtp/" 1>"${SCRIPT_PATH}/../server/haraka-smtp/haraka.log" 2>"${SCRIPT_PATH}/../server/haraka-smtp/haraka.err" &
haraka=$!

wait $uwsgi $client $nginx

# Deactivate the python environment
deactivate
