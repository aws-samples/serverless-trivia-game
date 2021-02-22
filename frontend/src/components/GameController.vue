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
import JoinGame from './Joingame';
import Question from './Question';
import Scoreboard from './Scoreboard';
import LiveGamePlayerController from './LiveGamePlayerController';
import BlitzGamePlayer from './BlitzGamePlayer';

export default {
    name: 'GameController',
    components: {
        JoinGame,
        Question,
        Scoreboard,
        LiveGamePlayerController,
        BlitzGamePlayer,
    },
    computed: {
        gamemode: function() { return this.$store.state.gamemode },
        isLive: function() {return this.$store.state.live.player.live},
        isBlitz: function() {return this.$store.state.live.player.blitz},
        quizName: function() {return this.$store.state.quizName},
        gameId: function() {return this.$store.state.gameId},
    },
    methods: {
        closeScoreboard: function() {
            this.$store.commit('setQuestions', {});
            this.$store.commit('setScoreboard', []);
            this.$store.commit('setQuizName','');
            this.$store.commit('setGameId', '');
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
            this.$store.commit('setUIMode', 'home');
        }

    }
}
</script>