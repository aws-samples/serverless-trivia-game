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
                <v-toolbar-title>Waiting for Game Host</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
            <v-row class="mb-6"></v-row>
        </span>
        <span v-if="mode==='question'">
            <v-row class="mb-6"></v-row>
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Question #: {{questionnumber}}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
            <v-row class="mb-6"></v-row>
            <v-row class="mb-3">
                <v-col cols="4"><pre class="headline">Question:</pre></v-col><v-col><pre style="white-space: pre-wrap;" class="headline">{{questiontext}}</pre></v-col>
            </v-row>
            <span v-if="multiChoiceQuestionType">
                <v-col align="center" justify="center">
                    <v-row class="mb-1"><v-col cols="12">
                    <v-card v-if="question.answerA != ''" outlined @click='answer("A")' color="light-blue" >
                    <v-card-title class="justify-center black--text">{{ question.answerA }}
                    </v-card-title>
                    </v-card>
                    </v-col></v-row>
                    <v-row class="mb-1"><v-col cols="12">
                    <v-card v-if="question.answerB != ''" outlined @click='answer("B")' color="yellow" >
                        <v-card-title class="justify-center black--text">{{ question.answerB }}
                        </v-card-title>                
                    </v-card>
                    </v-col></v-row>
                    <v-row class="mb-1"><v-col cols="12">
                    <v-card v-if="question.answerC != ''" outlined @click='answer("C")' color="red" >
                        <v-card-title class="justify-center black--text">{{ question.answerC }}
                        </v-card-title>
                    </v-card>
                    </v-col></v-row>
                    <v-row class="mb-1"><v-col cols="12">
                    <v-card v-if="question.answerD != ''" outlined @click='answer("D")' color="green" >
                        <v-card-title class="justify-center black--text">{{ question.answerD }}
                        </v-card-title>
                    </v-card>
                    </v-col></v-row>
                </v-col>
                <v-row class="mb-6"></v-row>
            </span>
            <span v-else>
                <v-col align="center" justify="center">
                    <v-text-field label="Response" v-model='responsetext' placeholder='Response'/>
                    <v-btn x-large block class="white--text" color="#00FFFF" v-on:click='answeropen(questionnumber)'>Answer</v-btn>
                </v-col>
                <v-row class="mb-6"></v-row>
            </span>
        </span>
        <span v-if="mode==='scoreboard' || mode==='gameover'">
            <v-toolbar color="primary" class="headline black--text mb-6">
                <v-toolbar-title>Current Scoreboard</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
                <span class="mb-6" v-if="mode==='scoreboard' && questiontext !== undefined">
                    <v-row class="mb-6">
                        <v-col cols="4"><pre class="headline">Result:</pre></v-col><v-col><pre style="white-space: pre-wrap;" class="headline">{{ myresultvalue }}</pre></v-col>}
                    </v-row>
                    <v-row class="headline">
                        <v-col cols="4"><pre class="headline">Question:</pre></v-col><v-col><pre style="white-space: pre-wrap;" class="headline">{{questiontext}}</pre></v-col>
                    </v-row>
                    <v-row class="headline" align="center" justify="center">
                        <v-col cols="4"><pre class="headline">Answer:</pre></v-col><v-col><pre class="headline">{{ correctanswer }}</pre></v-col>
                    </v-row>
                    <v-row v-if="hasalternatives">
                        <v-col cols="4"><pre class="headline">Alternatives:</pre></v-col><v-col><pre class="headline">{{ alternatives }}</pre></v-col>
                    </v-row>
                    <v-row v-if="hasfollowup">
                        <v-col cols="4"><pre class="headline">Further Info:</pre></v-col><v-col><pre class="headline">{{ answerFollowup }}</pre></v-col>
                    </v-row>
                    <v-row class="headline" align="center" justify="center">
                        <v-col cols="4"><pre class="headline">Question Winner:</pre></v-col><v-col><pre class="headline">{{ questionwinner }}</pre></v-col>
                    </v-row>
                </span>
                <span class="mb-6" v-if="mode==='gameover'">
                    <v-row class="mb-6">
                        <v-col cols="6"><pre class="headline">Game Over</pre></v-col>
                    </v-row>
                </span>
