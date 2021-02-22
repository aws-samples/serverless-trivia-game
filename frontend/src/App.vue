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
    <v-app>
    <v-app-bar  
        dense 
        max-height=48px
        color="primary"
        title="true"
    >   
        <v-app-bar-nav-icon  class="black--text" @click="drawer = true"></v-app-bar-nav-icon>   
        <v-toolbar-title class="black--text">Welcome to {{ appName }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-title v-if="isLoggedIn" class="black--text">Hi {{username}}</v-toolbar-title>
        <v-tooltip v-if="isConnected===false" bottom><template v-slot:activator="{ on, attrs }"><v-btn v-bind="attrs" v-on="on" icon><v-icon color="green" class="black--text">mdi-cloud-off-outline</v-icon></v-btn></template><span>WebSockets Disconnected</span></v-tooltip>
        <v-tooltip v-if="isConnected===true" bottom><template v-slot:activator="{ on, attrs }"><v-btn v-bind="attrs" v-on="on" icon><v-icon color="green" class="black--text">mdi-cloud-check-outline</v-icon></v-btn></template><span>WebSockets Connected</span></v-tooltip>
        <v-tooltip v-if="this.IoTConnected===false" bottom><template v-slot:activator="{ on, attrs }"><v-btn v-bind="attrs" v-on="on" icon><v-icon color="blue" class="black--text">mdi-cloud-off-outline</v-icon></v-btn></template><span>MQTT Disconnected</span></v-tooltip>
        <v-tooltip v-if="this.IoTConnected===true" bottom><template v-slot:activator="{ on, attrs }"><v-btn v-bind="attrs" v-on="on" icon><v-icon color="blue" class="black--text">mdi-cloud-check-outline</v-icon></v-btn></template><span>MQTT Connected</span></v-tooltip>
    </v-app-bar>
    <v-navigation-drawer
      v-model="drawer"
      absolute
      temporary
    >
      <v-list
        nav
        dense
      >
        <v-list-item-group
          active-class="white--text text--accent-4">
         <v-list-item @click="closemenu('home')">
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Home</v-list-item-title>
          </v-list-item>

         <v-list-item @click="closemenu('chat')">
            <v-list-item-icon>
              <v-icon>mdi-chat</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Chat</v-list-item-title>
          </v-list-item>

          <v-list-item @click="closemenu('play')">
            <v-list-item-icon>
              <v-icon>mdi-brain</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Play</v-list-item-title>
          </v-list-item>

          <v-list-item @click="closemenu('adminhost')">
            <v-list-item-icon>
              <v-icon>mdi-run-fast</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Run</v-list-item-title>
          </v-list-item>

          <v-list-item @click="closemenu('adminmanagequiz')">
            <v-list-item-icon>
              <v-icon>mdi-pencil</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Manage</v-list-item-title>
          </v-list-item>

          <v-list-item @click="closemenu('profile')">
            <v-list-item-icon>
              <v-icon>mdi-account-details</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item>

        </v-list-item-group>
      </v-list>
    </v-navigation-drawer>
    <v-container>
        <v-col cols="12">
            <v-row><v-col cols="3"></v-col><v-col cols="6"><v-img center contain src="./assets/simpletriviaservicelogo.png"/></v-col><v-col cols="2"></v-col></v-row>
      <v-row><v-col cols="3"></v-col><v-col cols="6">
          <CognitoUI v-if=!isLoggedIn :errortext=errortext :statustext=statustext 
          v-on:loginuser="loginuser" v-on:signupuser="signupuser" v-on:forgotpassword="forgotpassword"/>
      </v-col></v-row></v-col>

          <div id="app" v-if=isLoggedIn>
                    <v-container v-if="getUIMode==='home'">
                        <v-col cols="12"><v-row><v-col cols="3"></v-col>
                        <v-col cols="3"><v-card height="150px" color="accent" v-on:click="closemenu('chat')">
                            <v-card-title><v-icon>mdi-chat</v-icon>Chat</v-card-title>
                            <v-card-text>Chat with other players</v-card-text>
                        </v-card></v-col>
                        <v-col cols="3"><v-card height="150px" color="accent" v-on:click="closemenu('play')">
                            <v-card-title><v-icon>mdi-brain</v-icon>Play</v-card-title>
                            <v-card-text>Play a Game</v-card-text>
                        </v-card></v-col>
                        </v-row>
                        <v-row><v-col cols="3"></v-col>
                        <v-col cols="3"><v-card height="150px" color="accent" v-on:click="closemenu('adminmanagequiz')">
                            <v-card-title><v-icon>mdi-pencil</v-icon>Manage</v-card-title>
                            <v-card-text>Create and Edit Your Quizzes</v-card-text>
                        </v-card></v-col>
                        <v-col cols="3"><v-card height="150px" color="accent" v-on:click="closemenu('adminhost')">
                            <v-card-title><v-icon>mdi-run-fast</v-icon>Run</v-card-title>
                            <v-card-text>Host Single-player and Multiplayer Games</v-card-text>
                        </v-card></v-col>
                        </v-row>
                        <v-row><v-col cols="3"></v-col>
                        <v-col cols="3"><v-card height="150px" color="accent" v-on:click="closemenu('profile')">
                            <v-card-title><v-icon>mdi-account-details</v-icon>Profile</v-card-title>
                            <v-card-text>Manage your profile</v-card-text>
                        </v-card></v-col>
                        <v-col cols="3"><v-card height="150px" color="accent" v-on:click="closemenu('marketplace')">
                            <v-card-title><v-icon>mdi-cart</v-icon>Marketplace</v-card-title>
                            <v-card-text>Search for games to buy</v-card-text>
                        </v-card></v-col></v-row>
                        <v-row><v-col cols="3"></v-col>
                        </v-row></v-col>
                    </v-container>
                <ChatController v-if="getUIMode==='chat'" msg="send chat" v-on:send-message="sendmessage"/><br>
                <GameController v-if="getUIMode==='play'" v-on:send-raw-message="sendmessage" v-on:send-iot-message="publishIoTMessage" v-on:subscribe-iot-topic="subscribeIoTTopic"/>
                <Player v-if="getUIMode==='profile'"
                    :player-xp="playerxp" :player-level="playerlevel"
                    :player-wins="playerwins" :player-wallet="playerWallet"/>
                <AdminController v-if="getUIMode==='admin'" v-on:send-message="sendmessage" v-on:send-iot-message="publishIoTMessage" v-on:subscribe-iot-topic="subscribeIoTTopic"/>
                <Marketplace v-if="getUIMode==='marketplace'" :marketplace-listings="marketplacelist"/>
          </div>
        <v-row class="mb-6"><v-col cols="12">
            <signout v-if=isLoggedIn v-on:signout="signout"></signout>
        </v-col></v-row>
    </v-container>
    </v-app>
</template>


<script>
import GameController from "./components/GameController";
import ChatController from "./components/ChatController";
import AdminController from "./components/AdminController";
import CognitoUI from "./components/CognitoUI";
import Player from "./components/Player";
import Marketplace from "./components/Marketplace";
import Signout from './components/Signout';
import DataService from '@/services/DataServices';
import Config from '@/services/AWSConfig';
import { login, signup, triggerforgotpw, resetforgotpw, cognitosignout } from '@/services/Cognito';

const AwsIot = require('aws-iot-device-sdk');
const AWS = require('aws-sdk');

export default {
    name: 'App',
    
    metaInfo: {
        title: 'Welcome to Simple Trivia Service',
    },
    watch: {
        authState: function(val) {
            if(val==='signedin'){
                this.connect();
            }
        }
    },

    created() {
        this.timer = setInterval(this.sendping, this.$store.state.ping.seconds);
    },

    destroyed() {
        this.$store.commit('setConnected', false);
        if(!this.ws===null)
            this.ws.close();
    },
    
    components: {
        GameController,
        ChatController,
        AdminController,
        Player,
        Marketplace,
        CognitoUI,
        Signout
    },

    computed: {
        appName: function() { return Config.appName },
        username: function() { return this.$store.state.user.username},
        myjwt: function() { return this.$store.state.user.cognito.idToken.jwtToken },
        isLoggedIn: function() {if(this.authState === 'signedin') {return true;} return false;},
        isConnected: function() {return this.$store.state.ws.connected;},
        getUIMode: function() {return this.$store.state.uimode;},
        players: function() { return this.$store.state.live.admin.players},
        responses: function() { return this.$store.state.live.admin.responses},
        questionnumber: function() { return this.$store.state.live.admin.questionnumber },
        gameid: function() {return this.$store.state.live.admin.gameId; },
        blitzadmin: function() { return this.$store.state.live.admin.blitz; },
        blitzplayer: function() { return this.$store.state.live.player.blitz; },
    },

    data: function() { return {
        ws: null,
        IoTWSDevice: null,
        connectstring: Config.wsapi + '?access_token=',
        clientId: '',
        connected: false,
        authState: undefined,
        firsttime: true,
        drawer: false,
        timer: undefined,
        playerxp: 0,
        playerwins: 0,
        playerlevel: 0,
        playerWallet: 0,
        marketplacelist: undefined,
        statustext: '',
        errortext: '',
        IoTConnected: false,
        topicSubscriptions: []
    }},

    methods: {

//BEGIN: Generic IoT Function Calls
        subscribeIoTTopic(topic) {
            console.log('subscribing to ', topic);
            if(this.IoTWSDevice) {
                this.topicSubscriptions.pop(topic);
                this.IoTWSDevice.subscribe(topic);
            }
        },

        publishIoTMessage(topic, msg) {
            console.log(`${topic} ${msg}`);
            if(this.IoTWSDevice) {
                this.IoTWSDevice.publish(topic, msg, { qos: 1 }, function (err) {
                    if (err) {
                        console.error("failed to publish iot message!");
                        console.error(err);
                    } else {
                        console.log("Message Published", "Topic: " + topic, "Message: " + msg);
                    }
                });
            }
        },

        async connectIoTDevice(clientId) {
            let self = this;
            this.IoTWSDevice = AwsIot.device({
                clientId: clientId,
                host: Config.iotapi,
                protocol: 'wss',
                accessKeyId: AWS.config.credentials.accessKeyId,
                secretKey: AWS.config.credentials.secretAccessKey,
                sessionToken: AWS.config.credentials.sessionToken,
                debug: false
            });
            this.IoTWSDevice.on('connect', function () {
                console.log("MQTT connected");
                self.IoTConnected = true;
            });
            this.IoTWSDevice.on('message', function (topic, payload) {
                const msg = JSON.parse(payload.toString());
                console.log('IoT msg: ', topic, JSON.stringify(msg));
                self.handleIoTMessage(topic, msg);
            });
            this.IoTWSDevice.on('error', function(err){
                console.log('MQTT error', err);
            });
            this.IoTWSDevice.on('disconnect', function(data) {
                console.log('MQTT disconnected', JSON.stringify(data));
                self.IoTConnected = false;
            });
        },

        async attachPrincipalPolicy() {
            let principal = AWS.config.credentials.identityId;
            console.log("IdentityId: " + principal);
            let parms = { jwt: this.myjwt, identityId: principal };
            try{
                return await DataService.attachPrincipalPolicy(parms);
            } catch(err){
                console.error(JSON.stringify(err));
            }
        },

        async initIoTConnect(clientId) {
            try {
                await this.connectIoTDevice(clientId);
                return true;
            } catch(err) {
                console.log(JSON.stringify(err));
                return false;
            }
        },

        resetBlitz() {
            this.$store.commit('setUIMode', 'home');
            this.$store.commit('setLivePlayerGameId', '');
            this.$store.commit('setLivePlayerUIMode', 'lobby');                
            this.$store.commit('setPlayerLiveHost', '');
            this.$store.commit('setPlayerLiveGameKey', '');
            this.$store.commit('setPlayerLiveBlitzMode', false);
            this.$store.commit('setAdminLiveBlitzMode', false);
            this.$store.commit('setAdminLiveGameKey', '');
            this.$store.commit('setGameState', '');
            this.topicSubscriptions.forEach(topic => {
                this.IoTWSDevice.unsubscribe(topic)
            });
        },
        
        handleIoTMessage(topic, msg) {
            const main = topic.split('/');
            switch(main[2]) {
                case 'questionlist':
                    this.$store.commit('setLiveAdminQuestions', msg.questionList);
                    this.$store.commit('setLiveAdminQuizName', msg.quizName);
                    this.$store.commit('setLiveAdminGameId', msg.gameId);
                    this.$store.commit('setLiveAdminGameType', msg.quizMode);
                    this.$store.commit('setLiveAdminQuestionType', msg.questionType);
                    if(Object.keys(msg).includes('currentQuestionNumber')) {
                        this.$store.commit('setLiveAdminQuestionNumber', parseInt(msg.currentQuestionNumber, 10));
                    } else {
                        this.$store.commit('setLiveAdminQuestionNumber', 0);
                    }
                    this.$store.commit('setUIMode', 'admin');
                    this.$store.commit('setLivePlayerMode', false);
                    break;
                case 'question':
                    this.$store.commit('setBlitzQuestionWinner', '');
                    this.$store.commit('setBlitzIndividualResult', '');
                    if(this.blitzadmin) {
                        this.$store.commit('setAdminLiveBlitzQuestion', msg);
                        this.$store.commit('clearLiveBlitzPlayerResponses');
                    } else {
                        this.$store.commit('setLivePlayerUIMode', 'question');
                        this.$store.commit('clearLiveBlitzPlayerResponses');
                        this.$store.commit('setLivePlayerQuestion', msg);
                        this.$store.commit('setLivePlayerResponded', 0);
                    }
                    break;
                case 'scoreboard':
                    this.$store.commit('setLiveScoreboard', msg);
                    if(!this.blitzadmin){
                        this.$store.commit('setLivePlayerUIMode', 'scoreboard');
                    }
                    break;
                case 'answers':
                    if(this.blitzadmin){
                        this.$store.commit('setBlitzPlayerResults', msg.checked);
                    } else {
                        this.$store.commit('setBlitzIndividualResult', msg.checked)
                    } 
                    break;
                case 'results':
                    if(!this.blitzadmin){
                        this.$store.commit('setBlitzIndividualResult', msg.checked)
                    } 
                    break;
                case 'joined':
                    this.$store.commit('setBlitzPlayerCount');
                    break;
                case 'gameover':
                    this.$store.commit('setBlitzPlayerGameOver', true);
                    this.$store.commit('setLivePlayerUIMode', 'gameover');
                    break;
                case 'playercorrect':
                    this.$store.commit('setBlitzQuestionWinner', msg.firstCorrectAnswer);
                    break;
                case 'endthegame':
                    this.resetBlitz();
                    break;
                default:
                    console.log(`unhandled ${topic} - ${JSON.stringify(msg)}`);
                    console.log(main[2]);
                    console.log(main[3]);
                    break;
            }
        },

        setIoTConnected(status) {
            this.IoTConnected = status;
        },

//END: Genericized IoT Function Calls and Handlers

//BEGIN: Genericized WebSocket Calls and Handlers
        async connect() {
            let self = this;
            if(!this.$store.state.ws.connected) {
                this.ws = new WebSocket(this.connectstring+self.myjwt);
                this.ws.addEventListener('open', function (event) {
                    if(event.type=='open') {
                        self.systemChat('Connection to ws server made');
                        self.$store.commit('setConnected', true);
                        console.log('WS connected');
                        if(self.firsttime) {
                            console.log('setting up ws listeners');
                            self.ws.addEventListener('message', function (event) {
                                console.log('inbound---' + JSON.stringify(event.data));
                                let msg = JSON.parse(event.data);
                                self.handlemsg(msg);
                            });
                            self.ws.addEventListener('error', function(event) {
                                console.log(JSON.stringify(event));
                                self.ws.close();
                                self.$store.commit('setConnected', false);
                                self.connect();
                            });
                            self.ws.addEventListener('close', function(event) {
                                console.log(JSON.stringify(event));
                                self.$store.commit('setConnected', false);
                            });
                            self.ws.addEventListener('pong', function() {
                                console.log(`got a pong`);
                            });
                            self.firsttime=false;
                        }
                    } else {
                        self.$store.commit('setSystemChat', 'Could not connect to ws server');
                        self.$store.commit('setConnected', false);
                }});
            }

            this.clientId = 'simpletrivia-' + this.username;
            console.log('clientId', this.clientId);

            if(!this.$store.state.mqtt.connected) {
                if(await this.attachPrincipalPolicy()){
                    console.log('trying to connect to iot');
                    if(!await this.initIoTConnect(this.clientId)) {
                        console.error('error attaching to MQTT WS');
                    }
                }
            }
            
        },

        sendmessage(msg) {
            console.log("outbound--" + msg);
            if(this.ws.readyState===1) {
                try {
                    this.ws.send(msg);
                } catch(e) {
                    console.log(JSON.stringify(e));
                    this.ws.close();
                    self.$store.commit('setConnected', false);
                    this.connect();
                }
            } else {
                console.log(this.ws.readyState);
                alert('currently not connected!');  
                this.ws.close();
                this.connect();
            }
        },

        handlemsg(msg) {
            console.log('trying to handle incoming ', JSON.stringify(msg));
            switch(msg.channel) {
                case 'globalchat':
                    this.$store.commit('setGlobalChat', msg.message);
                    break;
                case 'localchat':
                    this.$store.commit('setLocalChat', msg.message);
                    break;
                case 'system':
                    this.$store.commit('setSystemChat', msg.message);
                    break;
                case 'pong':
                    break;
                case 'livestart':
                    this.livestart(msg);
                    break;
                case 'joinedlive':
                    this.joinedlive(msg.message);
                    break;
                case 'liveplayer':
                    //allmessages to live players
                    switch(msg.message.action) {
                        case 'joined':
                            this.playerjoined(msg.message);
                            break;
                        case 'answered':
                            this.playeranswered(msg.message);
                            break;
                    }
                    break;
                case 'liveadmin':
                    //all messages to live admin
                    switch(msg.message.action) {
                        case 'startgame':
                            this.startgame(msg.message);
                            break;
                        case 'question':
                            this.livequestion(msg.message);
                            break;
                        case 'scoreboard':
                            this.livescoreboard(msg.message);
                            break;
                        case 'answerboard':
                            this.liveanswerboard(msg.message);
                            break;
                        case 'reset':
                            this.resetliveplayer();
                            break;
                        case 'status':
                            this.updatelivestatus(msg.message);
                            break;
                    }
                    break;
                default:
                    console.log('unhandled message');
                    console.log(JSON.parse(event.data));
            }
        },
//END

//BEGIN Game / UI Management

        setAuthState(state) {
            this.authState = state;
        },

        systemChat(msg) {
            this.$store.commit('setSystemChat', msg)
        },

        showScoreboard(msg) {
            this.$store.commit('setSystemChat', 'Showing Scoreboard');
            this.$store.commit('setQuizName', msg.quizName);
            this.$store.commit('setScoreboard', msg.scoreboard);
            this.$store.commit('setGameState', 'scoreboard');
        },
        
        async setupScoreboardList() {
            this.cleargameinfo();
            let results = await this.listGames();
            this.$store.commit('setGameList', results.data);
            this.$store.commit('setGameState', 'scoreboard');
        },

        setmode(payload) {
            if(payload==='join'){
                this.cleargameinfo();
            }
            this.$store.commit('setGameState', payload);
        },

        changemode() {
            switch(this.$store.state.gamemode) {
                case 'join':
                    this.cleargameinfo();
                    this.$store.commit('setGameState', 'quiz');
                    break;
                case 'quiz':
                    this.$store.commit('setGameState', 'scoreboard');
                    break;
                case 'scoreboard':
                    this.$store.commit('setGameState', 'join');
                    break;
            }
        },

//BEGIN API Calls
        async listHostGames() {
            let parms = { uri: '/players/' + this.username + '/games',
                        jwt:this.myjwt};
            let results = await DataService.getMyGameList(parms);
            this.$store.commit('setHostGameList', results.data);
            this.$store.commit('setHostGameMode', 'showlist');
            this.$store.commit('setAdminMode','showlist')
        },

        async listMyGames() {
            let parms = {uri: '/players/' + this.username + '/games', jwt: this.myjwt};
            let results = await DataService.getMyGameList(parms);
            this.$store.commit('setAdminGameList', results.data);
            this.$store.commit('setAdminMode','showadminlist')
        },

        async listGames() {
            this.cleargameinfo();
            let results = await DataService.getActiveGameList({jwt: this.myjwt});
            return results;
        },

        gamestarted(message) {
            if(message.data.quizMode==='Single Player') {
                this.$store.commit('setHostGameMode', 'showlist');
            } else {
                this.$store.commit('setHostGameMode', 'livemode');
            }
        },

        sendping() {
            if(this.$store.state.ws.connected) {
                console.log('sending ping');
                let msg = {message:'ping'};
                this.ws.send(JSON.stringify(msg));
            }
        },

        cleargameinfo() {
                this.$store.commit('setQuestions', {});
                this.$store.commit('setScoreboard', []);
                this.$store.commit('setQuizName','');
                this.$store.commit('setGameId', '');
                this.$store.commit('setLivePlayerResponded', 0);
        },

        async closemenu(menuitem) {
            this.drawer = false;
            let uimode = '';
            let results;
            switch(menuitem) {
                case 'chat':
                    uimode='chat';
                    break;
                case 'play':
                    this.cleargameinfo();
                    results = await this.listGames();
                    this.$store.commit('setGameList', results.data);
                    this.$store.commit('setGameState', 'showgames');
                    uimode = 'play';
                    break;
                case 'adminhost':
                    this.listHostGames();
                    uimode='admin';
                    break;
                case 'adminnewquiz':
                    uimode='admin';
                    this.$store.commit('setAdminMode','showheader')
                    break;
                case 'adminmanagequiz':
                    await this.listMyGames();
                    uimode='admin';
                    break;
                case 'scoreboard':
                    this.setupScoreboardList();
                    uimode = 'play';
                    break;
                case 'home':
                    uimode = 'home';
                    break;
                case 'profile':
                    this.setupProfile();
                    uimode = 'profile';
                    break;
                case 'marketplace':
                    await this.loadMarketplace();
                    uimode = 'marketplace';
                    break;
                default:
                    console.log(menuitem);
            }
            this.$store.commit('setUIMode', uimode);
            this.$store.commit('setLivePlayerMode', false);
        },

        async setupProfile() {
            let parms = {jwt: this.myjwt, playerName: this.username};
            let results = await DataService.getPlayer(parms);
            if(results.status===200){
                this.$store.commit('setProfileLocation', results.data.location);
                this.$store.commit('setProfileName', results.data.realName);
            }
            parms = {jwt: this.myjwt, playerName: this.username};
            results = await DataService.getPlayerProgress(parms);
            if(results.status===200){
                this.playerxp = results.data.experience;
                this.playerwins = results.data.wins;
                this.playerlevel = results.data.level;
            }
            parms = {jwt: this.myjwt, playerName: this.username};
            results = await DataService.getPlayerWallet(parms);
            if(results.status===200){
                this.playerWallet = results.data.amount;
            }
        },

        async loadMarketplace() {
            let parms = {jwt: this.myjwt};
            let results = await DataService.loadMarketplace(parms);
            if(results.status===200){
                this.marketplacelist = results.data;
            }
        },

        livestart(msg) {
            this.$store.commit('setHostGameMode', 'getlist');
            this.$store.commit('setLiveAdminLive', true);
            this.$store.commit('setLiveAdminUIMode', 'lobby');
            this.$store.commit('setLiveAdminQuestions', msg.questions);
            this.$store.commit('setLiveAdminQuizName', msg.quizname);
            this.$store.commit('setLiveAdminGameId', msg.gameId);
            this.$store.commit('setLiveAdminGameType', msg.quizMode);
            this.$store.commit('setLiveAdminQuestionType', msg.questionType);
        },

        playerjoined(msg) {
            this.$store.commit('addLiveAdminPlayer', msg.playerName);
            let data = { subaction: 'status', gameId: this.gameId, 
                statusType: 'Player Joined', statusContent: msg.PlayerName };
            let outmsg = {message:'liveadmin', data: data};
            this.sendmessage(JSON.stringify(outmsg));
        },

        playeranswered(msg) {
            for(let i = 0; i < this.players.length; i++) {
                if(this.players[i].playerName===msg.playerName) {
                    msg.playerIndex = i;
                    msg.questionIndex = this.questionnumber - 1;
                    this.$store.commit('addLiveAdminPlayerAnswered', msg);
                    break;
                }
            }
            this.$store.commit('setLiveAdminPlayersAnswered', this.responses+1 )
            let data = {}
            data.subaction = 'status';
            data.gameId = msg.gameId;
            data.statusType = 'Player Answered';
            data.statusContent = msg.playerName;
            let outmsg = {message: 'liveadmin', data};
            this.sendmessage(JSON.stringify(outmsg));
        },

        joinedlive(msg) {
            this.$store.commit('setLivePlayerGameId', msg.gameId);
            this.$store.commit('setLivePlayerQuizName', msg.quizName);
        },

        startgame(msg) {
            this.$store.commit('setLivePlayerScoreboard', msg.scoreboard )
            this.$store.commit('setLivePlayerUIMode', 'getready');
        },

        livequestion(msg) {
            this.$store.commit('setLivePlayerUIMode', 'question');
            this.$store.commit('setLivePlayerQuestion', msg);
            this.$store.commit('setLivePlayerResponded', 0);
        },

        livescoreboard(msg) {
            this.$store.commit('setLivePlayerUIMode', 'scoreboard');
            this.$store.commit('setLivePlayerAnswer', msg.correctAnswer);
            this.$store.commit('setLivePlayerAlternatives', msg.alternativeAnswers);
            this.$store.commit('setLivePlayerFollowup', msg.answerFollowup);
            this.$store.commit('setLivePlayerScoreboard', msg.scoreboard);
            this.$store.commit('setLivePlayerGameType', msg.gametype);
            this.$store.commit('setLivePlayerResponded', 0);
            this.$store.commit('setLivePlayerScoreboardNote', msg.note);
        },

        liveanswerboard(msg) {
            this.$store.commit('setLivePlayerUIMode', 'answerboard');
            this.$store.commit('setLivePlayerAnswerBoard', msg.questions);
            this.$store.commit('setLivePlayerQuestionGroup', msg.questionGroup);
            this.$store.commit('setLivePlayerResponded', 0);
        },

        updatelivestatus(msg) {
            if(msg.statusType === 'Player Answered') {
                this.$store.commit('setLivePlayerResponded',msg.statusContent);
            }
        },

        liveendgame(msg) {
            this.$store.commit('setLivePlayerUIMode', 'end');
            this.$store.commit('setLivePlayerScoreboard', msg.scoreboard);
        }, 

        resetliveplayer() {
            this.$store.commit('setLivePlayerUIMode', '');
            this.$store.commit('setLivePlayerScoreboard', '');
            this.$store.commit('setLivePlayerQuestion', '');
            this.$store.commit('setGameState', 'list');
            this.$store.commit('setLivePlayerMode', false);
            this.$store.commit('setUIMode','home');
        },

        validateemail(email) {
            let check = /\S+@\S+\.\S+/;
            return check.test(email);
        },

        loginuser(username, password) {
            this.statustext = '';
            this.errortext = '';
            if(username === '') {
                this.errortext = 'Please enter your username';
                return;
            }
            if(password === '') {
                this.errortext = 'Please enter your password';
                return;
            }

            var self = this;
            login(username, password)
            .then(function(userData) {
                self.$store.commit('setUserCognito', userData.cognitoSession);
                self.$store.commit('setUserName', userData.userObj.username);
                self.setAuthState('signedin');
            })
            .catch(function(error) {
                self.errortext = error;
            });
        },

        async signupuser(username, password, password1, email) {
            this.statustext = '';
            this.errortext = '';
            if(password !== password1) {
                this.errortext = 'Passwords do not match';
                return;
            }
            if(password === '') {
                this.errortext = 'Must provide a password';
                return
            }
            if(username === '') {
                this.errortext = 'Must fill in username';
                return;
            }
            if(!this.validateemail(email)) {
                this.errortext = 'Must use a valid email address';
                return;
            }
            var self = this;
            signup(username, password, email)
            .then(function(username){
                self.statustext = `${username} is now registered.`;
            })
            .catch(function(err){
                self.errortext = err.message; 
            })
        },

        async forgotpassword(username) {
            var self = this;
            this.statustext = '';
            this.errortext = '';
            if(username==='') {
                this.errortext = 'Please enter your username';
                return;
            }

            triggerforgotpw(username)
            .then(function(data){
                self.statustext = data;
            })
            .catch(function(err){
                self.errortext = err.message || JSON.stringify(err);
            });
        },

        async resetforgotpassword(username, code, password) {
            var self = this;
            this.statustext = '';
            this.errortext = '';
            resetforgotpw(username, code, password)
            .then(function(data){
                if(data===true)
                    self.statustext = 'Password updated';
            })
            .catch(function(err){
                self.errortext = err.message || JSON.stringify(err);                
            })
        },

        async signout() {
            this.disconnectSockets();
            this.$store.commit('setUserCognito', null);
            this.$store.commit('setUserName', '');
            this.setAuthState('');
            await cognitosignout();
        },

        clearCognitoLocalStorage() {
          let len = localStorage.length;
          for (let i = 0; i < len; i += 1, len = localStorage.length) {
            const key = localStorage.key(i);
            if (key.includes('CognitoIdentityServiceProvider') || key.includes('aws.cognito.identity')) {
                localStorage.removeItem(key);
                }
            }
        },

        disconnectSockets(){

        }
    }
}

</script>