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
    <v-container>
        <span v-if="mode==='lobby'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Lobby</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizName}}</v-toolbar-title>
            </v-toolbar>
            <v-row><v-col cols="4"><pre class="headline"># of Questions:</pre></v-col><v-col><pre class="headline">{{numberOfQuestions}}</pre></v-col></v-row>            
            <v-row><v-col cols="4"><pre class="headline"># of Players:</pre></v-col><v-col><pre class="headline">{{numberOfPlayers}}</pre></v-col></v-row>            
            <v-btn x-large block color="#00FFFF" class="white--text" v-on:click="startGame">Start Game</v-btn>
            <v-row class="mb-6"></v-row>
        </span>
        <span v-if="mode==='game'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Running Game</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizName}}</v-toolbar-title>
            </v-toolbar> 
            <span class="mb-3" v-if="question!==''">
                <v-row><v-col cols="4"><pre class="headline"># of questions:</pre></v-col><v-col><pre class="headline">{{numberOfQuestions}}</pre></v-col></v-row>
                <v-row><v-col cols="4"><pre class="headline">Question #:</pre></v-col><v-col><pre style="white-space: pre-wrap;" class="headline">{{question.questionNumber}}</pre></v-col></v-row>
                <v-row><v-col cols="4"><pre class="headline">Question:</pre></v-col><v-col><pre style="white-space: pre-wrap;" class="headline">{{question.question}}</pre></v-col></v-row>
                <v-row><v-col cols="4"><pre class="headline">Answer:</pre></v-col><v-col><pre class="headline">{{correctAnswer}}</pre></v-col></v-row>
                <v-row><v-col cols="4"><pre class="headline">Question Winner:</pre></v-col><v-col><pre class="headline">{{questionWinner}}</pre></v-col></v-row>
                <span v-if="hasalternatives"><v-row><v-col cols="4"><pre class="headline">Alternatives:</pre></v-col><v-col><v-combobox chips multiple readonly v-model="question.alternatives"></v-combobox></v-col></v-row></span>
                <span v-if="hasfollowup"><v-row><v-col cols="4"><pre class="headline">Followup:</pre></v-col><v-col><pre class="headline">{{question.followup}}</pre></v-col></v-row></span>
                <v-row><v-col cols="4"><pre class="headline">Responses:</pre></v-col><v-col><pre class="headline">{{responses}}</pre></v-col></v-row>
            </span>
