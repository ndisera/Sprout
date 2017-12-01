# Source python environment
source ../server/env/bin/activate

# run server and client in parallel
python ../server/manage.py runserver &
server=$!

node ../client/server.js -f public -p 8001
client=$!

wait $server $client

# Deactivate the python environment
deactivate
