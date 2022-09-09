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
                <v-row class="mb-6"></v-row>
                <v-row class="mb-9">
                    <v-text-field
                        v-model="search"
                        append-icon="mdi-magnify"
                        label="Search"
                        single-line
                        hide-details
                    ></v-text-field>
                </v-row>
                </v-card-title>
                <v-row align="center" justify="center" class="mb-9">
<!--                     <v-data-table
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
                    </v-data-table> -->
                    <v-card>
                        <v-row class="mb-6">
                            <v-table>
                                <thead>
                                    <tr>
                                        <th class="text-left">
                                            Quiz Name
                                        </th>
                                        <th class="text-left">
                                            Quiz Description
                                        </th>
                                        <th class="text-left">
                                            Quiz Mode
                                        </th>
                                        <th class="text-left">
                                            Question Type
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-if="nogames"><td><b>You have no games</b></td></tr>
                                    <tr
                                        v-for="game in gamelist"
                                        :key="game.gameId"
                                        @click="hostGame(game)"
                                    >
                                        <td>{{ game.quizName }}</td>
                                        <td>{{ game.quizDescription }}</td>
                                        <td>{{ game.quizMode }}</td>
                                        <td>{{ game.questionType }}</td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </v-row>
                    </v-card>
                </v-row>
            </v-card>
            <v-btn x-large block color="#00FFFF" class="white--text" v-on:click="closelist">Close List</v-btn>
        </span>
    </div>
</template>

<script>
import { defineComponent } from 'vue'
import { DataService } from '@/services/DataServices.js'
import { useGameStore } from '@/stores/game.js'

export default defineComponent ({
    name: 'Hostgame',
    emits: ['send-message', 'send-iot-message', 'subscribe-iot-topic'],
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
            const gameStore = useGameStore()
            if(game.quizMode==='Single Player'){
                let message = {playerName: this.username, quizName: game.quizName, gameId: game.gameId, 
                    questionType: game.questionType, quizMode: game.quizMode, quizDescription: game.quizDescription,
                    starttime: String(new Date()), category: game.category};
                let response = await this.host(message)
                if(response.data.gameId === game.gameId) {
                    alert('Game ' + game.quizName + ' is now being run')
                }
            } else if(game.quizMode.includes('Casual')||game.quizMode.includes('Competitive')){
                let message = {message: 'liveadmin', data: {
                    subaction: 'hostgame', playerName: this.username, quizName: game.quizName, 
                    gameId: game.gameId, questionType: game.questionType, quizMode: game.quizMode, 
                    starttime: String(new Date()), channel: 'globalchat', category: game.category
                }}
                this.$emit('send-message', JSON.stringify(message))
                let results = await DataService.getFullGame({gameId: game.gameId, playerName: this.username, jwt: this.myjwt})
                gameStore.admin.hostgames.mode = 'getlist'
                gameStore.live.admin.live = true
                gameStore.live.admin.uimode = 'lobby'
                gameStore.live.admin.questions = results.data.questions
                gameStore.live.admin.quizName = results.data.quizName
                gameStore.live.admin.gameId = results.data.gameId
                gameStore.live.admin.gameType = results.data.quizMode
                gameStore.live.admin.questionType = results.data.questionType
            } else {
                gameStore.live.blitz.gameOver = false
                gameStore.live.admin.gameKey = `${game.gameId}:${this.username}`
                console.log(`current value of gameKey = ${gameStore.live.admin.gameKey}`)
                gameStore.live.admin.question = ''
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/questionlist`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/question`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/join/+`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/answer/+`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/answers/+`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/results/+`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/scoreboard`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/playercorrect`);
                this.$emit('subscribe-iot-topic', `games/${this.liveAdminGameKey}/endgame`);
                let message = { playerName: this.username, quizName: game.quizName, 
                    gameId: game.gameId, questionType: game.questionType, 
                    quizMode: game.quizMode, starttime: `${String(new Date())}`, category: game.category};
                this.$emit('send-iot-message', 'hostgame', JSON.stringify(message));
                gameStore.live.admin.blitz = true
                gameStore.live.admin.uimode = 'lobby'
            }
        },
        async host(parms){
            parms.jwt = this.myjwt;
            return DataService.hostGame(parms);
        },
        closelist: function() {
            const gameStore = useGameStore()
            gameStore.admin.hostgames.mode = 'getlist'
            gameStore.uimode = 'home'
        },
    },
    computed: {
        getMode: function() {
            const gameStore = useGameStore()
            return gameStore.admin.hostgames.mode},
        gamelist: function() {
            const gameStore = useGameStore()
            return gameStore.admin.hostgames.gamelist},
        username: function() {
            const gameStore = useGameStore()
            return gameStore.user.username},
        gethostbutton: function() {
            if(this.question==0){return "Start Quiz"} else {return "Next Question"}},
        myjwt: function() {
            const gameStore = useGameStore()
            return gameStore.user.cognito.idToken.jwtToken },
        liveAdminGameKey: function() {
            const gameStore = useGameStore()
            console.log(`I see ${gameStore.live.admin.gameKey}`)
            return gameStore.live.admin.gameKey },
        nogames: function() {
            const gameStore = useGameStore()
            return gameStore.admin.hostgames.gamelist.length === 0
        }
    }
})
</script>