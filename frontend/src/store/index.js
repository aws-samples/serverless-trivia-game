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

import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        uimode: 'home',
        gamemode: 'showgames',
        adminmode: '',
        game: {
            quizName: '',
            questions: {},
            gameId: '',
            numberofquestions: 0,
            questionType: ''
        },
        scoreboard: {
            players: []
        },
        system: [],
        chat : {
            system: [],
            global: [],
            local: []
        },
        user: {},
        profile: {
            location: '',
            realName: ''
        },
        ws: {
            connected: false
        },
        mqtt: {
            connected: false
        },
        games: {
           gamelist: [] 
        },
        ping : {
            seconds: 300000,  //every 5 minutes
            maxCount: -1   //set to # of pings before disconnect, -1 = max session for API GW
        },
        admin: {
            newquiz: {
                gameid: undefined
            },
            hostgames: {
                mode: 'getlist',
                gamelist: []
            },
            gamelist: [],
            game:{}
        },
        live: {
            admin: {
                gameKey: '',
                live: false,
                blitz: false,
                uimode: '',
                gameType: '',
                questions: [],
                quizName: '',
                gameId: '',
                questionType: '',
                players: [],
                playersanswered: [],
                responses:0,
                questionnumber:0,
                question: {}
            },
            player: {
                gameKey:'',
                live: false,
                blitz: false,
                uimode: '',
                question: {},
                answer: '',
                alternatives: '',
                answerFollowup: '',
                scoreboard: [],
                playersresponded: [],
                answerboard: [],
                questiongroup:0,
                gameid:'',
                quizName: '',
                gametype: '',
                scoreboardnote: '',
                players: [],
                responses: 0,
                host:''
            },
            blitz: {
                playerCount:0,
                responses:0,
                correct:0,
                myResult:'',
                gameOver: false,
                questionwinner: ''
            },
            scoreboard: [],
        }

    },
    getters: {
        numberofquestions: (state, getters) => {return getters.live.admin.questions.length;}
},
    mutations: {
        setGameId (state, payload) {
            state.admin.newquiz.gameid = payload;
        },
        setAdminMode (state, payload) {
            state.adminmode=payload;
        },
        setGameState (state, payload) {
            state.gamemode = payload;
        },
        setQuizName (state, payload) {
            state.game.quizName = payload;
        },
        setQuizType(state, payload) {
            state.game.questionType = payload;
        },
        setQuestions (state, payload) {
            state.game.questions = payload;
        },
        setNumberofQuestions(state, payload) {
            state.game.numberofquestions = payload
        },
        setScoreboard (state, payload) {
            state.scoreboard.players = payload;
        },
        setLocalChat (state, payload) {
            state.chat.local.unshift(payload + "\r\n")
        },
        setGlobalChat (state, payload) {
            state.chat.global.unshift(payload + "\r\n")
        },
        setSystemChat (state, payload) {
            state.system.unshift(payload + "\r\n")
        },
        setUserCognito(state, payload) {
            state.user.cognito = payload;
        },
        setUserName(state, payload) {
            state.user.username = payload;
        },
        setUserJWT(state, payload) {
            state.user.Jwt = payload;
        },
        setAccessJWT(state, payload) {
            state.user.AccessJwt = payload;
        },
        setProfileLocation(state, payload) {
            state.profile.location = payload;
        },
        setProfileName(state, payload) {
            state.profile.realName = payload;
        },
        setConnected(state, payload) {
            state.ws.connected = payload;
        },
        setMQTTConnected(state, payload) {
            state.mqtt.connected = payload;
        },
        setGameList(state, payload) {
            state.games.gamelist = payload;
        },
        setHostGameList(state, payload) {
            state.admin.hostgames.gamelist = payload;
        },
        setAdminGameList(state, payload) {
            state.admin.gamelist = payload;
        },
        setAdminGame(state, payload){
            state.admin.game = payload;
        },
        setAdminLiveGameKey(state, payload){
            state.live.admin.gameKey = payload;
        },
        updateAdminEditQuestion(state, payload){
            let index = parseInt(payload.questionNumber) - 1;
            let replace = 0;
            if(index<state.admin.game.questions.length){
                replace = 1;
            }
            state.admin.game.questions.splice(index,replace,payload);
        },
        setAdminLiveBlitzMode(state, payload){
            state.live.admin.blitz = payload;
        },
        setAdminLiveBlitzQuestion(state, payload) {
            state.live.admin.question = payload;
        },
        setBlitzPlayerResults(state, payload) {
            state.live.blitz.responses+=1;
            if(payload=='correct answer'){
                state.live.blitz.correct+=1;
            }
        },
        clearLiveBlitzPlayerResponses(state) {
            state.live.blitz.responses=0;
            state.live.blitz.correct=0;
        },
        setBlitzPlayerCount(state) {
            state.live.blitz.playerCount += 1;
        },
        resetBlitzPlayerCount(state) {
            state.live.blitz.playerCount = 0;
        },
        setLiveScoreboard(state, payload) {
            state.live.scoreboard = payload;
        },
        setBlitzIndividualResult(state, payload) {
            state.live.blitz.myResult = payload;
        },
        addLivePlayerPlayerResponses(state, payload) {
            state.live.player.playersresponsed.push(payload);
            state.live.player.responses += 1;
        },
        setPlayerLiveBlitzMode(state, payload) {
            state.live.player.blitz = payload;
        },
        setBlitzQuestionWinner(state, payload) {
            state.live.blitz.questionwinner = payload;
        },
        setBlitzPlayerGameOver(state, payload) {
            state.live.blitz.gameOver = payload;
        },
        setPlayerLiveGameKey(state, payload) {
            state.live.player.gameKey = payload;
        },
        setPlayerLiveHost(state, payload) {
            state.live.player.host = payload;
        },
        setHostGameMode(state, payload) {
            state.admin.hostgames.mode = payload;
        },
        setPlayGameId(state, payload) {
            state.game.gameId = payload;
        },
        setUIMode(state, payload) {
            state.uimode = payload;
        },
        setLiveAdminLive(state, payload) {
            state.live.admin.live = payload;
        },
        setLiveAdminUIMode(state, payload) {
            state.live.admin.uimode = payload;
        },
        setLiveAdminQuestions(state, payload) {
            state.live.admin.questions = payload;
        },
        setLiveAdminQuizName(state, payload) {
            state.live.admin.quizName = payload;
        },
        setLiveAdminGameId(state, payload) {
            state.live.admin.gameId = payload;
        },
        setLiveAdminQuestionType(state, payload) {
            state.live.admin.questionType = payload;
        },
        setLiveAdminGameType(state, payload) {
            state.live.admin.gameType = payload;
        },
        setLiveAdminQuestionNumber(state, payload) {
            state.live.admin.questionnumber = payload;
        },
        addLiveAdminPlayer(state, payload) {
            for(let i=0; i < state.live.admin.players.length; i++){
                if(state.live.admin.players[i].playerName === payload)
                {
                    //player exists already
                    return;
                }
            }
            let userkey = {};
            userkey.playerName = payload;
            userkey.score = 0;
            userkey.answered='';
            let answers = new Array(state.live.admin.questions.length).fill(' ');
            userkey.answers = answers;
            state.live.admin.players.push(userkey);

        },
        addLiveAdminPlayerBlitz(state, payload) {
            for(let i=0; i < state.live.admin.players.length; i++){
                if(state.live.admin.players[i].playerName === payload)
                {
                    //player exists already
                    return;
                }
            }
            let userkey = {};
            userkey.playerName = payload;
            state.live.admin.players.push(userkey);
        },
        addLiveAdminPlayerAnswered(state, payload) {
            state.live.admin.players[payload.playerIndex].answers[payload.questionIndex]= payload.response;
            state.live.admin.players[payload.playerIndex].answered = 'Y';
        },
        resetLiveAdminPlayerAnsweredFlag(state, payload) {
            for(let i=0; i<state.live.admin.players.length; i++) {
                state.live.admin.players[i].answered = payload;
            }
        },
        setLiveAdminPlayersAnswered(state, payload) {
            state.live.admin.responses = payload;
        },
        setLiveAdminPlayerScore(state, payload) {
            state.live.admin.players[payload.playerIndex].score=payload.score;
            state.live.admin.players[payload.playerIndex].answered=payload.flag;
        },
        setLiveAdminPlayers(state, payload) {
            state.live.admin.players = payload;
        },
        setLivePlayerMode(state, payload) {
            state.live.player.live = payload;
        },
        setLivePlayerUIMode(state, payload) {
            state.live.player.uimode = payload;
        },
        setLivePlayerQuestion(state, payload) {
            state.live.player.question = payload;
        },
        setLivePlayerAnswer(state, payload) {
            state.live.player.answer = payload;
        },
        setLivePlayerAlternatives(state, payload) {
            state.live.player.alternatives = payload;
        },
        setLivePlayerFollowup(state, payload){
            state.live.player.answerFollowup = payload;
        },
        setLivePlayerScoreboard(state, payload) {
            state.live.player.scoreboard = payload;
        },
        setLivePlayerResponded(state, payload) {
            if(payload===0){
                state.live.player.playersresponded=[];
                state.live.player.playersresponded.length=0;
            } else {
                state.live.player.playersresponded.push(payload)
            }
        },
        setLivePlayerAnswerBoard(state, payload) {
            state.live.player.answerboard = payload;
        },
        setLivePlayerQuestionGroup(state, payload) {
            state.live.player.questiongroup = payload;
        },
        setLivePlayerGameId(state, payload) {
            state.live.player.gameid = payload;
        },
        setLivePlayerQuizName(state, payload) {
            state.live.player.quizName = payload;
        },
        setLivePlayerGameType(state, payload) {
            state.live.player.gametype = payload;
        },
        setLivePlayerScoreboardNote(state, payload) {
            state.live.player.scoreboardnote = payload;
        },
        addLivePlayerPlayerBlitz(state, payload) {
            for(let i=0; i < state.live.player.players.length; i++){
                if(state.live.player.players[i].playerName === payload)
                {
                    //player exists already
                    return;
                }
            }
            let userkey = {};
            userkey.playerName = payload;
            state.live.player.players.push(userkey);
        },

    },
    actions: {}
});