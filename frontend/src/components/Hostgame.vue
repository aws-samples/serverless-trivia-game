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
        <span v-if="getMode==='showlist'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Select a game to host</v-toolbar-title>
                <v-spacer></v-spacer>
                
            </v-toolbar>            
            <v-card>
                <v-card-title>Game Listing<v-spacer></v-spacer>
                    <v-text-field
                        v-model="search"
                        append-icon="mdi-magnify"
                        label="Search"
                        single-line
                        hide-details
                    ></v-text-field>
                </v-card-title>
                <v-row align="center" justify="center">
                    <v-data-table
                        :headers="gameheaders"
                        :items="gamelist"
                        item-key="gameId"
                        dense
                        sort-by="quizName"
                        no-data-text="You don't have any games yet"
                        :search="search"
                        >
                        <template v-slot:item="props">
                            <tr @click="hostGame(props.item)">
                                <td>{{props.item.quizName}}</td>
                                <td>{{props.item.quizDescription}}</td>
                                <td>{{props.item.quizMode}}</td>
                                <td>{{props.item.questionType}}</td>
                            </tr>
                        </template>
                    </v-data-table>
                </v-row>
            </v-card>
            <v-btn x-large block color="accent" class="white--text" v-on:click="closelist">Close List</v-btn>
        </span>
    </div>
</template>

<script>
import DataService from '@/services/DataServices';

export default {
    name: 'Hostgame',
    data: function() { return {
        quizName: '',
        quizCode: '',
        gameheaders: [{ text: 'Quiz Name', align:'left', sortable:'false', value:'quizName'},
                    { text: 'Description', value: 'quizDescription'},
                    { text: 'Quiz Mode', value: 'quizMode'},
                    { text: 'Question Type', value: 'questionType'}],
        playerheaders: [{ text: 'Player Name', align:'left', sortable:'false', value:'Player Name'}],
        question: 0,
        gameid:'',
        search:'',
    }},
    methods: {
        async hostGame(game) {
            if(game.quizMode==='Single Player'){
                let message = {playerName: this.username, quizName: game.quizName, gameId: game.gameId, 
                    questionType: game.questionType, quizMode: game.quizMode, quizDescription: game.quizDescription,
                    starttime: String(new Date())};
                let response = await this.host(message);
                if(response.data.gameId === game.gameId) {
                    alert('Game ' + game.quizName + ' is now being run');
                }
            } else if(game.quizMode.includes('Casual')||game.quizMode.includes('Competitive')){
                let message = {message: 'liveadmin', data: {
                    subaction: 'hostgame', playerName: this.username, quizName: game.quizName, 
                    gameId: game.gameId, questionType: game.questionType, quizMode: game.quizMode, 
                    starttime: String(new Date()), channel: 'globalchat'
                }};
                this.$emit('send-message', JSON.stringify(message));
                let results = await DataService.getFullGame({gameId: game.gameId, playerName: this.username, jwt: this.myjwt});
                this.$store.commit('setHostGameMode', 'getlist');
                this.$store.commit('setLiveAdminLive', true);
                this.$store.commit('setLiveAdminUIMode', 'lobby');
                this.$store.commit('setLiveAdminQuestions', results.data.questions);
                this.$store.commit('setLiveAdminQuizName', results.data.quizName);
                this.$store.commit('setLiveAdminGameId', results.data.gameId);
                this.$store.commit('setLiveAdminGameType', results.data.quizMode);
                this.$store.commit('setLiveAdminQuestionType', results.data.questionType);
            } else {
                this.$store.commit('setBlitzPlayerGameOver', false);
                this.$store.commit('setAdminLiveGameKey', `${game.gameId}:${this.username}`);
                this.$store.commit('setAdminLiveBlitzQuestion', '');
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/questionlist`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/question`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/joined/+`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/answer/+`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/answers/+`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/results/+`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/scoreboard`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/playercorrect`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/endgame`);
                let message = { playerName: this.username, quizName: game.quizName, 
                    gameId: game.gameId, questionType: game.questionType, 
                    quizMode: game.quizMode, starttime: `${String(new Date())}`};
                this.$emit('send-iot-message', 'hostgame', JSON.stringify(message));
                this.$store.commit('setAdminLiveBlitzMode', true);
                this.$store.commit('setLiveAdminUIMode', 'lobby');
            }
        },
        async host(parms){
            parms.jwt = this.myjwt;
            return DataService.hostGame(parms);
        },
        closelist: function() {
            this.$store.commit('setHostGameMode', 'getlist');
            this.$store.commit('setUIMode', 'home');
        },
    },
    computed: {
        getMode: function() {return this.$store.state.admin.hostgames.mode;},
        gamelist: function() {return this.$store.state.admin.hostgames.gamelist;},
        username: function() {return this.$store.state.user.username;},
        gethostbutton: function() {if(this.question==0){return "Start Quiz";} else {return "Next Question";}},
        myjwt: function() { return this.$store.state.user.cognito.idToken.jwtToken },
        liveAdminGameKey: function() {return this.$store.state.live.admin.gameKey;}
    }
}
</script>