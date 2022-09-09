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

<template>
    <div>
        <span v-if="mode==='lobby'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Lobby</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
            <v-row><v-col cols="4"><pre class="headline"># of questions:</pre></v-col><v-col><pre class="headline">{{questions}}</pre></v-col></v-row>            
<!--             <v-data-table
            :headers="lobbyheaders"
            :items="players"
            no-data-text="no players have joined yet">
                <template v-slot:item="props">
                    <tr>
                        <td>{{props.item.playerName}}</td>
                    </tr>
                </template>
            </v-data-table> -->
            <v-row>
                <v-table>
                    <thead>
                        <tr>
                            <th class="text-left">
                                Player Name
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="player in players"
                            :key="player.playerName"
                        >
                            <td>{{ player.playerName }}</td>
                        </tr>
                    </tbody>
                </v-table>
            </v-row>
            <v-btn x-large block color="#00FFFF" class="white--text" v-on:click="startgame">Start Game</v-btn>
            <v-row class="mb-6"></v-row>
        </span>
        <span v-if="mode==='game'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Running Game</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar> 
            <span v-if="question!=''" class="mb-3">
                <v-row><v-col cols="4"><pre class="headline"># of questions:</pre></v-col><v-col><pre class="headline">{{questions}}</pre></v-col></v-row>
                <v-row><v-col cols="4"><pre class="headline">Question #:</pre></v-col><v-col><pre style="white-space: pre-wrap;" class="headline">{{questionnumber}}</pre></v-col></v-row>
                <v-row><v-col cols="4"><pre class="headline">Question:</pre></v-col><v-col><pre style="white-space: pre-wrap;" class="headline">{{question}}</pre></v-col></v-row>
                <v-row><v-col cols="4"><pre class="headline">Answer:</pre></v-col><v-col><pre class="headline">{{correctanswer}}</pre></v-col></v-row>
                <span v-if="hasalternatives"><v-row><v-col cols="4"><pre class="headline">Alternatives:</pre></v-col><v-col><v-combobox chips multiple readonly v-model="alts"></v-combobox></v-col></v-row></span>
                <span v-if="hasfollowup"><v-row><v-col cols="4"><pre class="headline">Followup:</pre></v-col><v-col><pre class="headline">{{followup}}</pre></v-col></v-row></span>
                <v-row><v-col cols="4"><pre class="headline">Responses:</pre></v-col><v-col><pre class="headline">{{responses}}</pre></v-col></v-row>
            </span>
<!--             <v-data-table
            :headers="scoreboardheaders"
            :items="players"
            dense
            :sort-by="['score']"
            :sort-desc="[true]">
                <template v-slot:item="props">
                    <tr>
                        <td>{{props.item.playerName}}</td>
                        <td>{{props.item.score}}{{addpercent}}</td>
                        <td>{{props.item.answers[holdindex]}}</td>
                        <td>{{props.item.answered}}</td>
                    </tr>
                </template>
            </v-data-table> -->
            <v-row>
                <v-col cols=3></v-col><v-col cols="6">
                    <v-table>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    Player Name
                                </th>
                                <th class="text-left">
                                    Score
                                </th>
                                <th class="text-left">
                                    Answer
                                </th>
                                <th class="text-left">
                                    Eval
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="player in players"
                                :key="player.playerName"
                            >
                                <td>{{ player.playerName }}</td>
                                <td>{{ player.score }}{{ addpercent }}</td>
                                <td>{{ player.answers[holdindex ]}}</td>
                                <td>{{ players.answered }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-col>
            </v-row>
            <v-btn x-large block color="#00FFFF" class="white--text" v-on:click="processstep">{{step}}</v-btn>
            <v-row class="mb-6"></v-row>
        </span>
    </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useGameStore } from '@/stores/game.js'

