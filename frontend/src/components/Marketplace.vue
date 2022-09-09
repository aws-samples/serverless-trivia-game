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
        <span>
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Select a game to purchase</v-toolbar-title>
                <v-spacer></v-spacer>
            </v-toolbar>            
            <!-- <v-card>
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
                        :items="marketplaceListings"
                        item-key="gameId"
                        dense
                        sort-by="quizName"
                        no-data-text="No games for sale right now"
                        :search="search"
                        >
                        <template v-slot:item="props">
                            <tr>
                                <td><input type="radio" :value="props.item.gameId" v-model="pickedGameId"></td>
                                <td>{{props.item.quizName}}</td>
                                <td>{{props.item.quizDescription}}</td>
                                <td>{{props.item.quizMode}}</td>
                                <td>{{props.item.questionType}}</td>
                                <td>{{props.item.playerName}}</td>
                                <td>{{props.item.amount}}</td>
                            </tr>
                        </template>
                    </v-data-table>
                </v-row>
            </v-card> -->
            <v-row class="mb-6">
                <v-col cols="3"></v-col><v-col cols="6">
                    <v-row>
                    <v-table>
                        <thead>
                            <tr>
                                <th>

                                </th>
                                <th class="text-left">
                                    Quiz Name
                                </th>
                                <th class="text-left">
                                    Quiz Mode
                                </th>
                                <th class="text-left">
                                    Question Type
                                </th>
                                <th class="text-left">
                                    Seller
                                </th>
                                <th class="text-left">
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="game in marketplaceListings"
                                :key="game.gameId"
                            >
                                <td><input type="radio" :value="game.gameId" v-model="pickedGameId"></td>
                                <td>{{ game.quizName }}</td>
                                <td>{{ game.quizMode }}</td>
                                <td>{{ game.questionType }}</td>
                                <td>{{ game.playerName }}</td>
                                <td>{{ game.amount }}</td>
                            </tr>
                        </tbody>
                    </v-table></v-row>
                </v-col>
            </v-row>

            <v-row class="mb-6">
                <v-btn x-large block color="#00FFFF" class="white--text" v-on:click="purchaseGame">Purchase Game</v-btn>
            </v-row>
            <v-row class="mb-6">
                <v-btn x-large block color="#00FFFF" class="white--text" v-on:click="closeList">Home</v-btn>
            </v-row>
        </span>
    </div>
</template>

<script>
import { defineComponent } from 'vue'
import { DataService } from '@/services/DataServices.js'
import { useGameStore } from '@/stores/game.js'

export default defineComponent({
    name: 'Marketplace',
    props: {
        marketplaceListings: Array
    },
    data: function() { return {
        quizName: '',
        quizCode: '',
        gameheaders: [ {text: '', align:'left', sortable:'false', value:'selected'},
                    { text: 'Quiz Name', align:'left', sortable:'false', value:'quizName'},
                    { text: 'Description', value: 'quizDescription'},
                    { text: 'Quiz Mode', value: 'quizMode'},
                    { text: 'Question Type', value: 'questionType'},
                    { text: 'Seller', value: 'playerName'},
                    { text: 'Sale Amount', value: 'amount'}],
        question: 0,
        gameid:'',
        search:'',
        pickedGameId:''
    }},
    methods: {
        async purchaseGame() {
            let sellerPlayerId;
            if(this.pickedGameId!='') {
                this.marketplaceListings.forEach(game =>
                {
                    if(game.gameId===this.pickedGameId)
                    {
                        sellerPlayerId = game.playerName
                    }
                });
                let results = await DataService.purchaseGame({gameId: this.pickedGameId, playerId: this.username,
                    sellerPlayerId, jwt: this.myjwt})
                console.info(`here are the results: ${JSON.stringify(results)}`)
                let output = JSON.parse(results.data.output)
                switch(output.statusCode){
                    case 500:
                        alert(output.body.message)
                        break
                    case 200:
                        alert('Game purchased')
                        break
                }
            } else {
                alert('Please select a game first')
            }
        },
        closeList() {
            const gameStore = useGameStore()
            gameStore.admin.hostgames.mode ='getlist'
            gameStore.uimode = 'home'
        },
    },
    computed: {
        adminmode: function() {
            const gameStore = useGameStore()
            return gameStore.adminmode},
        gamelist: function() {
            const gameStore = useGameStore()
            return gameStore.admin.gamelist},
        username: function() {
            const gameStore = useGameStore()
            return gameStore.user.username},
        game: function() {
            const gameStore = useGameStore()
            return gameStore.admin.game;},
        myjwt: function() { 
            const gameStore = useGameStore()
            return gameStore.user.cognito.idToken.jwtToken }
    }
})
</script>