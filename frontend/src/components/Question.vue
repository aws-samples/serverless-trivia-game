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
        <span v-if="showquestion">
            <v-row class="headline" align="center" justify="center">
                <v-toolbar color="primary" class="headline black--text">
                    <v-toolbar-title>Question #: {{questionNumber+1}}</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-title>Quiz: {{quizname}}</v-toolbar-title> 
                </v-toolbar>
            </v-row><v-row>
                <pre style="white-space: pre-wrap;" class="headline">{{ questions[questionNumber].question }}</pre>
            </v-row>
            <span v-if="multiplechoice" align="center" justify="center">
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
            </span>
            <span v-else align="center" justify="center">
                <v-row>
                <v-text-field label="Response" v-model='responsetext' placeholder='Response'/>
                </v-row><v-row class="mb-10">
                <v-btn x-large block class="white--text" color="accent" v-on:click='answeropen(questionNumber)'>Answer</v-btn>
                </v-row>
            </span>
        </span>
        <span v-else>
            <v-row class="headline" align="center" justify="center">
                <v-toolbar color="primary" class="headline black--text">
                    <v-toolbar-title>Answerboard</v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-toolbar-title>Quiz: {{quizname}}</v-toolbar-title> 
                </v-toolbar>
            </v-row>
            <v-row align="center" justify="center">
                <v-data-table
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
                </v-data-table>
            </v-row>
            <v-row v-if='showscoreboardbutton' class="mb-10">
                <v-btn x-large block class="white--text" color="accent" v-on:click='getscoreboard'>Show Scoreboard</v-btn>
            </v-row>
        </span>
    </v-container>
    </div>
</template>

<script>
import DataService from '@/services/DataServices';

export default {
    name: 'Question',
    props: {
        start: Boolean
    },
    mounted() {
    },
    computed: {
        availableQuestions: function() { return this.$store.state.game.numberofquestions },
        questions: function() { return this.$store.state.game.questions },
        multiplechoice: function() { return this.$store.state.game.questionType === 'Multiple Choice' },
        quizmode: function() {return 'Single Player';},
        quizname: function() { return this.$store.state.game.quizName },
        gameid: function() { return this.$store.state.game.gameId},
        username: function() { return this.$store.state.user.username },
        myjwt: function() { return this.$store.state.user.cognito.idToken.jwtToken }
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
            let parms = {gameId: this.gameid};
            let response = await this.getscoreboarddata(parms)
            this.$store.commit('setSystemChat', 'Showing Scoreboard');
            this.$store.commit('setScoreboard', response.data);
            this.$store.commit('setGameState', 'scoreboard');
            this.showquestion = true;
            this.showscoreboardbutton = false;
        }
    }
}
</script>

 