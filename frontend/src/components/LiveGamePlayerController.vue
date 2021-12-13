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
        <v-container v-if="mode==='lobby'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Waiting for Host to Start Game</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
            <v-row class="mb-6"></v-row>
        </v-container>
        <v-container v-if="mode==='getready'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Get Ready for the First Question!</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
            <v-data-table
            :headers="pregameheaders"
            :items="scoreboard"
            item-key="playerName"
            dense
            sort-by="score">
                <template v-slot:item="props">
                    <tr>
                        <td>{{props.item.playerName}}</td>
                        <td>{{props.item.score}}</td>
                    </tr>
                </template>
            </v-data-table>
            <v-row class="mb-6"></v-row>
         </v-container>
        <v-container v-if="mode==='question'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Question #: {{questionnumber}}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
            <v-row></v-row>
            <v-row class="headline">
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
                    <v-btn x-large block class="white--text" color="accent" v-on:click='answeropen(questionnumber)'>Answer</v-btn>
                </v-col>
                <v-row class="mb-6"></v-row>
            </span>
        </v-container>
        <span v-if="mode==='waiting'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Waiting for Other Players</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
                <v-data-table
                :headers="respondedheaders"
                :items="playersresponded"
                item-key="index"
                dense>
                    <template v-slot:item="props">
                        <tr>
                            <td>{{props.item}}</td>
                        </tr>
                    </template>
                </v-data-table>
                <v-row class="mb-6"></v-row>
        </span>
        <span v-if="mode==='scoreboard'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title v-if="scoreboardnote==='noquestionfinal'">Final Scoreboard</v-toolbar-title>
                <v-toolbar-title v-else>Scoreboard after Question {{questionnumber}} </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
            <span v-if="scoreboardnote!='noquestion' && scoreboardnote!='noquestionfinal'">
                <v-row class="headline">
                    <v-col cols="4"><pre class="headline">Question:</pre></v-col><v-col><pre style="white-space: pre-wrap;" class="headline">{{questiontext}}</pre></v-col>
                </v-row>
                <v-row class="headline" align="center" justify="center">
                    <v-col cols="4"><pre class="headline">Answer:</pre></v-col><v-col><pre class="headline">{{ correctanswer}}</pre></v-col>
                </v-row>
                <v-row v-if="hasalternatives">
                    <v-col cols="4"><pre class="headline">Alternatives:</pre></v-col><v-col><pre class="headline">{{ alternatives }}</pre></v-col>
                </v-row>
                <v-row v-if="hasfollowup">
                    <v-col cols="4"><pre class="headline">Further Info:</pre></v-col><v-col><pre class="headline">{{ answerFollowup }}</pre></v-col>
                </v-row>
            </span>
            <span v-if="scoreboardnote==='noquestionfinal'">
                <v-data-table
                :headers="scoreboardheaders"
                :items="scoreboard"
                dense
                :sort-by="['score']"
                :sort-desc="[true]">
                    <template v-slot:item="props">
                        <tr>
                            <td>{{props.item.playerName}}</td>
                            <td>{{props.item.score}}%</td>
                            <td>{{props.item.flag}}</td>
                        </tr>
                    </template> 
                </v-data-table>
            </span>
            <span v-else>
                <v-data-table
                :headers="scoreboardheaders"
                :items="scoreboard"
                :sort-by="['score']"
                :sort-desc="[true]"
                dense>
                    <template v-slot:item="props">
                        <tr>
                            <td>{{props.item.playerName}}</td>
                            <td>{{props.item.score}}</td>
                            <td>{{props.item.flag}}</td>
                        </tr>
                    </template> 
                </v-data-table>
            </span>
            <v-row class="mb-6"></v-row>
        </span>
        <span v-if="mode==='answerboard'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Answers for Round {{questiongroup}} </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
            <v-data-table
            :headers="answerboardheaders"
            :items="answerboard"
            dense
            :sort-by="['questionNumber']">
                <template v-slot:item="props">
                    <tr>
                        <td>{{props.item.questionNumber}}</td>
                        <td>{{props.item.question}}</td>
                        <td v-if="question.questionType==='Multiple Choice'">{{translate(props.item)}}</td>
                        <td v-else>{{props.item.correctAnswer}}</td>
                        <td>{{props.item.alternatives}}</td>
                        <td>{{props.item.answerFollowup}}</td>
                    </tr>
                </template>
            </v-data-table>
            <v-row class="mb-6"></v-row>
        </span>
        <span v-if="mode==='end'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>End of Game</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
            <v-row class="mb-6"></v-row>
        </span>
    </div>
