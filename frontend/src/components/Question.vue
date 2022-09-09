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
    <v-container>
        <div v-if="showquestion">
            <v-card>
                <v-card-title>Question #{{questionNumber+1}}</v-card-title>
                <v-card-subtitle>Quiz: {{quizname}}</v-card-subtitle>
                <v-card-title>
                        {{ questions[questionNumber].question }}
                </v-card-title>
                <v-card-text>
                    <div v-if="multiplechoice" align="center" justify="center">
                        <v-row>
                            <v-col v-if="multiplechoice" align="center" justify="center">
                                <v-row class="mb-1"><v-col cols="12">
                                <v-card v-if="questions[questionNumber].answerA != ''" outlined @click='answer(questionNumber, "A")' color="light-blue">
                                    <v-card-title class="black--text justify-center">{{ questions[questionNumber].answerA }}</v-card-title>
                                </v-card>
                                </v-col></v-row>
                                <v-row class="mb-1"><v-col cols="12">
                                <v-card v-if="questions[questionNumber].answerB != ''" outlined @click='answer(questionNumber, "B")' color="yellow">
                                    <v-card-title class="black--text justify-center">{{ questions[questionNumber].answerB }}</v-card-title>                
                                </v-card>
                                </v-col></v-row>
                                <v-row class="mb-1"><v-col cols="12">
                                <v-card v-if="questions[questionNumber].answerC != ''" outliined @click='answer(questionNumber, "C")' color="red">
                                    <v-card-title class="black--text justify-center">{{ questions[questionNumber].answerC }}</v-card-title>
                                </v-card>
                                </v-col></v-row>
                                <v-row class="mb-1"><v-col cols="12">
                                <v-card v-if="questions[questionNumber].answerD != ''" outlined @click='answer(questionNumber, "D")' color="green">
                                    <v-card-title class="black--text justify-center">{{ questions[questionNumber].answerD }}</v-card-title>
                                </v-card>
                                </v-col></v-row>
                            </v-col>
                        </v-row>
                    </div>
                    <div v-else align="center" justify="center">
                        <v-row>
                        <v-text-field label="Response" v-model='responsetext' placeholder='Response'/>
                        </v-row><v-row class="mb-10">
                        <v-btn x-large block class="white--text" color="#00FFFF" v-on:click='answeropen(questionNumber)'>Answer</v-btn>
                        </v-row>
                    </div>
                </v-card-text>
            </v-card>
        </div>
        <div v-else>
            <v-row class="headline" align="center" justify="center">
                <v-toolbar color="primary" class="headline black--text">
                    <v-toolbar-title>Answerboard</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-title>Quiz: {{quizname}}</v-toolbar-title> 
                </v-toolbar>
            </v-row>
            <v-row class="mb-6" align="center" justify="center">
           
<!--                 <v-data-table
                    :headers="boardheaders"
                    :items="answerboard"
                    item-key="questionNumber"
                    dense
                    sort-by="questionNumber"
                    no-data-text="No quiz data"
                    >
                    <template v-slot:item="props">
                        <tr>
                            <td>{{props.item.questionNumber}}</td>
                            <td>{{props.item.question}}</td>
                            <td>{{props.item.answer}}</td>
                            <td>{{props.item.playerResponse}}</td>
                            <td>{{props.item.answerFollowup}}</td>
                            <td>{{props.item.alternatives}}</td>
                        </tr>
                    </template>
                </v-data-table> -->
                    <v-table>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    Question #
                                </th>
                                <th class="text-left">
                                    Question
                                </th>
                                <th class="text-left">
                                    Correct Answer
                                </th>
                                <th class="text-left">
                                    Your Answer
                                </th>
                                <th class="text-left">
                                    Follow Up
                                </th>
                                <th class="text-left">
                                    Alternatives
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="answer in answerboard"
                                :key="answer.questionNumber"
                            >
                                <td>{{ answer.questionNumber }}</td>
                                <td>{{ answer.question }}</td>
                                <td>{{ answer.answer }}</td>
                                <td>{{ answer.playerResponse }}</td>
                                <td>{{ answer.answerFollowup }}</td>
                                <td>{{ answer.alternatives }}</td>
                            </tr>
                        </tbody>
                    </v-table>
            </v-row>
            <v-row v-if='showscoreboardbutton' class="mb-6">
                <v-btn x-large block class="white--text" color="#00FFFF" v-on:click='getscoreboard'>Show Scoreboard</v-btn>
            </v-row>
        </div>
    </v-container>
    </div>
