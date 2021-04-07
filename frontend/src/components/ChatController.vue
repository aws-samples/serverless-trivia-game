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
    <v-col cols="12"><v-row><v-col cols="10">
    <div class="chat-box">
        <v-tabs>
            <v-tab v-for="tab in tabs" 
                :key="tab" 
                v-bind:class="['tab-button', { active: currentTab === tab}]"
                v-on:click="currentTab = tab">{{ tab }}</v-tab>
        </v-tabs>
        <component v-bind:is="currentTabComponent" v-bind:data=currentChat
        class="tab"></component>
        <v-text-field label="Chat" v-model="chat" placeholder="Chat" class="white--text"></v-text-field>
        <v-btn color="accent" class="white--text" v-on:click='handlechat'>send chat</v-btn>
    </div></v-col></v-row></v-col>
</template>
<script>
import GlobalChat from './Globalchat';

export default {
    name: 'ChatController',

    components: {
        GlobalChat,
    },

    data: function ()  { return {
            tabs: ['Global Chat'],
            currentTab: 'GlobalChat',
            channel: 'global',
            chat: ''}
    },

    computed: {
        globalchat: function() { return this.$store.state.chat.global },
        username: function() { return this.$store.state.user.username },
        currentTabComponent: function() {
            return this.currentTab.replace(/\s/g, '');
        },
        currentChat: function() {
            var returnme;
            switch(this.currentTab.replace(/\s/g,'')) {
                case 'GlobalChat':
                    returnme = this.globalchat;
                    break;
                }
            return returnme;   
        }
    },
    methods: {
        handlechat: function() {
            if(this.currentTab.toLowerCase().replace(/\s/g,'')) {
                let message = { message: `${this.username} says, "${this.chat}"` };
                this.chat = '';
                this.$emit("send-iot-message", "chat/globalchat", JSON.stringify(message));
            }
        }
    }
}
</script>
