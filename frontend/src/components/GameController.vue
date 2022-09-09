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
    <div class='game-controller'>
        <JoinGame v-if="gamemode==='showgames'" v-on:send-message="sendmessage" v-on:close-me="mainmenu" v-on:send-iot-message="sendIoTMessage" v-on:subscribe-iot-topic="subscribeIoTTopic"/>
        <Question v-if="gamemode==='quiz'" v-on:send-message="sendmessage"/>
        <Scoreboard v-if="gamemode==='scoreboard'" v-on:send-message="sendmessage" v-on:close-me="closeScoreboard"></Scoreboard>
        <LiveGamePlayerController v-if="isLive" v-on:send-message="sendmessage"/>
        <BlitzGamePlayer v-if="isBlitz" v-on:send-iot-message="sendIoTMessage"/>
    </div>
</template>

<script>
import { defineComponent } from 'vue'
import JoinGame from './Joingame.vue'
import Question from './Question.vue'
import Scoreboard from './Scoreboard.vue'
import LiveGamePlayerController from './LiveGamePlayerController.vue'
import BlitzGamePlayer from './BlitzGamePlayer.vue'
import { useGameStore } from '@/stores/game.js'

export default defineComponent({
    name: 'GameController',
    components: {
        JoinGame,
        Question,
        Scoreboard,
        LiveGamePlayerController,
        BlitzGamePlayer,
    },
    emits: ['send-raw-message', 'send-iot-message', 'subscribe-iot-topic'],
    computed: {
        gamemode: function() { 
            const gameStore = useGameStore()
            return gameStore.gamemode },
        isLive: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.live},
        isBlitz: function() {
            const gameStore = useGameStore()
            return gameStore.live.player.blitz},
        quizName: function() {
            const gameStore = useGameStore()
            return gameStore.quizName},
        gameId: function() {
            const gameStore = useGameStore()
            return gameStore.gameId},
    },
    methods: {
        closeScoreboard: function() {
            const gameStore = useGameStore()
            gameStore.game.questions = {}
            gameStore.scoreboard.players = []
            gameStore.game.quizName = ''
            gameStore.admin.newquiz.gameid = ''
            gameStore.gamemode = 'showgames'
            this.$store.commit('setGameState', 'showgames');
        },

        listGames() {
            let message = {message: 'listactivegames'};
            this.$emit('send-raw-message', JSON.stringify(message));
        },

        sendmessage(message) {
            this.$emit('send-raw-message', JSON.stringify(message));
        }, 

        sendIoTMessage(topic, message) {
            this.$emit('send-iot-message', topic, message);
        },

        subscribeIoTTopic(topic) {
            this.$emit('subscribe-iot-topic', topic);
        },

        mainmenu() {
            const gameStore = useGameStore()
            gameStore.uimode = 'home'
        }

    }
})
</script>