<!--                 <v-data-table
                :headers="scoreboardheaders"
                :items="scoreboard"
                dense
                :sort-by="['score']"
                :sort-desc="[true]">
                    <template v-slot:item="props">
                        <tr>
                            <td>{{props.item.playerName}}</td>
                            <td>{{props.item.score}}</td>
                        </tr>
                    </template> 
                </v-data-table> -->
                <v-row class="mb-6">
                    <v-col cols="3"></v-col><v-col cols="6">
                        <v-table>
                            <thead>
                                <tr>
                                    <th class="text-left">
                                        Player Name
                                    </th>
                                    <th class="text-left">
                                        Score
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="player in scoreboard"
                                    :key="player.playerName"
                                >
                                    <td>{{ player.playerName }}</td>
                                    <td>{{ player.score }}</td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-col>
                </v-row>
        </span>
    </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useGameStore } from '@/stores/game.js'

export default defineComponent({

    
    name: 'BlitzGamePlayer',
    computed: {
        mode: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.uimode},
        questiontext: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.question.question },
        scoreboard: function() {
            const gameStore = useGameStore()
            return gameStore.live.scoreboard},
        username: function() {
            const gameStore = useGameStore()
            return gameStore.user.username},
        myresult: function() { 
            const gameStore = useGameStore()
            return gameStore.live.blitz.myResult },
        correctanswer: function() {
            const gameStore = useGameStore()
            return this.myresult.correctAnswer },
        answerFollowup: function() { 
            const gameStore = useGameStore()
            return this.myresult.followUp },
        myresultvalue: function() { 
            const gameStore = useGameStore()
            return this.myresult.text },
        playersresponded: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.playersresponded },
        quizname: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.quizname },
        gameid: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.gameid },
        questionnumber: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.question.questionNumber},
        hasalternatives: function() {
            const gameStore = useGameStore()
            if(typeof gameStore.live.player.alternatives==='undefined'){
                return false}
            if(gameStore.live.player.alternatives.length>0){
                return true}
            return false
        },
        hasfollowup: function() {
            const gameStore = useGameStore()
            if(gameStore.live.player.answerFollowup==='' || gameStore.live.player.answerFollowup==='undefined'){
                return false}
            return true
        },
        liveGameKey: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.gameKey },
        liveGameHost: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.host },
        questionwinner: function() { 
            const gameStore = useGameStore()
            return gameStore.live.blitz.questionwinner },
        question: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.question },
        multiChoiceQuestionType: function() { 
            if(Object.prototype.hasOwnProperty.call(this.question, 'answerA')){ return true} return false },
        gameOver: function() { 
            const gameStore = useGameStore()
            return gameStore.blitz.gameOver }
    },
    emits: ['send-iot-message'],
    data: function() {return {
        responsetext:'',
        scoreboardheaders: [ { text: 'Player Name', align:'left', sortable:false, value:'playerName'}, 
            { text: 'Score', value: 'score', sortable:false }, ],
    }},
    methods: {
        answer: function(answer) {
            const gameStore = useGameStore()
            let topic = `games/${this.liveGameKey}/answers/${this.username}`;
            let msg = { gameId:  this.gameid, playerName: this.liveGameHost, 
                    questionNumber: this.question.questionNumber,
                    respondingPlayerName: this.username,
                    playerAnswer: answer};
            gameStore.live.player.uimode = 'scoreboard'
            this.$emit('send-iot-message', topic, JSON.stringify(msg));
        },
        answeropen: function() {
            if(this.responsetext===''){
                let response = window.confirm('You have not provided an answer.  Continue?');
                if(!response){
                    return;
                }
            }
            this.answer(this.responsetext);
            this.responsetext = '';
        },
        translate: function(question) {
            switch(question.correctAnswer) {
                case 'A':
                    return 'A - ' + question.answerA;
                case 'B':
                    return 'B - ' + question.answerB;
                case 'C':
                    return 'C - ' + question.answerC;
                case 'D':
                    return 'D - ' + question.answerD;
            }
        },

    }
})
</script>