</template>

<script>
export default {
    name: 'LiveGamePlayerController',
    computed: {
        mode: function() {return this.$store.state.live.player.uimode;},
        question: function() {return this.$store.state.live.player.question;},
        questiontext: function() { return this.$store.state.live.player.question.question },
        scoreboard: function() {return this.$store.state.live.player.scoreboard;},
        username: function() {return this.$store.state.user.username;},
        correctanswer: function() {return this.$store.state.live.player.answer; },
        alternatives: function() {if(this.hasalternatives) {return this.$store.state.live.player.alternatives;} return ''; },
        answerFollowup: function() { return this.$store.state.live.player.answerFollowup; },
        playersresponded: function() {return this.$store.state.live.player.playersresponded; },
        questiongroup: function() { return this.$store.state.live.player.questiongroup; },
        answerboard: function() { return this.$store.state.live.player.answerboard; },
        quizname: function() { return this.$store.state.live.player.quizname },
        gameid: function() { return this.$store.state.live.player.gameid },
        questionnumber: function() {return this.$store.state.live.player.question.questionNumber},
        scoreboardnote: function() {return this.$store.state.live.player.scoreboardnote},
        sortorder: function() {if(this.scoreboardnote==='noquestionfinal'){return false}return true;},
        liveGameHost: function() { return this.$store.state.live.player.host; },
        multiChoiceQuestionType: function() { if(Object.prototype.hasOwnProperty.call(this.question, 'answerA')){ return true;} return false; },
        hasalternatives: function() {
            if(typeof this.$store.state.live.player.alternatives==='undefined'){
                return false;}
            if(this.$store.state.live.player.alternatives.length>0){
                return true;}
            return false;
        },
        hasfollowup: function() {
            if(this.$store.state.live.player.answerFollowup==='' || this.$store.state.live.player.answerFollowup==='undefined'){
                return false;}
            return true;
        }
    },
    data: function() {return {
        responsetext:'',
        scoreboardheaders: [ { text: 'Player Name', align:'left', sortable:false, value:'Player Name'}, 
            { text: 'Score', value: 'Score', sortable:false },
            { text: 'Response(s)', value: 'flag', sortable:false}],
        respondedheaders: [ { text: 'Player Name', align:'left', sortable:false, value:'player'}],
        pregameheaders: [ { text: 'Player Name', align:'left', sortable:false, value:'Player Name'}, 
            { text: 'Score', value: 'Score' }],
        answerboardheaders: [ { text: 'Question #', align:'left', sortable:false, value:'questionNumber'},
            { text: 'Question', value: 'question', sortable:false},
            { text: 'Answer', value: 'correctAnswer', sortable:false},
            { text: 'Alternatives', value: 'alternatives', sortable:false},
            { text: 'Followup', value: 'answerFollowup', sortable:false}],
        sortdesc: true
    }},
    methods: {
        answer: function(answer) {
            let data = {playerName: this.username, gameId: this.gameid, hostname: this.liveGameHost,
                questionNumber: this.question.questionNumber, response: answer, subaction: 'answered'};
            let msg = {message: 'liveplayer', data: data};
            this.$store.commit('setLivePlayerUIMode', 'waiting');
            this.$emit('send-message', msg);
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
}
</script>