<!--             <v-data-table
            :headers="scoreboardheaders"
            :items="liveScoreboard"
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
            <v-row>
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
                                v-for="player in liveScoreboard"
                                :key="player.playerName"
                            >
                                <td>{{ player.playerName }}</td>
                                <td>{{ player.score }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-col>
            </v-row>
            <v-row class="mb-1" v-if="questionsRemaining"> 
                <v-btn x-large block color="#00FFFF" class="white--text" v-on:click='askQuestion'>Ask Question</v-btn>
            </v-row>
            <v-row class="mb-1" v-if="!questionsRemaining && !gameOver"> 
                <v-btn x-large block color="#00FFFF" class="white--text" v-on:click='sendGameOver'>Game Over</v-btn>
            </v-row>
            <v-row class="mb-1" v-if="gameOver"> 
                <v-btn x-large block color="#00FFFF" class="white--text" v-on:click='endGame'>End Game</v-btn>
            </v-row>
            <v-row class="mb-6"></v-row>
        </span>


    </v-container>
</template>

<script>
import { defineComponent } from 'vue'
import { useGameStore } from '@/stores/game.js'

export default defineComponent({
    name: 'BlitzGameAdmin',

    computed: {
        username: function() { 
            const gameStore = useGameStore()
            return gameStore.user.username },
        questionList: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.questions },
        quizName: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.quizName },
        gameId: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.gameId },
        gameType: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.gameType },
        questionType: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.questionType },
        liveAdminGameKey: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.gameKey },
        currentQuestion: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.question },
        numberOfQuestions: function() {
            const gameStore = useGameStore()
            return gameStore.live.admin.questions.length },
        liveScoreboard: function() { 
            const gameStore = useGameStore()
            return gameStore.live.scoreboard },
        numberOfPlayers: function() { 
            const gameStore = useGameStore()
            return gameStore.live.blitz.playerCount },
        correctAnswers: function() { 
            const gameStore = useGameStore()
            return gameStore.live.blitz.correct },
        responses: function() {
            const gameStore = useGameStore()
            return gameStore.live.blitz.responses },
        question: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.question; },
        hasalternatives: function() { 
            const gameStore = useGameStore()
            return 'alternatives' in gameStore.live.admin.question },
        hasfollowup: function() { 
            const gameStore = useGameStore()
            return 'answerFollowup' in gameStore.live.admin.question },
        cachedQuestionNumber: function() { 
            const gameStore = useGameStore()
            return gameStore.live.admin.questionnumber },
        questionWinner: function() { 
            const gameStore = useGameStore()
            return gameStore.live.blitz.questionwinner},
        correctAnswer: function() { 
            const gameStore = useGameStore()
            if(this.question.questionNumber===undefined){
                return '';
            }
            if('answerA' in gameStore.live.admin.question){
                switch(gameStore.live.admin.questions[this.question.questionNumber - 1].correctAnswer)
                {
                    case 'A':
                        return `A - ${this.question.answerA}`;
                    case 'B':
                        return `B - ${this.question.answerB}`;
                    case 'C':
                        return `C - ${this.question.answerC}`;
                    case 'D':
                        return `D - ${this.question.answerD}`;
                    default:
                        return '';                }
            } else {
                return gameStore.live.admin.questions[this.question.questionNumber - 1].correctAnswer; 
            }
        },
        questionsRemaining: function() {
            if(this.cachedQuestionNumber >= this.numberOfQuestions) {
                return false;
            }
            if(this.question.questionNumber===undefined || this.question.questionNumber < this.numberOfQuestions){
                return true;
            } else {
                return false;
            }
        },
        gameOver: function() { 
            const gameStore = useGameStore()
            return gameStore.live.blitz.gameOver }
    },

    data: function() { return {
        scoreboardheaders: [ { text: 'Player Name', align:'left', sortable:false, value:'playerName'}, 
            { text: 'Score', value: 'score', sortable:false}],
        mode: 'lobby'
        }
    },

    emits: ['send-iot-message'],

    methods: {
        async askQuestion() {
            const gameStore = useGameStore()
            gameStore.live.blitz.responses=0;
            gameStore.live.blitz.correct=0;
            const message = { playerName: this.username, gameId: this.gameId }
            this.$emit('send-iot-message', `games/${this.liveAdminGameKey}/nextquestion`, JSON.stringify(message));
        },
        endGame() {
            const gameStore = useGameStore()
            const message = { playerName: this.username, gameId: this.gameId, quizName: this.quizName };
            this.$emit('send-iot-message', `games/${this.liveAdminGameKey}/endthegame`, JSON.stringify(message));
            gameStore.admin.hostgames.mode = 'getlist'
            gameStore.live.admin.blitz = false
            gameStore.live.blitz.responses = 0
            gameStore.live.blitz.correct = 0
            gameStore.live.scoreboard = []
            gameStore.uimode = ''
            this.mode = 'lobby';
            gameStore.live.blitz.gameOver = false
        },
        startGame() {
            const gameStore = useGameStore()
            gameStore.live.blitz.gameOver = false
            const message = { playerName: this.username, gameId: this.gameId };
            this.$emit('send-iot-message', `games/${this.liveAdminGameKey}/startgame`, JSON.stringify(message));
            this.mode = 'game';
        },
        sendGameOver() {
            const gameStore = useGameStore()
            let message = { playerName: this.username, gameId: this.gameId };
            this.$emit('send-iot-message', `games/${this.liveAdminGameKey}/gameover`, JSON.stringify(message));
            gameStore.live.blitz.gameOver = true
        }
    }
})
</script>