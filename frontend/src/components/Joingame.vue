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
        <v-row class="mb-3">
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
                            <v-btn x-large block color="#00FFFF" class="white--text" v-on:click='checkinput'>Search for Games</v-btn>
                        </v-col>
                </v-card-title>
<!--                 <v-data-table
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
                 </v-data-table>-->
                <v-row class="mb-6" align="center">
                    <v-col cols="3"></v-col><v-col cols="6">
                    <v-table>
                        <thead>
                            <tr>
                                <th class="text-left">
                                    Quiz Name
                                </th>
                                <th class="text-left">
                                    Description
                                </th>
                                <th class="text-left">
                                    Host
                                </th>
                                <th class="text-left">
                                    Question Type
                                </th>
                                <th class="text-left">
                                    Quiz Mode
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="game in gamelist"
                                :key="game.gameId"
                                @click="joinGame(game)"
                            >
                                <td>{{ game.quizName }}</td>
                                <td>{{ game.quizDescription }}</td>
                                <td>{{ game.hostName }}</td>
                                <td>{{ game.questionType }}</td>
                                <td>{{ game.quizMode }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                    </v-col>
                </v-row>
                
            </v-card>
        <v-row class="mb-6"></v-row><v-row class="mb-6"></v-row><v-row class="mb-6"></v-row><v-row class="mb-6"></v-row>
        <v-row class="mb-6">
            <v-btn x-large block color='#00FFFF' class="white--text" v-on:click='$emit("close-me")'>Home</v-btn>
        </v-row>
    </v-container>
</template>

<script>
import { getCurrentInstance, defineComponent } from 'vue'
import { DataService } from '@/services/DataServices.js'
import { useGameStore } from '@/stores/game.js'

export default defineComponent({
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
            error:false,
            internallist:[]
        }
    },
    watch: {
        error: function(val) {
            if(val===false){
                this.errortext = ''
            }
        }
    },
    emits: ['close-me', 'subscribe-iot-topic', 'send-iot-message', 'send-message' ],
    computed: {
        gamelist: function() {
            const gameStore = useGameStore()
            return gameStore.games.gamelist },
        username: function() {
            const gameStore = useGameStore()
            return gameStore.user.username },
        myjwt: function() { 
            const gameStore = useGameStore()
            return gameStore.user.cognito.idToken.jwtToken },
        liveGameKey: function() { 
            const gameStore = useGameStore()
            return gameStore.live.player.gameKey },
        nogames: function() {
            const gameStore = useGameStore()
            if(gameStore.games.gamesList === undefined)
                {return true}
            return gameStore.games.gameList.length === 0
        }
    },
    methods: {
        async checkinput() {
            const gameStore = useGameStore()
            this.error = false
            this.cleargameinfo()
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
                    parms.queryString = 'category'
                    parms.value = this.quizCategory
                } else {
                    parms.queryString = 'host';
                    parms.value = this.quizHost
                }
                let results = await DataService.getActiveGameQuery(parms)
                gameStore.games.gamelist = results.data
            } else {
                this.error=true
            }
        },
        
        cleargameinfo() {
            const gameStore = useGameStore()
            gameStore.game.questions = {}
            gameStore.scoreboard.players = []
            gameStore.game.quizName = ''
            gameStore.admin.newquiz.gameid = ''
            gameStore.live.player.playersresponded=[]
            gameStore.live.player.playersresponded.length=0
        },

        async joinGame(game) {
            const gameStore = useGameStore()
            let quizinfo = {quizName: game.quizName, gameId: game.gameId, playerName: game.hostName,
                quizMode: game.quizMode, username: this.username, jwt: this.myjwt}
            if(game.quizMode==='Single Player') {
                let msg = await DataService.getGame(quizinfo)
                gameStore.system.unshift('Starting Quiz!' + "\r\n")
                gameStore.game.questions = msg.data.questions
                gameStore.game.numberofquestions = msg.data.questions.length
                gameStore.game.quizName = msg.data.quizName
                gameStore.game.gameId = game.gameId
                gameStore.gamemode = 'quiz'
                gameStore.game.questionType = msg.data.questionType
            } else if(game.quizMode.includes('Casual')||game.quizMode.includes('Competitive')){
                let message = {}
                delete quizinfo.jwt
                message.message = 'liveplayer'
                quizinfo.subaction = 'joingame'
                quizinfo.hostname = game.hostName
                message.data = quizinfo
                gameStore.live.player.live = true
                gameStore.live.player.gameid = game.gameId
                gameStore.live.player.host = game.hostName
                gameStore.gamemode = 'live'
                gameStore.live.player.uimode = 'lobby'
                this.$emit('send-message', message);
            } else {
                gameStore.live.blitz.gameOver = false
                gameStore.live.player.gameid = game.gameId
                gameStore.live.player.uimode = 'lobby'
                gameStore.live.player.host = game.hostName
                gameStore.live.player.gameKey = `${game.gameId}:${game.hostName}`
                gameStore.live.player.question = ''
                gameStore.live.player.quizName = game.quizName
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/question`)
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/joined/+`)
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/results/${this.username}`)
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/scoreboard`)
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/gameover`)
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/playercorrect`)
                this.$emit('subscribe-iot-topic', `games/${this.liveGameKey}/endthegame`)
                let message = { playerName: game.hostName, quizName: game.quizName, 
                    gameId: game.gameId, questionType: game.questionType, 
                    quizMode: game.quizMode, respondingPlayerName: this.username, starttime: `${String(new Date())}`}
                this.$emit('send-iot-message', `games/${this.liveGameKey}/join/${this.username}`, JSON.stringify(message))
                gameStore.live.player.blitz = true
                gameStore.gamemode = 'blitz'

            }
        }
    }
})
</script>
