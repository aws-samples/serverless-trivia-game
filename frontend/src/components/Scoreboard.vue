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
    <v-container v-if="quizname!=''">
        <v-row>
            <v-toolbar color="primary" class="headline black--text">
                <v-spacer></v-spacer>
                <v-toolbar-title>Scoreboard for Quiz: {{quizname}}</v-toolbar-title>
                <v-spacer></v-spacer>
            </v-toolbar>
        </v-row>
        <v-row align="center" justify="center">
            <v-data-table
                :headers="headers"
                :items="scoreboard">
                <template v-slot:item="props">
                    <tr>
                        <td>{{props.item.Position}}</td>
                        <td>{{props.item.playerName}}</td>
                        <td>{{props.item.Score}}</td>
                    </tr>
                </template>
            </v-data-table>
        </v-row>
        <v-row class="mb-6">
            <v-btn x-large block color='accent' class="white--text" v-on:click='$emit("close-me")'>Close</v-btn>
        </v-row>
    </v-container>
    <v-container v-else>
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
    </v-container>
</template>

<script>
import DataService from '@/services/DataServices';

export default {
    name: 'Scoreboard',

    data: function() {return {
        rows: [5,11,11],
        headers: [ { text: 'Position', align:'left', sortable:'false', value:'Position' },
        { text: 'Player Name', value: 'playerName', sortable:'false'},{ text: 'Score', value: 'Score', sortable:'false'} ],
        gamelistheaders: [ {text: 'Quiz', align:'left', sortable:'true', value:'quizName'},
        {text:'Host', value:'host'}, {text:'Question Type', value:'questionType'},
        {text:'Mode', value:'quizMode'}],
        search: ''
    }},

    computed: {
        scoreboard: function() { return this.$store.state.scoreboard.players; } ,
        quizname: function() { return this.$store.state.game.quizName; },
        gamelist: function() {return this.$store.state.games.gamelist;},
        username: function() { return this.$store.state.user.username; },
        myjwt: function() { return this.$store.state.user.cognito.idToken.jwtToken }
    },

    methods: {
        async getscoreboard(game) {
            let data = {gameId: game.gameId, quizName: game.quizName, playerName: this.username, jwt: this.myjwt};
            let results = await DataService.getScoreboard(data);
            this.$store.commit('setQuizName', game.quizName);
            this.$store.commit('setScoreboard', results.data);
            this.$store.commit('setGameState', 'scoreboard');
        }
    }
}
</script>