</template>

<script>
import { defineComponent } from 'vue'
import { DataService } from '@/services/DataServices.js'
import { useGameStore } from '@/stores/game.js'

export default defineComponent({
    name: 'Question',
    props: {
        start: Boolean
    },
    mounted() {
    },
    computed: {
        availableQuestions: function() {
            const gameStore = useGameStore()
            return gameStore.game.numberofquestions },
        questions: function() { 
            const gameStore = useGameStore()
            return gameStore.game.questions },
        multiplechoice: function() { 
            const gameStore = useGameStore()
            return gameStore.game.questionType === 'Multiple Choice' },
        quizmode: function() {
            return 'Single Player'},
        quizname: function() { 
            const gameStore = useGameStore()
            return gameStore.game.quizName },
        gameid: function() { 
            const gameStore = useGameStore()
            return gameStore.game.gameId},
        username: function() { 
            const gameStore = useGameStore()
            return gameStore.user.username },
        myjwt: function() { 
            const gameStore = useGameStore()
            return gameStore.user.cognito.idToken.jwtToken }
    },

    data: function() { 
        return {
            questionNumber:0,
            responses:[],
            responsetext:'',
            showquestion: true,
            showanswerboard: false,
            answerboard: [],
            boardheaders: [{ text: 'Question #', align:'left', sortable:'false', value:'questionNumber'},
                    { text: 'Question', value: 'question'},
                    { text: 'Answer', value: 'correctAnswer'},
                    { text: 'Your Answer', value: 'playerResponse'},
                    { text: 'Info', value: 'answerFollowup'},
                    { text: 'Alternatives', value: 'alternatives'}],
            showscoreboardbutton: false
        }
    },
    methods: {
        answer: function(respondingquestion, response) {
            respondingquestion ++;
            this.responses.push({respondingquestion, response});
            if(this.questionNumber < (this.questions.length-1)) {
                this.questionNumber++;
            } else {
                this.showquestion = false;
                this.scorequiz();
            }
        },
        answeropen: function(respondingquestion) {
            respondingquestion ++;
            let response = this.responsetext;
            this.responses.push({respondingquestion, response});
            this.responsetext = '';
            if(this.questionNumber < (this.questions.length-1)) {
                this.questionNumber++;
            } else {
                this.showquestion = false;
                this.scorequiz();
            }
        },
        async getscore(parms) {
            parms.jwt = this.myjwt;
            let results = await DataService.scoreQuiz(parms);
            return results
        },

        async getscoreboarddata(parms) {
            parms.jwt = this.myjwt;
            let results = await DataService.getScoreboard(parms);
            return results;
        },

        async scorequiz() {
            let scoreQuiz = {responses: this.responses, gameId: this.gameid, 
                quizName: this.quizname, quizMode: this.quizmode, playerName: this.username};
            let response = await this.getscore(scoreQuiz); 
            let score = response.data.score*100;
            alert('You scored ' + score + '%');
            this.answerboard = response.data.answerboard;
            let scoredata = {jwt: this.myjwt, gameId: this.gameid, playerName:this.username, score:response.data.score};
            await DataService.saveScore(scoredata);
            this.showscoreboardbutton=true;
        },

        async getscoreboard() {
            const gameStore = useGameStore()
            let parms = {gameId: this.gameid};
            let response = await this.getscoreboarddata(parms)
            gameStore.system.unshift('Showing Scoreboard' + "\r\n")
            gameStore.scoreboard.players = response.data
            gameStore.gamemode = 'scoreboard'
            this.showquestion = true;
            this.showscoreboardbutton = false;
        }
    }
})
</script>

 