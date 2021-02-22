#!/bin/bash

cd backend


mkdir -p ./dependencies/sendchatlayer/nodejs
mkdir -p ./dependencies/utilslayer/nodejs

echo "building chat layer"
cd dependencies/sendchatlayer/nodejs
pwd
cp ../../../sendchatlayer/*.* .
rm package-lock.json
rm -r node_modules
npm install --quiet
zip -qr sendchatlayer.zip .
cd ../..

echo "building utilslayer"
cd utilslayer/nodejs

cp ../../../utilslayer/*.* .
rm package-lock.json
rm -r node_modules
npm install --quiet
zip -qr utilslayer.zip .

cd ../../../
echo "installing node_modules"
cd Functions/HTTP
cd activegames_list
npm install --quiet
cd ../game_activate
npm install --quiet
cd ../game_answer
npm install --quiet
cd ../game_get
npm install --quiet
cd ../game_listonmarketplace
npm install --quiet
cd ../game_play
npm install --quiet
cd ../game_purchase_transform
npm install --quiet
cd ../gameheader_put
npm install --quiet
cd ../leaderboard_get
npm install --quiet
cd ../marketplace_get
npm install --quiet
cd ../mygames_list
npm install --quiet
cd ../permissions_add
npm install --quiet
cd ../player_get
npm install --quiet
cd ../player_put
npm install --quiet
cd ../playerprogression_get
npm install --quiet
cd ../playerwallet_add
npm install --quiet
cd ../playerwallet_get
npm install --quiet
cd ../purchasedgame_putkinesis
npm install --quiet
cd ../question_put
npm install --quiet
cd ../../IoT/answer_receive
npm install --quiet
cd ../game_cache
npm install --quiet
cd ../game_end
npm install --quiet
cd ../game_join
npm install --quiet
cd ../game_start
npm install --quiet
cd ../question_send
npm install --quiet
cd ../../WebSockets/auth
npm install
cd ../livegameadmin
npm install --quiet
cd ../livegameplayer
npm install --quiet
cd ../onconnect
npm install --quiet
cd ../ondisconnect
npm install --quiet

cd ../