export default defineComponent({
    name: 'LiveGameAdminController',
    computed: {
        questionlist: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.questions },
        quizname: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.quizName },
        gametype: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.gameType },
        questiontype: function() {
            const gameStore = useGameStore()
            return gameStore.live.admin.questionType },
        gameid: function() {
            const gameStore = useGameStore()
            return gameStore.live.admin.gameId },
        mode: function() {
            const gameStore = useGameStore()
            return gameStore.live.admin.uimode },
        players: function() {
            const gameStore = useGameStore()
            return gameStore.live.admin.players },
        questions: function() {
            const gameStore = useGameStore()
            return this.questionlist.length },
        playeranswered: function() {
            const gameStore = useGameStore()
            return gameStore.live.admin.playeranswered },
        responses: function() {
            const gameStore = useGameStore()
            return gameStore.live.admin.responses },
        questionnumber: function() {
            const gameStore = useGameStore()
            return gameStore.live.admin.questionnumber },
        questionnumberindex: function() {
            const gameStore = useGameStore()
            return gameStore.live.admin.questionnumber-1 },
        nextquestion: function() {
            const gameStore = useGameStore()
            if(this.questionnumber <= this.questions) {
                return gameStore.live.admin.questions[this.questionnumberindex]
            } 
            return ''
        },
        currentquestion: function() {
            const gameStore = useGameStore()
            if(this.questionnumber <= this.questions) {
                return gameStore.live.admin.questions[this.questionnumberindex]
            } 
            return ''
        },
        questiongroup: function() {
            const gameStore = useGameStore()
            if(this.questionnumber <= this.questions) {
                return gameStore.live.admin.questions[this.questionnumberindex].questionGroup
            } 
            return ''
        },
        hasalternatives: function() {
            const gameStore = useGameStore()
            if(this.questionnumber <= this.questions) {
                return 'alternatives' in gameStore.live.admin.questions[this.questionnumberindex]
            }
            return false
        },
        alternatives: function() {
            const gameStore = useGameStore()
            if(this.questionnumber <= this.questions && this.hasalternatives) {
                return gameStore.live.admin.questions[this.questionnumberindex].alternatives
            } 
            return []
        },
        hasfollowup: function() {
            const gameStore = useGameStore()
            if(this.questionnumber <= this.questions)  {
                return 'answerFollowup' in gameStore.live.admin.questions[this.questionnumberindex]
            }
            return false
        },
        answerfollowup: function() {
            const gameStore = useGameStore()
            if(this.questionnumber <= this.questions && this.hasfollowup) {
                return gameStore.live.admin.questions[this.questionnumberindex].answerFollowup
            }
            return ''
        },        
        username: function() { 
            const gameStore = useGameStore()
            return gameStore.user.username; },
        addpercent: function() {if(this.stepmode==='final'){return '%'}return ''}
    },
    data: function() { return {
        step:'',
        stepmoode:'',
        scoreboard: {},
        playerdetails: {},
        scoresemaphore: false,
        lobbyheaders: [ { text: 'Player Name', align:'left', sortable:false, value:'Player Name'} ],
        scoreboardheaders: [ { text: 'Player Name', align:'left', sortable:false, value:'Player Name'}, 
            { text: 'Score', value: 'score', sortable:false}, { text: 'Answer', value: 'answer', sortable:false}, { text: 'Eval', value: 'flag', sortable:false}],
        correctanswer: '',
        question:'',
        followup:'',
        alts:'',
        holdindex:0,
        currentgroup:0,
        currentgroupstart:0,
        priorstep:'',
        groupquestions:[]
    }},
    emits: ['send-message'],
    methods: {
        startgame: function() {
            const gameStore = useGameStore()
            //setup player details
            this.players.forEach(player => {
                this.playerdetails.username = player;
                this.playerdetails.score = 0;
                this.playerdetails.responses=[];
            })
            //trigger mode for game
            gameStore.live.admin.uimode = 'game'
            gameStore.live.admin.questionnumber = 1
            this.step = 'Ask Question ' + String(this.questionnumber);
            this.stepmode = 'ask';
            this.groupquestions=[];
            let scoreboard = this.buildscoreboard(this.groupquestions);
            let msg = { message: 'liveadmin', data: {
                subaction: 'startgame', quizName: this.quizname, gameId: this.gameid,
                scoreboard: scoreboard.data.scoreboard, playerName: this.username
            }};
            if(this.gametype==='Multiplayer - Competitive') {
                this.currentgroup = 1;
                this.currentgroupstart = this.questionnumber;
            }
            this.$emit('send-message', JSON.stringify(msg));
        },
        
        processstep: function() {
            let msg = {message: 'liveadmin'};
            let data = {};
            let buildquestions = [];
            switch(this.gametype) {
                case 'Multiplayer - Casual':
                    switch(this.stepmode) { 
                        case 'ask':
                            //build question
                            msg.data=this.buildquestion(this.questionnumberindex, false);
                            msg.data.subaction='question';
                            msg.data.playerName = this.username;
                            //change the text for the button and set new mode
                            this.step = 'Show Scoreboard';
                            this.stepmode = 'scoreboard';
                            this.groupquestions = [];
                            break;
                        case 'scoreboard':
                            if(!this.scoresemaphore & this.checkresponses()) {
                                this.scoresemaphore = true;
                                this.updatescoreboard(this.questionnumberindex);
                                this.groupquestions.push(this.questionnumberindex);
                                //build scoreboard
                                msg = this.buildscoreboard(this.groupquestions);
                                this.groupquestions=[];
                                this.advancequestionnumber();
                                if(this.questionnumber<=this.questions) {
                                    this.step = 'Ask Question ' + String(this.questionnumber);
                                    this.stepmode = 'ask';
                                } else {
                                    //game over
                                    this.step = 'Show Final Scoreboard';
                                    this.stepmode='final';
                                }
                                this.scoresemaphore = false;
                            } else {
                                return;
                            }
                            break;
                        case 'final':
                            msg.data = this.finalscoreboard();
                            break;
                        case 'end':
                            data = { subaction: 'reset', gameId: this.gameid, playerName: this.username };
                            msg.data = data
                            this.reset();
                            break;
                        default:
                            console.log('lost in steps');
                    }
                    this.$emit('send-message', JSON.stringify(msg));
                    break;
                case 'Multiplayer - Competitive':
                    switch(this.stepmode) {
                        case 'ask':
                            if(this.priorstep === 'ask') {
                                if(this.checkresponses()) {
                                    this.updatescoreboard(this.questionnumberindex);   
                                    this.advancequestionnumber();
                                } else {
                                    //not ready to move on
                                    return;
                                }
                            }
                            msg.data = this.buildquestion(this.questionnumberindex, false);
                            msg.data.subaction='question';
                            msg.data.playerName=this.username;
                            if(this.questionnumber < this.questions && this.questionlist[this.questionnumber].questionGroup===this.currentgroup) {
                                //next step = question
                                this.step = 'Ask Question ' + String(this.questionnumber + 1);
                                this.stepmode = 'ask';
                                this.priorstep = 'ask';
                            } else {
                                //next step = scorebard
                                this.step = 'Show Answers';
                                this.stepmode = 'answerboard';
                                this.priorstep = '';
                            }
                            break;
                        case 'answerboard':
                            if(this.checkresponses()) {
                                this.step="Show Scoreboard";
                                this.stepmode = 'scoreboard';
                                //need all the questions for this questiongroup
                                var i = this.currentgroupstart - 1;
                                while(i<(this.questions) && this.questionlist[i].questionGroup === this.currentgroup) {
                                    buildquestions.push(this.buildquestion(i, true));
                                    this.groupquestions.push(i);
                                    i++;
                                }
                                let data = {subaction: 'answerboard', gameId: this.gameid, 
                                    questiongroup: this.currentgroup, questions: buildquestions};
                                msg.data = data;
                            }
                            break;
                        case 'scoreboard':
                            if(!this.scoresemaphore) {
                                this.scoresemaphore = true;
                                this.updatescoreboard(this.questionnumberindex);
                                //build scoreboard
                                msg = this.buildscoreboard(this.groupquestions);
                                this.groupquestions=[];
                                this.advancequestionnumber();
                                if(this.questionnumber<=this.questions) {
                                    this.currentgroup = this.questionlist[this.questionnumberindex].questionGroup;
                                    this.currentgroupstart = this.questionnumber;
                                    this.step = 'Ask Question ' + String(this.questionnumber);
                                    this.stepmode = 'ask';
                                } else {
                                    //game over
                                    this.step = 'Show Final Scoreboard';
                                    this.stepmode='final';
                                }

                                this.scoresemaphore = false;
                            } else {
                                return;
                            }
                            break;
                        case 'final':
                            msg.data = this.finalscoreboard();
                            break;
                        case 'end':
                            data = {subaction: 'reset', gameId: this.gameid, playerName: this.username};
                            msg.data = data;
                            this.reset();
                            break;
                        default:
                            console.log('lost in steps');
                    }
                    this.$emit('send-message', JSON.stringify(msg));
                    break;
            }
        },

        checkresponses: function() {
            let response;
            if(this.responses < this.players.length) {
                response = window.confirm('Not all players have answered.  Continue?');
            } else {
                response = true;
            }
            return(response);
        },

        advancequestionnumber: function() {
            const gameStore = useGameStore()
            gameStore.live.admin.questionnumber = this.questionnumber + 1
        },

        buildquestion: function(index, includeanswer) {
            const gameStore = useGameStore()
            if(index>this.questions-1) {
                return ''
            }
            //update JSON for players
            let data=JSON.parse(JSON.stringify(this.questionlist[index]));
            if(!includeanswer) {
                delete data.correctAnswer;
                delete data.alternatives;
                delete data.answerFollowup;
            } else {
                if(data.questionType==='Open Answer') {
                    let strtemp = data.alternatives.join(',');
                    delete data.alternatives;
                    data.alternatives = strtemp;
                }
                if(this.questiontype==='Multiple Choice') {
                    switch(this.questionlist[index].correctAnswer) {
                        case 'A':
                            data.correctAnswer = this.questionlist[index].correctAnswer + ' - ' + this.questionlist[index].answerA;
                            break;
                        case 'B':
                            data.correctAnswer = this.questionlist[index].correctAnswer + ' - ' + this.questionlist[index].answerB;
                            break;
                        case 'C':
                            data.correctAnswer = this.questionlist[index].correctAnswer + ' - ' + this.questionlist[index].answerC;
                            break;
                        case 'D':
                            data.correctAnswer = this.questionlist[index].correctAnswer + ' - ' + this.questionlist[index].answerD;
                            break;
                    }
                }
            }
            //reset playsersanswered and update UI components for Admin
            for(let i=0; i<gameStore.live.admin.players.length; i++) {
                gameStore.live.admin.players[i].answered = '';
            }
            gameStore.live.admin.responses = 0            
            this.question = this.questionlist[index].question;
            if(this.questiontype==='Multiple Choice') {
                switch(this.questionlist[index].correctAnswer) {
                    case 'A':
                        this.correctanswer = this.questionlist[index].correctAnswer + ' - ' + this.questionlist[index].answerA;
                        break;
                    case 'B':
                        this.correctanswer = this.questionlist[index].correctAnswer + ' - ' + this.questionlist[index].answerB;
                        break;
                    case 'C':
                        this.correctanswer = this.questionlist[index].correctAnswer + ' - ' + this.questionlist[index].answerC;
                        break;
                    case 'D':
                        this.correctanswer = this.questionlist[index].correctAnswer + ' - ' + this.questionlist[index].answerD;
                        break;
                }
            } else {
                this.correctanswer = this.questionlist[index].correctAnswer;
            }
            this.alts = this.alternatives;
            this.followup = this.answerfollowup;
            this.holdindex = index;
            return data;
        },

        finalscoreboard: function() {
            //trivia night, review question + answer
            //live trivia, show final scoreboard
            //find winnners
            const gameStore = useGameStore()
            let i;
            let maxscore = 0;
            let winners = [];
            for(i=0;i<this.players.length;i++){
                if(this.players[i].score>maxscore){
                    maxscore = this.players[i].score;
                    winners = [];
                    winners.push(i);
                }
                if(this.players[i].score===maxscore){
                    //add player to current array
                    winners.push(i);
                }
            }
            //send out xp messages
            for(i=0;i<this.players.length;i++){
                let xpmessage = {};
                xpmessage.message = 'liveadmin';
                let wins;
                if(winners.includes(i)){
                    wins = 1;
                } else {
                    wins = 0;
                }
                xpmessage.data = {subaction: 'progress', playerName: this.username, progress: {
                    playerid: this.players[i].playerName, experience: this.players[i].score,
                    wins: wins, owner: this.username}};
                this.$emit('send-message', JSON.stringify(xpmessage));
            }
            //convert score to a percentage
            let scoreboardData = [];
            for(i=0;i<this.players.length;i++) {
                let msg = {};
                gameStore.live.admin.players[i].score=((this.players[i].score / this.questions) * 100).toFixed(2)
                gameStore.live.admin.players[i].answered=''
                //now update locally for display to everyone
                let scoreboardmsg = {};
                scoreboardmsg.message = 'liveadmin';
                scoreboardmsg.data = {};
                scoreboardmsg.data.playerName = this.username;
                scoreboardmsg.data.subaction = 'scoreboardupdate';
                scoreboardmsg.data.item = {};
                scoreboardmsg.data.item.gameId = this.gameid;
                scoreboardmsg.data.item.playerName = this.players[i].playerName;
                scoreboardmsg.data.item.quizName = this.quizname;
                scoreboardmsg.data.item.score = gameStore.live.admin.players[i].score;
                this.$emit('send-message', JSON.stringify(scoreboardmsg));
            }
            this.stepmode='end';
            //save to table
            this.step='End Quiz';
            let data = {};
            data.subaction='scoreboard';
            data.gameId=this.gameid; 
            data.gametype=this.gametype;
            data.playerName=this.username;
            data.note='noquestionfinal';
            this.players.forEach(player => {
                let playerData = {};
                playerData.playerName = player.playerName;
                playerData.score = player.score;
                scoreboardData.push(playerData);
            })
            data.scoreboard = scoreboardData;
            this.holdindex = -1;
            return(data);
        },

        dateString: function() {
            const date = new Date();
            const dateStr = `${(`00${date.getMonth() + 1}`).slice(-2)}/${
                (`00${date.getDate()}`).slice(-2)}/${
                date.getFullYear()} ${
                (`00${date.getHours()}`).slice(-2)}:${
                (`00${date.getMinutes()}`).slice(-2)}:${
                (`00${date.getSeconds()}`).slice(-2)}`;

            return dateStr;
        },


        updatescoreboard: function(index) {
            //need the array position
            const gameStore = useGameStore()
            let comparequestion = this.questionlist[index];
            let alternativefound;
            for(let i=0;i<this.players.length;i++){
                let msg = {};
                let correctResponse = '';
                alternativefound = false;
                msg.playerAnswer = this.players[i].answers[index];
                if(comparequestion.correctAnswer.toLowerCase()===this.players[i].answers[index].toLowerCase()) {
                    msg.score = this.players[i].score + 1;
                    msg.playerIndex = i;
                    msg.flag = 'Correct';
                    
                } else {
                    if(this.hasalternatives) {
                        for(let j=0; j<comparequestion.alternatives.length; j++) {
                            if(comparequestion.alternatives[j].toLowerCase()===this.players[i].answers[index].toLowerCase()) {
                                msg.score = this.players[i].score + 1;
                                msg.playerIndex = i;
                                msg.flag = 'Correct';
                                correctResponse = comparequestion.alternatives[j];
                                alternativefound = true;
                                break;
                            }
                        }
                    }
                    if(!alternativefound) {
                        msg.playerIndex = i;
                        msg.score = this.players[i].score;
                        msg.flag = 'Incorrect';
                    }
                }
                if(correctResponse===''){
                    correctResponse = comparequestion.correctAnswer;
                }
                let questions = [{questionNumber: index+1, 
                    playerResponse: this.players[i].answers[index], correctResponse: correctResponse }];
                let analytics = { playerName:this.players[i].playerName, gameId: this.gameid, 
                    quizMode: this.gametype, dateOfGame: this.dateString(), questions: questions};
                let analyticsmessage = {message: 'liveadmin', data: {playerName: this.username, subaction:'analytics', analytics : analytics}};
                this.$emit('send-message', JSON.stringify(analyticsmessage));
                gameStore.live.admin.players[msg.playerIndex].score=msg.score;
                gameStore.live.admin.players[msg.playerIndex].answered=msg.flag;
            }
        },

        buildscoreboard: function(questions) {
            let msg = {};
            msg.message = 'liveadmin';
            msg.data = {};
            let scoreboardData = [];
            msg.data.subaction='scoreboard';
            msg.data.gametype=this.gametype;
            if(this.gametype==='Multiplayer - Competitive') {
                msg.data.note = 'noquestion';
            } else {
                msg.data.note = 'question';
            }
            msg.data.playerName=this.username;
            msg.data.gameId=this.gameid; 
            this.players.forEach(player => {
                let playerData = {}
                playerData.playerName = player.playerName;
                playerData.score = player.score;
                playerData.flag = '';
                if(questions.length > 0) {
                    questions.forEach(question=> {
                        if(playerData.flag!=''){
                            playerData.flag = playerData.flag + ", ";
                        }
                        playerData.flag = playerData.flag + player.answers[question];
                    })
                } else {
                    playerData.flag = '';
                }
                scoreboardData.push(playerData);
            })
            msg.data.question=this.questionlist[this.questionnumberindex].question;
            msg.data.scoreboard = scoreboardData;
            if(this.questiontype==='Multiple Choice') {
                switch(this.questionlist[this.questionnumberindex].correctAnswer) {
                    case 'A':
                        msg.data.correctAnswer = this.questionlist[this.questionnumberindex].correctAnswer + ' - ' + this.questionlist[this.questionnumberindex].answerA;
                        break;
                    case 'B':
                        msg.data.correctAnswer = this.questionlist[this.questionnumberindex].correctAnswer + ' - ' + this.questionlist[this.questionnumberindex].answerB;
                        break;
                    case 'C':
                        msg.data.correctAnswer = this.questionlist[this.questionnumberindex].correctAnswer + ' - ' + this.questionlist[this.questionnumberindex].answerC;
                        break;
                    case 'D':
                        msg.data.correctAnswer = this.questionlist[this.questionnumberindex].correctAnswer + ' - ' + this.questionlist[this.questionnumberindex].answerD;
                        break;
                }
            } else {
                msg.data.correctAnswer = this.questionlist[this.questionnumberindex].correctAnswer;
                if(this.hasalternatives){
                    msg.data.alternativeAnswers = this.questionlist[this.questionnumberindex].alternatives.join(',');
                }
            }
            msg.data.answerFollowup = this.questionlist[this.questionnumberindex].answerFollowup;
            msg.data.questionNumber = this.questionnumber;
            return(msg);
        },

        reset: function() {
            const gameStore = useGameStore()
            gameStore.admin.hostgames.mode = 'getlist'
            gameStore.live.admin.live = false
            gameStore.live.admin.uimode = ''
            gameStore.live.admin.questions = []
            gameStore.live.admin.quizName = ''
            gameStore.live.admin.gameId = ''
            gameStore.live.admin.questionType = ''
            gameStore.live.admin.gameType = ''
            gameStore.live.admin.responses = 0
            gameStore.live.admin.players = []
            gameStore.uimode = 'home'
        }
    }
})
</script>