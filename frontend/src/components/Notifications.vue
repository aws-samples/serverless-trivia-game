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
<v-snackbar v-model="snackbar" :timeout="10000" :color="message.result" elevation="24">
    {{ message.text }}

    <template v-slot:action="{ attrs }">
        <v-btn
          color="white"
          text
          v-bind="attrs"
          @click="snackbar = false"
        >
          Close
        </v-btn>
      </template>
</v-snackbar>
</template>

<script>
import DataService from '@/services/DataServices';
import Config from '@/services/AWSConfig';

export default {

    name: 'Notifications',

    created() {
        this.subscribeEndpoint();
    },
    computed: {
        username: function() { return this.$store.state.user.username },
        myjwt: function() { return this.$store.state.user.cognito.idToken.jwtToken },
        avatar: {
            get: function() { return this.$store.state.profile.avatar },
            set: function(newval) {this.$store.commit('setProfileAvatar', newval);}
        },
        thumbnail: {
            get: function() { return this.$store.state.user.picture },
            set: function(newval) {this.$store.commit('setUserPicture', newval);}
        }
    },
    data: function() {return{
        snackbar: false,
        message: {}
    }},
    methods: {
        subscribeEndpoint: function() {
            self.broadcast = new BroadcastChannel('profile-channel');
            // Listen to the response
            self.broadcast.onmessage = this.handleNotification;
            const vapidPublicKey = Config.vapidPublicKey;
            const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);
            self.vapidKey = convertedVapidKey;
            this.registerForPush();
        },

        urlBase64ToUint8Array: function(base64String) {
            var padding = '='.repeat((4 - base64String.length % 4) % 4);
            /* eslint-disable no-useless-escape */
            var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

            var rawData = window.atob(base64);
            var outputArray = new Uint8Array(rawData.length);

            for (var i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        },
        registerForPush: function() {
            const jwt = this.myjwt;
            const playerName = this.username;
            navigator.serviceWorker.ready
            .then(function (registration) {
                return registration.pushManager.getSubscription()
                    .then(async function (subscription) {
                        if (subscription) {
                            console.log('got subscription!', subscription)
                            return subscription;
                        }
                        const convertedVapidKey = self.vapidKey;
                        return registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: convertedVapidKey
                        });
                    });
            }).then(function (subscription) {
                console.log('register!', subscription);
                const body = JSON.stringify(subscription);
                const parms = {jwt: jwt, playerName: playerName, subscription: body};
                const res = DataService.postPlayerSubscription(parms);
                console.log(res);
            });
        },

        handleNotification: function(event) {
            console.log(event.data.body);
            const type = event.data.title;
            switch(type) {
                case 'avatar':
                    this.handleAvatarNotification(event.data);
                    break;
                default:
                    console.log("Unrecognized notification type: " + type);
            }
        },

        handleAvatarNotification: function(notification) {
            const payload = JSON.parse(notification.data);
            this.message = { result: payload.result, text: notification.body };
            this.snackbar = true;
            if(payload.result == "success") {
                this.avatar = payload.avatar;
                this.thumbnail = payload.thumbnail;
            }
        }
    }
}
</script>