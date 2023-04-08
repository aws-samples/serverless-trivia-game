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

import { defineStore } from 'pinia'

export const useGameStore = defineStore({
    id: 'gameStore',
    state: () => ({
        counter: 0,
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
        user: {
            username: '',
            picture: ''
        },
        profile: {
            location: '',
            realName: '',
            avatar: ''
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
            quiz: {
                gameInfo: undefined
            },
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
        cognito: {
            statustext: '',
            status: false,
            errortext: '',
            error: false, 
            authState: 'notLoggedIn'
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
    }),
    getters: {
        numberofquestions: () => {this.live.admin.questions.length}
    }
});