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
        <v-row>
            <v-toolbar color="primary" class="headline black--text">
                <v-spacer></v-spacer>
                <v-toolbar-title>Player Information</v-toolbar-title>
                <v-spacer></v-spacer>
            </v-toolbar>
        </v-row>
        <v-row>
            <v-alert v-model="error" dismissible type="error" style="error">{{errortext}}</v-alert>
        </v-row>
        <v-row>
            <v-alert v-model="status" dismissible type="info" style="info">{{statustext}}</v-alert>
        </v-row>
        <v-row>
            <v-col cols="12" sm="4" md="4">
                <v-container>
                    <v-row justify="center" style="position:relative;">
                        <v-col class="d-flex justify-center">
                            <v-avatar v-model="avatar" color="accent" size="164" class="profile">
                                <img v-if="avatar" :src="avatar"/>
                                <v-icon v-else x-large dark>mdi-account-circle</v-icon>
                            </v-avatar>
                        </v-col>
                    </v-row>
                    <v-row justify="center">
                    <v-dialog v-model="dialog" persistent max-width="400px">
                        <template v-slot:activator="{ on, attrs }" justify="center">
                            <v-btn color="accent" class="white--text" v-bind="attrs" v-on="on">Change Avatar</v-btn>
                        </template>
                        <v-card>
                            <v-card-title>
                            <span class="headline">User Avatar</span>
                            </v-card-title>
                            <v-card-text>
                            <v-container>
                                <v-row justify="center">
                                    <v-avatar v-model="avatar" color="accent" size="164" class="profile">
                                        <img v-if="newavatar" :src="newavatar"/>
                                        <img v-else-if="avatar" :src="avatar"/>
                                        <v-icon v-else x-large dark>mdi-account-circle</v-icon>
                                    </v-avatar>
                                </v-row>
                                <v-row>
                                    <v-col>
                                        <v-file-input
                                            accept="image/png, image/jpeg, image/bmp" placeholder="Pick an avatar" prepend-icon="mdi-camera" label="Avatar"
                                            @change="previewAvatar" v-model="file">
                                        </v-file-input>
                                    </v-col>
                                </v-row>
                            </v-container>
                            </v-card-text>
                            <v-card-actions>
                            <v-spacer></v-spacer>
                            <v-btn
                                color="primary darken-1"
                                text
                                @click="dialog = false"
                            >
                                Close
                            </v-btn>
                            <v-btn
                                color="primary darken-1"
                                text
                                :loading="uploading"
                                :disabled="uploading"
                                @click="uploadAvatar"
                            >
                                Save
                            </v-btn>
                            </v-card-actions>
                        </v-card>
                    </v-dialog>
                    </v-row>
                </v-container>
            </v-col>
            <v-col cols="12" sm="8">
                <v-container>
                    <v-row>
                        <v-col><v-text-field label="Player Name" readonly v-model='username' placeholder='retreiving...'/></v-col>
                    </v-row>
                    <v-row>
                        <v-col><v-text-field label="Location" v-model='location' placeholder='Location'/></v-col>
                    </v-row>
                    <v-row>
                        <v-col><v-text-field label="Real Name" v-model='realname' placeholder='Real Name'/></v-col>
                    </v-row>
                    <v-row>
                        <v-col><v-text-field label="Live Wins" readonly :value='playerWins' placeholder='0'/></v-col>
                    </v-row>
                    <v-row>
                        <v-col><v-text-field label="Experience" readonly :value='playerXp' placeholder='0'/></v-col>
                    </v-row>
                    <v-row>
                        <v-col><v-text-field label="Level" readonly :value='playerLevel' placeholder='0'/></v-col>
                    </v-row>
                    <v-row>
                        <v-col><v-text-field label="Wallet" readonly :value='playerWallet' placeholder='0'/></v-col>
                    </v-row>
                 </v-container>
             </v-col>
        </v-row>
        <v-row class="mb-1">
            <v-btn x-large block color="accent" class="white--text" v-on:click='requestBucks'>Request Bucks</v-btn>
        </v-row>
        <v-row class="mb-1">
            <v-btn x-large block color="accent" class="white--text" v-on:click='checkinput'>Update Player</v-btn>
        </v-row>
        <v-row class="mb-1"> 
            <v-btn x-large block color="accent" class="white--text" v-on:click='returnHome'>Return to Home Page</v-btn>
        </v-row>
    </v-container>    
</template>

<script>
import DataService from '@/services/DataServices';

export default {

    name: 'Player',
    props: {
        playerXp: Number,
        playerLevel: Number,
        playerWins: Number,
        playerWallet: Number
    },
    computed: {
        username: function() { return this.$store.state.user.username},
        myjwt: function() { return this.$store.state.user.cognito.idToken.jwtToken },
        location: {
            get: function() { return this.$store.state.profile.location },
            set: function(newval) {this.$store.commit('setProfileLocation', newval)}
        },
        realname: {
            get: function() { return this.$store.state.profile.realName },
            set: function(newval) {this.$store.commit('setProfileName', newval)}
        },
        avatar: {
            get: function() { return this.$store.state.profile.avatar },
            set: function(newval) {this.$store.commit('setProfileAvatar', newval); this.$store.commit('setUserPicture', newval);}
        },
        wins: function() { return this.$store.state.profile.wins },
        level: function() { return this.$store.state.profile.level },
        experience: function() { return this.$store.state.profile.experience },
    },
    data: function() {return{
        error: false,
        errortext:'',
        status: false,
        statustext: '',
        dialog: false,
        uploadUrl: '',
        newavatar: null,
        uploading: false,
        file: null
    }},
    methods: {
        returnHome() {
            this.$store.commit('setHostGameMode', 'getlist');
            this.$store.commit('setUIMode', 'home');
        },
        async checkinput() {
            let parms = {jwt: this.myjwt, playerName: this.username, playerLocation: this.location, realName: this.realname, newavatar: ''} ;
            let result = await DataService.setPlayer(parms);
            if(result.status===200){
                this.statustext = 'Player updated';
                this.status= true;
            }
        },
        async requestBucks() {
            let parms = {jwt: this.myjwt, playerName: this.username, playerLocation: this.location, realName: this.realname, newavatar: ''} ;
            let result = await DataService.postPlayerWallet(parms);
            if(result.status===200){
                this.statustext = 'Bucks Requested';
                this.status= true;
            }
        },
        async previewAvatar(e) {
            if(e) {
                this.uploading = true;
                this.newavatar = URL.createObjectURL(e);
                let parms = {jwt: this.myjwt, playerName: this.username, newavatar: e.name, fileType: e.type} ;
                let result = await DataService.setPlayer(parms);
                if(result.status==200) {
                    this.uploadUrl = result.data.signedurl;
                }
                this.uploading = false;
            } else {
                this.newavatar = null;
            }
        },
        async uploadAvatar() {
            if(this.uploadUrl=='') {
                this.errortext = "An error occurred while uploading the avatar";
                this.error = true;
            } else {
                this.uploading = true;
                const upload = await fetch(this.uploadUrl, {
                    method: 'PUT',
                    headers: {
                        "Content-Type": this.file.type
                    },
                    body: this.file
                }).catch(err => {
                    console.log(err.response.data);
                    this.errortext = "An error occurred while uploading the avatar";
                    this.error = true;
                });
                console.log('Result: ', upload);
                if(upload.status===200) {
                    this.statustext = 'Your avatar is being processed. You will receive a notification once is completed.';
                    this.status= true;
                }
                this.uploading = false;
            }
            this.dialog = false;
        }
    }
}
</script>