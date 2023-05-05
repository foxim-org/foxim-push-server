ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa ${SSH_USERNAME}@${SSH_IP} \
PORT=$PORT \
MQTT_MONGO_URL=$MQTT_MONGO_URL \
PERSISTENCE_TTL=$PERSISTENCE_TTL \
JWT_SECRET=$JWT_SECRET \
MQTT_SECRET_CLIENT_ID=$MQTT_SECRET_CLIENT_ID \
BROKER_ID=$BROKER_ID \
REDIS_HOST=$REDIS_HOST \
REDIS_PORT=$REDIS_PORT \
REDIS_USERNAME=$REDIS_USERNAME \
REDIS_PASSWORD=$REDIS_PASSWORD \
'bash -s' <<"ENDSSH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd ~/server
if [[ ! -d "foxim-push-server" ]]; then
  git clone https://github.com/foxim-org/foxim-push-server
  cd foxim-push-server
else
  cd foxim-push-server
  git fetch --all
  git reset --hard origin/main
fi
cat <<EOT > .env
PORT=$PORT
MQTT_MONGO_URL=$MQTT_MONGO_URL
PERSISTENCE_TTL=$PERSISTENCE_TTL
JWT_SECRET=$JWT_SECRET
MQTT_SECRET_CLIENT_ID=$MQTT_SECRET_CLIENT_ID
BROKER_ID=$BROKER_ID
REDIS_HOST=$REDIS_HOST
REDIS_PORT=$REDIS_PORT
REDIS_USERNAME=$REDIS_USERNAME
REDIS_PASSWORD=$REDIS_PASSWORD
EOT
npm i
pm2 delete foxim-push-server
pm2 start --name foxim-push-server index.js
pm2 save
ENDSSH
