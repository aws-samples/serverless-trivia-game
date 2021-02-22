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
<Hostgame v-if="!(isLive || isBlitz) && (adminmode==='showlist' || adminmode==='getlist')" v-on:send-message="sendmessage" v-on:send-iot-message="sendiotmessage" v-on:subscribe-iot-topic="subscribeiottopic"/>
<Managequiz v-if="!(isLive || isBlitz) && (adminmode==='showadminedit' || adminmode==='showadminlist' || adminmode==='showheader' || adminmode==='showquestions')" v-on:send-message="sendmessage"/>
<LiveGameAdminController v-on:send-message="sendmessage" v-on:send-iot-message="sendiotmessage" v-if="isLive"/>
<BlitzGameAdmin v-if="isBlitz" v-on:send-iot-message="sendiotmessage"/>
</div>  

</template>

<script>
import Hostgame from './Hostgame';
import Managequiz from './Managequiz';
import LiveGameAdminController from './LiveGameAdminController';
import BlitzGameAdmin from './BlitzGameAdmin';

export default {
    name: 'AdminController',
    components: {
        Hostgame,
        Managequiz,
        LiveGameAdminController,
        BlitzGameAdmin
    },
    methods: {
        sendmessage: function(message) {
            this.$emit("send-message", message);
        },
        sendiotmessage: function(topic, message) {
            this.$emit("send-iot-message", topic, message);
        },
        subscribeiottopic: function(topic) {
            this.$emit("subscribe-iot-topic", topic);
        },
        saveQuestion: function(question){
            this.$emit("send-message", JSON.stringify({'message':'savequestion','data':question}));
        }
    },
    computed: {
        isLive: function() {return this.$store.state.live.admin.live;},
        isBlitz: function() {return this.$store.state.live.admin.blitz;}, 
        getMode: function() {return this.$store.state.admin.hostgames.mode;},
        adminmode: function() {return this.$store.state.adminmode;},
        liveAdminGameKey: function() {return this.$store.state.admin.liveGameKey;}
    }
}
</script>

