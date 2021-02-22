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
        <span v-if="adminmode==='showadminlist'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Select a game to edit</v-toolbar-title>
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
                            <tr>
                                <td><input type="radio" :value="props.item.gameId" v-model="pickedGameId"></td>
                                <td>{{props.item.quizName}}</td>
                                <td>{{props.item.quizDescription}}</td>
                                <td>{{props.item.quizMode}}</td>
                                <td>{{props.item.questionType}}</td>
                            </tr>
                        </template>
                    </v-data-table>
                </v-row>
            </v-card>
            <v-row class="mb-1">
                <v-btn x-large block color="accent" class="white--text" v-on:click="createNew">Create New</v-btn>
            </v-row>
            <v-row class="mb-1">
                <v-btn x-large block color="accent" class="white--text" v-on:click="editGame">Edit Quiz</v-btn>
            </v-row>
            <v-row class="mb-1">
                <v-btn x-large block color="accent" class="white--text" v-on:click="sellGame">Sell Quiz</v-btn>
            </v-row>
            <v-row class="mb-1">
                <v-btn x-large block color="accent" class="white--text" v-on:click="closeList">Home</v-btn>
            </v-row>
        </span>
    </div>
</template>

<script>
import DataService from '@/services/DataServices';

export default {
    name: 'QuizList',
    data: function() { return {
        quizName: '',
        quizCode: '',
        gameheaders: [ {text: '', align:'left', sortable:'false', value:'selected'},
                    { text: 'Quiz Name', align:'left', sortable:'false', value:'quizName'},
                    { text: 'Description', value: 'quizDescription'},
                    { text: 'Quiz Mode', value: 'quizMode'},
                    { text: 'Question Type', value: 'questionType'}],
        playerheaders: [{ text: 'Player Name', align:'left', sortable:'false', value:'Player Name'}],
        question: 0,
        gameid:'',
        search:'',
        pickedGameId:''
    }},
    methods: {
        async editGame() {
            if(this.pickedGameId!='') {
                let results = await DataService.getFullGame({gameId: this.pickedGameId, playerName: this.username, jwt: this.myjwt});
                this.$store.commit('setAdminGame', results.data);
                this.$store.commit('setAdminMode','showadminedit');
            } else {
                alert('Please select a game first');
            }
        },
        closeList() {
            this.$store.commit('setHostGameMode', 'getlist');
            this.$store.commit('setUIMode', 'home');
        },
        createNew() {
            this.$store.commit('setAdminMode','showheader');
        },
        async sellGame() {
            if(this.pickedGameId!='') {
                let parms = {};
                let amount;
                this.gamelist.forEach(game =>
                {
                    if(game.gameId === this.pickedGameId)
                    {
                        amount = prompt('How much would you like to offer this game for?', 1);
                        //todo: add in check for float entry
                        if(isNaN(parseInt(amount))){
                            alert('Please enter an integer value for amount');
                            return;
                        } else {
                            amount = parseInt(amount);
                            parms = game;
                        }
                    }
                });
                if(Object.prototype.hasOwnProperty.call(parms, 'gameId')) {
                    parms.playerName = this.username;
                    parms.amount = amount;
                    parms.jwt = this.myjwt;
                    await DataService.putGameToMarketplace(parms);
                } else {
                    alert('Error with game selected.  Please try later.');
                }
            } else {
                alert('Please select a game first');
            }
        }
    },
    computed: {
        adminmode: function() {return this.$store.state.adminmode},
        gamelist: function() {return this.$store.state.admin.gamelist;},
        username: function() {return this.$store.state.user.username;},
        gethostbutton: function() {if(this.question==0){return "Start Quiz";} else {return "Next Question";}},
        game: function() {return this.$store.state.admin.game;},
        myjwt: function() { return this.$store.state.user.cognito.idToken.jwtToken }
    }
}
</script>