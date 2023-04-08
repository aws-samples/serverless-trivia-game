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
<!--             <v-data-table
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
            <v-row class="mb-6"></v-row>
         </v-container>
        <v-container v-if="mode==='question'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Question #: {{questionnumber}}</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
            <v-row class="mb-6"></v-row>
            <v-row class="headline">
                <v-col cols="4"><pre class="headline">Question:</pre></v-col><v-col><pre style="white-space: pre-wrap;" class="headline">{{questiontext}}</pre></v-col>
            </v-row>
            <span v-if="multiChoiceQuestionType">
                <v-col align="center" justify="center">
                    <v-row class="mb-1"><v-col cols="12">
                    <v-card v-if="question.answerA != ''" outlined @click='answer("A")' color=answera >
                    <v-card-title class="justify-center black--text">{{ question.answerA }}
                    </v-card-title>
                    </v-card>
                    </v-col></v-row>
                    <v-row class="mb-1"><v-col cols="12">
                    <v-card v-if="question.answerB != ''" outlined @click='answer("B")' color=answerb >
                        <v-card-title class="justify-center black--text">{{ question.answerB }}
                        </v-card-title>                
                    </v-card>
                    </v-col></v-row>
                    <v-row class="mb-1"><v-col cols="12">
                    <v-card v-if="question.answerC != ''" outlined @click='answer("C")' color=answerc >
                        <v-card-title class="justify-center black--text">{{ question.answerC }}
                        </v-card-title>
                    </v-card>
                    </v-col></v-row>
                    <v-row class="mb-1"><v-col cols="12">
                    <v-card v-if="question.answerD != ''" outlined @click='answer("D")' color=answerd >
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
        </v-container>
        <span v-if="mode==='waiting'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Waiting for Other Players</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
<!--                 <v-data-table
                :headers="respondedheaders"
                :items="playersresponded"
                item-key="index"
                dense>
                    <template v-slot:item="props">
                        <tr>
                            <td>{{props.item}}</td>
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
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="player in playersresponded"
                                    :key="player.item"
                                >
                                    <td>{{ player.item }}</td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-col>
                </v-row>
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
                <v-row class="headline mb-6">
                    <v-col cols="4"><pre class="headline">Question:</pre></v-col><v-col><pre style="white-space: pre-wrap;" class="headline">{{questiontext}}</pre></v-col>
                </v-row>
                <v-row class="mb-6" align="center" justify="center">
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
<!--                 <v-data-table
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
                                    <th class="text-left">
                                        Responses
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
                                    <td>{{ player.flag }}</td>                                
                                </tr>
                            </tbody>
                        </v-table>
                    </v-col>
                </v-row>

            </span>
            <span v-else>
<!--                 <v-data-table
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
                                    <th class="text-left">
                                        Responses
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
                                    <td>{{ player.flag }}</td>                                
                                </tr>
                            </tbody>
                        </v-table>
                    </v-col>
                </v-row>
            </span>
            <v-row class="mb-6"></v-row>
        </span>
        <span v-if="mode==='answerboard'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Answers for Round {{questiongroup}} </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-toolbar-title>{{quizname}}</v-toolbar-title>
            </v-toolbar>
<!--             <v-data-table
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
            </v-data-table> -->
                <v-row>
                    <v-col cols="3"></v-col><v-col cols="6">
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
                                        Answer
                                    </th>
                                    <th class="text-left">
                                        Alternatives
                                    </th>
                                    <th class="text-left">
                                        Followup
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
                                    <td v-if="answer.questionType==='Multiple Choice'">{{translate(answer)}}</td>
                                    <td v-else>{{answer.correctAnswer}}</td>
                                    <td>{{ answer.flag }}</td>
                                    <td>{{ answer.answerFollowup }}</td>
                                </tr>
                            </tbody>
                        </v-table>
                    </v-col>
                </v-row>

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
import { defineComponent } from 'vue'
import { useGameStore } from '@/store/game.js'

export default defineComponent({
    name: 'live-game-player-controller',
    computed: {
        mode: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.uimode},
        question: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.question;},
        questiontext: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.question.question },
        scoreboard: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.scoreboard;},
        username: function() {
            const gameStore = useGameStore()
            return gameStore.user.username;},
        correctanswer: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.answer },
        alternatives: function() {
            const gameStore = useGameStore()
            if(this.hasalternatives) 
                {return gameStore.live.player.alternatives}
            return '' },
        answerFollowup: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.answerFollowup },
        playersresponded: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.playersresponded },
        questiongroup: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.questiongroup },
        answerboard: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.answerboard; },
        quizname: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.quizname },
        gameid: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.gameid },
        questionnumber: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.question.questionNumber},
        scoreboardnote: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.scoreboardnote},
        sortorder: function() {
            return this.scoreboardnote!=='noquestionfinal'},
        liveGameHost: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.host },
        multiChoiceQuestionType: function() { 
            if(Object.prototype.hasOwnProperty.call(this.question, 'answerA')){ return true} return false },
        hasalternatives: function() {
            const gameStore = useGameStore()
            if(typeof gameStore.live.player.alternatives==='undefined'){
                return false;}
            if(gameStore.live.player.alternatives.length>0){
                return true;}
            return false;
        },
        hasfollowup: function() {
            const gameStore = useGameStore()
            if(gameStore.live.player.answerFollowup==='' || gameStore.live.player.answerFollowup==='undefined'){
                return false;}
            return true;
        }
    },
    emits: ['send-message'],
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
            const gameStore = useGameStore()
            let data = {playerName: this.username, gameId: this.gameid, hostname: this.liveGameHost,
                questionNumber: this.question.questionNumber, response: answer, subaction: 'answered'};
            let msg = {message: 'liveplayer', data: data};
            gameStore.live.player.uimode = 'waiting'
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
})
</script>