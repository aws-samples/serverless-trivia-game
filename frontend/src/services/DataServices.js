/*
  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import Api from '@/services/Api';

export const DataService = {
    getActiveGameList(parms){
        try{
            return Api(parms.jwt).get('/activegames');
        } catch(e) {
            console.error(JSON.stringify(e));
        }
    },
    getActiveGameQuery(parms){
        try{
            return Api(parms.jwt).get('/activegames?' + parms.queryString + "=" + parms.value);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
    },
    getMyGameList(parms){
        try{
            return Api(parms.jwt).get(parms.uri);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
    },
    getGame(parms){
        try{
            return Api(parms.jwt).get('/games/' + parms.gameId + '/' + parms.playerName);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
    },
    getFullGame(parms){
        try{
            return Api(parms.jwt).get('/players/' + parms.playerName + '/games/' + parms.gameId);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
    },
    saveHeader(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        try{
            return Api(jwt).post('/games', parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
    },
    saveQuestion(parms){
        let jwt = parms.jwt;
        delete parms.jwt
        try{
            return Api(jwt).post('/games/'+parms.gameId+"/questions/"+parms.questionNumber, parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
    },
    hostGame(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).post('/activegames/'+parms.gameId, parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    scoreQuiz(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).post('/games/' +parms.gameId + '/answer', parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    getScoreboard(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).get('/games/' +parms.gameId + '/scoreboard');
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    getScoreboardWithPlayer(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).get('/games/' +parms.gameId + '/scoreboard/' + parms.playerName);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    saveScore(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).get('/games/' + parms.gameId + '/scoreboard/' + parms.playerName, parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    getPlayer(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).get('/players/' + parms.playerName);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    setPlayer(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).put('/players/' + parms.playerName, parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    postPlayerSubscription(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).post('/players/' + parms.playerName + '/subscriptions', parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    getPlayerProgress(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).get('/players/' + parms.playerName + '/progress');
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    postPlayerWallet(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).post('/players/' + parms.playerName + '/wallet', parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    getPlayerWallet(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).get('/players/' + parms.playerName + '/wallet', parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    putGameToMarketplace(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).put('/players/' + parms.playerName + '/games/' + parms.gameId, parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    loadMarketplace(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).get('/marketplace', parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    purchaseGame(parms){
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = Api(jwt).post('/marketplace', parms);
        } catch(e) {
            console.error(JSON.stringify(e));
        }
        return response;
    },
    async attachPrincipalPolicy(parms) {
        let jwt = parms.jwt;
        delete parms.jwt;
        let response;
        try {
            response = await Api(jwt).post('/playerpermission', parms);
            if(response.status===200)
                return true;
            else
                return false;
        } catch(e) {
            console.error(JSON.stringify(e));
            return false;
        }
    }

}