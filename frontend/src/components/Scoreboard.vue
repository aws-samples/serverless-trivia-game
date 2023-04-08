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
    <div v-if="quizname!=''">
        <v-toolbar color="primary" class="headline black--text">
            <v-spacer></v-spacer>
            <v-toolbar-title>Scoreboard for Quiz: {{quizname}}</v-toolbar-title>
            <v-spacer></v-spacer>
        </v-toolbar>
        <v-row align="center" justify="center" class="mb-6">
<!--             <v-data-table
                :headers="headers"
                :items="scoreboard">
                <template v-slot:item="props">
                    <tr>
                        <td>{{props.item.Position}}</td>
                        <td>
                            <v-avatar color="accent" size="24" class="mr-2">
                                <img v-if='checkFile(props.item.playerAvater)===true' :src="props.item.playerAvatar"/>
                                <v-icon v-else dark>mdi-account-circle</v-icon>
                            </v-avatar>{{props.item.playerName}}
                        </td>
                        <td>{{props.item.Score}}</td>
                    </tr>
                </template>
            </v-data-table> -->
            <v-table>
                <thead>
                    <tr>
                        <th></th>
                        <th class="text-left">
                            Position
                        </th>
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
                        :key="player.Position"
                    >
                        <td>
                            <v-avatar color="accent" size="24" class="mr-2">
                                <v-img v-if="checkFile(player.playerAvatar)" :src="player.playerAvatar"/>
                                <v-icon v-else>mdi-account-circle</v-icon>
                            </v-avatar>
                        </td>
                        <td>{{ player.Position }}</td>
                        <td>{{ player.playerName }}</td>
                        <td>{{ player.Score }}</td>
                    </tr>
                </tbody>
            </v-table>

        </v-row>
        <v-row class="mb-6"></v-row>
        <v-row class="mb-6">
            <v-btn x-large block color=button-main class="white--text" v-on:click='$emit("close-me")'>Close</v-btn>
        </v-row>

    </div>
<!--     <v-container v-else>
        <v-toolbar color="primary" class="headline black--text">
            <v-spacer></v-spacer>
            <v-toolbar-title>Select a Game to See Scoreboard</v-toolbar-title>
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
                    :headers="gamelistheaders"
                    :items="gamelist"
                    item-key="gameId"
                    dense
                    loading="Retrieving Game List"
                    no-data-text="No games currently being hosted"
                    :search="search"
                    sort-by="quizName"
                    must-sort>
                    <template v-slot:item="props">
                        <tr @click="getscoreboard(props.item)">
                            <td>{{props.item.quizName}}</td>
                            <td>{{props.item.host}}</td>
                            <td>{{props.item.questionType}}</td>
                            <td>{{props.item.quizMode}}</td>
                        </tr>
                    </template>
                </v-data-table>
            </v-row>
            <v-row class="mb-6"></v-row>
            <v-row class="mb-6">
                <v-btn x-large block color='accent' class="white--text" v-on:click='$emit("close-me")'>Close</v-btn>
            </v-row>
        </v-card>
    </v-container> -->
</template>

<script>
import { defineComponent } from 'vue'
import { DataService } from '@/services/DataServices.js'
import axios from 'axios'
import { useGameStore } from '@/store/game.js'

export default defineComponent({
    name: 'scoreboard-listing',

    data: function() {return {
        rows: [5,11,11],
        headers: [ { text: 'Position', align:'left', sortable:'false', value:'Position' },
        { text: 'Player Name', value: 'playerName', sortable:'false'},{ text: 'Score', value: 'Score', sortable:'false'} ],
        gamelistheaders: [ {text: 'Quiz', align:'left', sortable:'true', value:'quizName'},
        {text:'Host', value:'host'}, {text:'Question Type', value:'questionType'},
        {text:'Mode', value:'quizMode'}],
        search: '',
        api:''
    };},
    
    computed: {
        scoreboard: function() { 
            const gameStore = useGameStore()
            return gameStore.scoreboard.players } ,
        quizname: function() { 
            const gameStore = useGameStore()
            return gameStore.game.quizName },
        gamelist: function() {
            const gameStore = useGameStore()
            return gameStore.games.gamelist },
        username: function() { 
            const gameStore = useGameStore()
            return gameStore.user.username },
        myjwt: function() { 
            const gameStore = useGameStore()
            return gameStore.user.cognito.idToken.jwtToken; }
    },

    methods: {
        async getscoreboard(game) {
            const gameStore = useGameStore()
            let data = {gameId: game.gameId, quizName: game.quizName, playerName: this.username, jwt: this.myjwt};
            let results = await DataService.getScoreboardWithPlayer(data);
            gameStore.game.quizName = game.quizName
            gameStore.scoreboard.players = results.data
            gameStore.gamemode = 'scoreboard'
        }, 
        async checkFile(file) {
            console.log(file)
            try {
                let response = await axios.get(file)
                if (response.status===403) { 
                    return false;
                } else {
                    return true;
                }
            } catch(e) {
                //axios get error, suppress avatar
                return false
            }
        }
        
    }
})
</script>

