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
        <v-toolbar color="primary" class="headline black--text">
            <v-spacer></v-spacer>
            <v-toolbar-title>Select A Game To Play</v-toolbar-title>
            <v-spacer></v-spacer>
        </v-toolbar>
        <v-row>
            <v-alert v-model="error" dismissible type="error" style="error">{{errortext}}</v-alert>
        </v-row>
            <v-card>
                <v-card-title>Game Listing<v-spacer></v-spacer>
                        <v-col width=33%>
                            <v-select label="Type of Game" :items="quizTypes" v-model='quizType'/>
                        </v-col>
                        <v-col width=33%>
                            <span v-if="quizType==='Single Player'">
                                <v-select label="Quiz Category" :items="quizCategories" v-model='quizCategory'/>
                            </span>
                            <span v-if="quizType==='Multiplayer'">
                                <v-text-field label="Quiz Host" v-model='quizHost' placeholder='Host Name'/>
                            </span>
                        </v-col>
                        <v-col width=33%>
                            <v-btn x-large block color="accent" class="white--text" v-on:click='checkinput'>Search for Games</v-btn>
                        </v-col>
                </v-card-title>
                <v-data-table
                    :headers="headers"
                    :items="gamelist"
                    item-key="gameId"
                    dense
                    loading="..."
                    no-data-text="No games meet that criteria"
                    :search="search"
                    sort-by="quizName"
                    must-sort>
                    <template v-slot:item="props">
                        <tr @click="joinGame(props.item)">
                            <td>{{props.item.quizName}}</td>
                            <td>{{props.item.quizDescription}}</td>
                            <td>{{props.item.hostName}}</td>
                            <td>{{props.item.questionType}}</td>
                            <td>{{props.item.quizMode}}</td>
                        </tr>
                    </template>
                </v-data-table>
            </v-card>
        <v-row class="mb-6"></v-row>
        <v-row class="mb-6">
            <v-btn x-large block color='accent' class="white--text" v-on:click='$emit("close-me")'>Home</v-btn>
        </v-row>
    </v-container>
</template>

<script>
import DataService from '@/services/DataServices.js';

export default {
    name: 'Joingame',
    data: function () {
        return {
            search: '',
            pagination: {},
            rows: [5,11,11],
            headers: [ { text: 'Quiz Name', align:'left', value:'quizName'}, 
            { text: 'Description', value: 'quizDescription'},
            { text: 'Host', value: 'playerName'},
            { text: 'Question Type', value: 'questionType'},
            { text: 'Quiz Mode', value: 'quizMode'}],
            quizCategories: ['Books and Music', 'Sciences', 'Sports', 'History', 'TV and Movies', 'Potpourri'],
            quizTypes: ['Single Player', 'Multiplayer'],
            quizType: '',
            quizCategory: '',
            quizHost: '',
            errortext: '',
            error:false
        }
    },
    computed: {
        gamelist: function() {return this.$store.state.games.gamelist;},
        username: function() {return this.$store.state.user.username;},
        myjwt: function() { return this.$store.state.user.cognito.idToken.jwtToken; },
        liveGameKey: function() { return this.$store.state.live.player.gameKey; }
    },
    methods: {
        async checkinput() {
          this.error = false;
          this.cleargameinfo();
          if(this.quizType===''){
              this.errortext = 'Please select a quiz type';
          } else if(this.quizType==='Single Player' && this.quizCategory==='') {
              this.errortext = 'Please select a quiz category';
          } else if(this.quizType==='Multiplayer' && this.quizHost==='') {
              this.errortext = 'Please enter a quiz host';
          }
          if(this.errortext==='') {
            let parms = {jwt: this.myjwt}
            if(this.quizType==='Single Player') {
                parms.queryString = 'category';
                parms.value = this.quizCategory;
            } else {
                parms.queryString = 'host';
                parms.value = this.quizHost
            }
            let results = await DataService.getActiveGameQuery(parms);
            this.$store.commit('setGameList', results.data);
          } else {
            this.error=true;
          }
        },
        
        cleargameinfo() {
                this.$store.commit('setQuestions', {});
                this.$store.commit('setScoreboard', []);
                this.$store.commit('setQuizName','');
                this.$store.commit('setGameId', '');
                this.$store.commit('setLivePlayerResponded', 0);
        },

        async joinGame(game) {
            let quizinfo = {quizName: game.quizName, gameId: game.gameId, playerName: game.hostName,
                quizMode: game.quizMode, username: this.username, jwt: this.myjwt};
            if(game.quizMode==='Single Player') {
                let msg = await DataService.getGame(quizinfo);
                this.$store.commit('setSystemChat', 'Starting Quiz!');
                this.$store.commit('setQuestions', msg.data.questions);
                this.$store.commit('setNumberofQuestions', msg.data.questions.length);
                this.$store.commit('setQuizName', msg.data.quizName);
                this.$store.commit('setPlayGameId', game.gameId);
                this.$store.commit('setGameState', 'quiz');
                this.$store.commit('setQuizType', msg.data.questionType);
            } else if(game.quizMode.includes('Casual')||game.quizMode.includes('Competitive')){
                let message = {};
                delete quizinfo.jwt;
                message.message = 'liveplayer';
                quizinfo.subaction = 'joingame';
                quizinfo.hostname = game.hostName;
                message.data = quizinfo;
                this.$store.commit('setLivePlayerMode', true);
                this.$store.commit('setLivePlayerGameId', game.gameId);
                this.$store.commit('setPlayerLiveHost', game.hostName);
                this.$store.commit('setGameState', 'live');
                this.$store.commit('setLivePlayerUIMode', 'lobby');
                this.$emit('send-message', message);
            } else {
                this.$store.commit('setBlitzPlayerGameOver', false);
                this.$store.commit('setLivePlayerGameId', game.gameId);
                this.$store.commit('setLivePlayerUIMode', 'lobby');                
                this.$store.commit('setPlayerLiveHost', game.hostName);
                this.$store.commit('setPlayerLiveGameKey', `${game.gameId}:${game.hostName}`);
                this.$store.commit('setLivePlayerQuestion', '');
                this.$store.commit('setLivePlayerQuizName', game.quizName);
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/question`);
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/joined/+`);
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/results/${this.username}`);
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/scoreboard`);
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/gameover`);
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/playercorrect`);
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/endthegame`);
                let message = { playerName: game.hostName, quizName: game.quizName, 
                    gameId: game.gameId, questionType: game.questionType, 
                    quizMode: game.quizMode, respondingPlayerName: this.username, starttime: `${String(new Date())}`};
                this.$emit('send-iot-message', `games/${this.liveGameKey}/join/${this.username}`, JSON.stringify(message));
                this.$store.commit('setPlayerLiveBlitzMode', true);
                this.$store.commit('setGameState', 'blitz');
            }
        }
    }

}
</script>
