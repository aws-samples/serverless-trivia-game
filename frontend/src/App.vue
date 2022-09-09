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
        title=""
    >   
        <v-toolbar-title @click="closemenu('home')" class="black--text"><v-icon>mdi-home</v-icon>Welcome to {{ appName }}</v-toolbar-title>
        <v-spacer></v-spacer>
<!--        <v-avatar color="accent" size="24" v-if="isLoggedIn()" class="mr-2">
            <img v-if="avatar" :src="avatar" :alt="username"/>
            <v-icon v-else dark>mdi-account-circle</v-icon>
        </v-avatar>-->
        <v-toolbar-title v-if="isLoggedIn" class="black--text">Hi {{ username }}</v-toolbar-title>
        <v-tooltip v-if="isConnected===false" bottom><template v-slot:activator="{ on, attrs }"><v-btn v-bind="attrs" icon><v-icon color="green" class="black--text">mdi-cloud-off-outline</v-icon></v-btn></template><span>WebSockets Disconnected</span></v-tooltip>
        <v-tooltip v-if="isConnected===true" bottom><template v-slot:activator="{ on, attrs }"><v-btn v-bind="attrs" icon><v-icon color="green" class="black--text">mdi-cloud-check-outline</v-icon></v-btn></template><span>WebSockets Connected</span></v-tooltip>
        <v-tooltip v-if="isIoTConnected===false" bottom><template v-slot:activator="{ on, attrs }"><v-btn v-bind="attrs" vicon><v-icon color="blue" class="black--text">mdi-cloud-off-outline</v-icon></v-btn></template><span>MQTT Disconnected</span></v-tooltip>
        <v-tooltip v-if="isIoTConnected===true" bottom><template v-slot:activator="{ on, attrs }"><v-btn v-bind="attrs" icon><v-icon color="blue" class="black--text">mdi-cloud-check-outline</v-icon></v-btn></template><span>MQTT Connected</span></v-tooltip>
    </v-app-bar>
    <v-container>
        <v-col cols="12">
            <v-row><v-col cols="3"></v-col><v-col cols="6"><v-img name='logo' center :src="imgLogo"/></v-col><v-col cols="2"></v-col></v-row>
      <v-row><v-col cols="3"></v-col><v-col cols="6">
          <CognitoUI v-if=!isLoggedIn v-on:loginuser="loginuser" v-on:signupuser="signupuser" v-on:forgotpassword="forgotpassword"/>
      </v-col><v-col cols=3></v-col></v-row></v-col>
          <div id="app" v-if=isLoggedIn>
                    <!-- TODO: Add this back in <Notifications /> -->
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
                <ChatController v-if="getUIMode==='chat'" msg="send chat" v-on:send-iot-message="publishIoTMessage"/><br>
                <GameController v-if="getUIMode==='play'" v-on:send-raw-message="sendmessage" v-on:send-iot-message="publishIoTMessage" v-on:subscribe-iot-topic="subscribeIoTTopic"/>
                <Player v-if="getUIMode==='profile'"/>
                <AdminController v-if="getUIMode==='admin'" v-on:send-message="sendmessage" v-on:send-iot-message="publishIoTMessage" v-on:subscribe-iot-topic="subscribeIoTTopic"/>
                <Marketplace v-if="getUIMode==='marketplace'" :marketplace-listings="marketplacelist"/>
          </div>
        <v-row class="mb-6"><v-col cols="12">
            <signout v-if=isLoggedIn v-on:signout="signout"></signout>
        </v-col></v-row>
        <v-img name='logo' center src="imgLogo"/>

    </v-container>
    </v-app>
</template>


<script>
import { reactive, defineComponent } from 'vue'
import CognitoUI from './components/CognitoUI.vue'
import GameController from './components/GameController.vue'
import ChatController from './components/ChatController.vue'
import AdminController from './components/AdminController.vue'
import Player from './components/Player.vue'
//import Notifications from './components/Notifications.vue'
import Marketplace from './components/Marketplace.vue'
import Signout from './components/Signout.vue'
import { DataService } from '@/services/DataServices.js'
import { AWSConfig } from '@/services/AWSConfig.js';
import { login, signup, triggerforgotpw, resetforgotpw, cognitosignout } from '@/services/Cognito.js';
import * as AwsIot from 'aws-iot-device-sdk'
import * as AWS from 'aws-sdk'
import { useGameStore } from '@/stores/game.js'
import * as imgLogo from '@/assets/simpletrivaservicelogo.png'

export default defineComponent({
    name: 'App',
    components: {
      GameController: GameController,
      ChatController: ChatController,
      AdminController: AdminController,
      CognitoUI: CognitoUI,
      Player: Player,
//      Notifications: Notifications,
      Marketplace: Marketplace,
      Signout: Signout
    },
    metaInfo: {
        title: 'Welcome to Simple Trivia Service',
    },
    watch: {
        authState: function(val) {
            console.log(`got authstate of ${val}`)
            if(val==='signedin'){
                this.connect();
            }
        }
    },
    setup() {
      const gameStore = useGameStore()

      window.stores = { gameStore }
      const ws = null
      const IoTWSDevice = null
      const connectstring = AWSConfig.wsapi + '?access_token='
      const clientId = ''
      const connected = false
      const firsttime = true
      const drawer = false
      const timer = undefined
      const playerxp = 0
      const playerwins = 0
      const playerlevel = 0
      const playerWallet = 0
      const marketplacelist = undefined
      const topicSubscriptions = []


      return {
        gameStore,
        ws,
        IoTWSDevice,
        connectstring,
        clientId,
        connected,
        firsttime,
        drawer,
        timer,
        playerxp,
        playerwins,
        playerlevel,
        playerWallet,
        marketplacelist,
        topicSubscriptions,
        imgLogo
      }
    },

    computed: {
        appName: function() { return AWSConfig.appName },
        username: function() { 
          const gameStore = useGameStore()
          return gameStore.user.username},
        avatar: function() { 
          const gameStore = useGameStore()
          return gameStore.user.picture},
        myjwt: function() { 
          const gameStore = useGameStore()
          return gameStore.user.cognito.idToken.jwtToken},
        isLoggedIn: function() {
          const gameStore = useGameStore()
          return gameStore.cognito.authState === 'signedin'
          },
        isConnected: function() {
          const gameStore = useGameStore()
          return gameStore.ws.connected},
        isIoTConnected: function() {
          const gameStore = useGameStore()
          return gameStore.mqtt.connected},
        getUIMode: function() {
          const gameStore = useGameStore()
          return gameStore.uimode},
        players: function() { 
          const gameStore = useGameStore()
          return gameStore.live.admin.players},
        responses: function() { 
          const gameStore = useGameStore()
          return gameStore.live.admin.responses},
        questionnumber: function() { 
          const gameStore = useGameStore()
          return gameStore.live.admin.questionnumber},
        gameid: function() {
          const gameStore = useGameStore()
          return gameStore.live.admin.gameId; },
        blitzadmin: function() { 
          const gameStore = useGameStore()
          return gameStore.live.admin.blitz; },
        blitzplayer: function() { 
          const gameStore = useGameStore()
          return gameStore.live.player.blitz; },
    },

    created() {
        //TODO: need a fix for this line
        //this.timer = setInterval(this.sendping, gameStore.state.ping.seconds);
    },

    data: () => ({
      items: [
        { text: 'Home', icon: 'mdi-home', action:'home'},
        { text: 'Chat', icon: 'mdi-chat', action:'chat'},
        { text: 'Play', icon: 'mdi-brain', action:'play'},
        { text: 'Run', icon: 'mdi-run-fast', action:'run'},
        { text: 'Manage', icon: 'mdi-pencil', action:'manage'},      
        { text: 'Account Details', icon: 'mdi-account-details', action:'chat'},
      ],
      authState: '',
      IoTConnected: false
    }),
    methods: {

    async closemenu(menuitem) {
        const gameStore = useGameStore()
        this.drawer = false
        let uimode = ''
        switch(menuitem) {
            case 'chat':
                uimode='chat'
                break
            case 'play':
                this.cleargameinfo()
                gameStore.games.gamelist = []
                gameStore.gamemode = 'showgames'
/*                 this.$store.commit('setGameList', [])
                this.$store.commit('setGameState', 'showgames')
 */                uimode = 'play'
                break
            case 'adminhost':
                await this.listHostGames();
                uimode='admin'
                break
            case 'adminnewquiz':
                uimode='admin'
                gameStore.adminmode = 'showheader'
                //this.$store.commit('setAdminMode','showheader')
                break
            case 'adminmanagequiz':
                await this.listMyGames()
                uimode='admin'
                break
            case 'scoreboard':
                this.setupScoreboardList()
                uimode = 'play'
                break
            case 'home':
                uimode = 'home'
                break
            case 'profile':
                await this.setupProfile()
                uimode = 'profile'
                break
            case 'marketplace':
                await this.loadMarketplace()
                uimode = 'marketplace'
                break
            default:
                console.log(menuitem)
        }
        gameStore.uimode = uimode
        console.info(` setting ${gameStore.uimode}`)
        gameStore.live.player.live = false
/*        this.$store.commit('setUIMode', uimode)
        this.$store.commit('setLivePlayerMode', false);*/
    },


//BEGIN Game / UI Management

      setAuthState(state) {
        const gameStore = useGameStore() 
        gameStore.cognito.authState = state
        this.authState = gameStore.cognito.authState
        console.info(`${gameStore.cognito.authState}`)
        //TODO: Add in connect() if state === loggedin
      },

      async signout() {
        const gameStore = useGameStore() 
        this.ws = null
        this.IoTWSDevice = null
        gameStore.user.cognito = null
        gameStore.user.username = ''
        gameStore.ws.connected = false
        gameStore.mqtt.connected = false
        this.$store.commit('setUserCognito', null)
        this.$store.commit('setUserName', '')
        this.setAuthState('')
        await cognitosignout()
      },

      //Cognito Functions
      validateemail(email) {
        let check = /\S+@\S+\.\S+/;
        return check.test(email);
      },

      clearCognitoMessages() {
        const gameStore = useGameStore()        
        gameStore.cognito.statustext = ''
        gameStore.cognito.status = false
        gameStore.cognito.errortext = ''
        gameStore.cognito.error = false
      },

      async signupuser(parms) {
        const gameStore = useGameStore()        
        this.clearCognitoMessages()
        if(parms.password1 !== parms.password2) {
            gameStore.cognito.error = true
            gameStore.cognito.errortext = 'Passwords do not match'
            return
        }
        if(parms.password1 === '' || parms.password1 === undefined) {
            gameStore.cognito.error = true
            gameStore.cognito.errortext = 'Must provide a password'
            return
        }
        if(parms.userName === '' || parms.userName === undefined) {
            gameStore.cognito.error = true
            gameStore.cognito.errortext = 'Must fill in username'
            return
        }
        if(!this.validateemail(parms.email)) {
            gameStore.cognito.error = true
            gameStore.cognito.errortext = 'Must use a valid email address'
            return
        }
        signup(parms.userName, parms.password1, parms.email)
        .then(function(username){
            gameStore.cognito.statustext = `${username} is now registered.`
            gameStore.cognito.status = true
        })
        .catch(function(err){
            gameStore.cognito.errortext = err.message
            gameStore.cognito.error = true
        })
      },

      async loginuser(parms) {
        const gameStore = useGameStore()
        this.clearCognitoMessages()
        if(parms.userName === '') {
          gameStore.cognito.errortext = 'Please enter your username'
          gameStore.cognito.error = true
          return
        }
        if(parms.password === '') {
          gameStore.cognito.errortext = 'Please enter your password'
          gameStore.cognito.error = true
          return
        }

        var self = this;
        login(parms.userName, parms.password)
        .then(function(userData) {
          gameStore.user.cognito = userData.cognitoSession
          gameStore.user.username = userData.userObj.username
          gameStore.user.picture = userData.userObj.picture
          self.clearCognitoMessages()
          self.setAuthState('signedin')
        })
        .catch(function(error) {
          gameStore.cognito.errortext = error
          gameStore.cognito.error = true
        })
      },

      async forgotpassword(username) {
//        var self = this;
        const gameStore = useGameStore()        
        this.clearCognitoMessages()
        if(username==='') {
            gameStore.cognito.errortext = 'Please enter your username'
            gameStore.cognito.error = true
            return
        }

        triggerforgotpw(username)
          .then(function(data){
              gameStore.cognito.statustext = data
              gameStore.cogntio.status = true
          })
          .catch(function(err){
              gameStore.cognito.errortext = err.message || JSON.stringify(err)
              gameStore.cognito.error = true
          })
      },

      async resetforgotpassword(username, code, password) {
//        var self = this;
        const gameStore = useGameStore()        
        this.clearCognitoMessages()
        resetforgotpw(username, code, password)
        .then(function(data){
            if(data===true)
                gameStore.cognito.statustext = 'Password updated'
                gameStore.cognito.status = true
        })
        .catch(function(err){
            gameStore.cognito.errortext = err.message || JSON.stringify(err)
            gameStore.cognito.error = true
        })
      },

      async signout() {
        const gameStore = useGameStore()
        this.ws.close()
        gameStore.ws.connected = false
        gameStore.user.cognito = null
        gameStore.user.username = ''
        this.IoTWSDevice = null
        gameStore.mqtt.connected = false
        this.setAuthState('notLoggedIn')
        await cognitosignout()
      },

      clearCognitoLocalStorage() {
        let len = localStorage.length;
        for (let i = 0; i < len; i += 1, len = localStorage.length) {
          const key = localStorage.key(i)
          if (key.includes('CognitoIdentityServiceProvider') || key.includes('aws.cognito.identity')) {
              localStorage.removeItem(key)
              }
          }
      },

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
                      console.info("Message Published", "Topic: " + topic, "Message: " + msg);
                  }
              });
          }
      },

      async connectIoTDevice(clientId) {
          const gameStore = useGameStore()
          let self = this;
          this.IoTWSDevice = AwsIot.device({
              clientId: clientId,
              host: AWSConfig.iotapi,
              protocol: 'wss',
              accessKeyId: AWS.config.credentials.accessKeyId,
              secretKey: AWS.config.credentials.secretAccessKey,
              sessionToken: AWS.config.credentials.sessionToken,
              debug: false
          });
          this.IoTWSDevice.on('connect', function () {
              console.info("MQTT connected");
              gameStore.mqtt.connected = true
          });
          this.IoTWSDevice.on('message', function (topic, payload) {
              const msg = JSON.parse(payload.toString());
              console.info('IoT msg: ', topic, JSON.stringify(msg));
              self.handleIoTMessage(topic, msg);
          });
          this.IoTWSDevice.on('error', function(err){
              console.error('MQTT error', err);
          });
          this.IoTWSDevice.on('disconnect', function(data) {
              console.info('MQTT disconnected', JSON.stringify(data));
              gameStore.mqtt.connected = false;
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
          }z
      },

      resetBlitz() {
          const gameStore = useGameStore()
          gameStore.uimode = 'home'
          gameStore.live.player.gameid = ''
          gameStore.live.player.uimode = 'lobby'
          gameStore.live.player.host = ''
          gameStore.live.player.gameKey = ''
          gameStore.live.player.blitz = false
          gameStore.live.admin.blitz = false
          gameStore.live.admin.gameKey = ''
          gameStore.gamemode = ''
          this.topicSubscriptions.forEach(topic => {
              this.IoTWSDevice.unsubscribe(topic)
          })
      },
      
      handleIoTMessage(topic, msg) {
        const gameStore = useGameStore()
        const main = topic.split('/');
        if(main.length>2) {
            switch(main[2]) {
                case 'questionlist':
                    gameStore.live.admin.questions = msg.questionList
                    gameStore.live.admin.quizName = msg.quizName
                    gameStore.live.admin.gameId = msg.gameId
                    gameStore.live.admin.gameType = msg.quizMode
                    gameStore.live.admin.questionType = msg.questionType
                    if(Object.keys(msg).includes('currentQuestionNumber')) {
                        gameStore.live.admin.questionnumber = parseInt(msg.currentQuestionNumber, 10)
                    } else {
                        gameStore.live.admin.questionnumber = 0
                    }
                    gameStore.uimode = 'admin'
                    gameStore.live.player.live = false
                    break
                case 'question':
                    gameStore.live.blitz.questionwinner = ''
                    gameStore.live.blitz.myResult = ''
                    if(this.blitzadmin) {
                        gameStore.live.admin.question = msg
                        gameStore.live.blitz.responses = 0
                        gameStore.live.blitz.correct = 0
                    } else {
                        gameStore.live.player.uimode = 'question'
                        gameStore.live.blitz.responses = 0
                        gameStore.live.blitz.correct = 0
                        gameStore.live.player.question = msg
                        gameStore.live.player.playersresponded = []
                        gameStore.live.player.playersresponded.length = 0
                    }
                    break
                case 'scoreboard':
                    gameStore.live.scoreboard = msg
                    if(!this.blitzadmin){
                        gameStore.live.player.uimode = 'scoreboard'
                    }
                    break
                case 'answers':
                    if(this.blitzadmin){
                      gameStore.live.blitz.responses += 1
                      if(msg.checked=='correct answer'){
                          gameStore.live.blitz.correct += 1
                      }                        
                    } else {
                        gameStore.live.blitz.myResult = msg.checked
                    } 
                    break
                case 'results':
                    if(!this.blitzadmin){
                      gameStore.live.blitz.myResult = msg.checked
                    } 
                    break
                case 'join':
                    gameStore.live.blitz.playerCount += 1
                    break
                case 'gameover':
                    gameStore.live.blitz.gameOver = true
                    gameStore.live.player.uimode = 'gameover'
                    break
                case 'playercorrect':
                    gameStore.live.blitz.questionwinner = msg.firstCorrectAnswer
                    break
                case 'endthegame':
                    this.resetBlitz();
                    break;
                default:
                    console.log(`unhandled ${topic} - ${JSON.stringify(msg)}`);
                    console.log(main[2]);
                    console.log(main[3]);
                    break;
                } 
            } else {
                switch(main[1]) {
                    case 'globalchat':
                    console.log(msg.message);
                    gameStore.chat.global.unshift(msg.message + "\r\n")
                    break;
                default:
                    console.log(`unhandled ${topic} - ${JSON.stringify(msg)}`);
                    console.log(main[1])
                    break;
                }
            }
      },

      setIoTConnected(status) {
          const gameStore = useGameStore()
          gameStore.mqtt.connected = status;
      },

  //END: Genericized IoT Function Calls and Handlers

  //BEGIN: Genericized WebSocket Calls and Handlers
      async connect() {
          console.log(`connect is called`)
          const gameStore = useGameStore()
          let self = this;
          if(!gameStore.ws.connected) {
              this.ws = new WebSocket(this.connectstring+self.myjwt);
              this.ws.addEventListener('open', function (event) {
                  if(event.type=='open') {
                      self.systemChat('Connection to ws server made');
                      gameStore.ws.connected = true
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
                              gameStore.ws.connected = false
                              self.connect();
                          });
                          self.ws.addEventListener('close', function(event) {
                              console.log(JSON.stringify(event));
                              gameStore.ws.connected = false
                          });
                          self.ws.addEventListener('pong', function() {
                              console.log(`got a pong`);
                          });
                          self.firsttime=false;
                      }
                  } else {
                      gameStore.system.unshift('Could not connect to ws server\r\n')
                      gameStore.ws.connected = false
              }});
          }

          this.clientId = 'simpletrivia-' + this.username;
          console.log('clientId', this.clientId);

          if(!gameStore.mqtt.connected) {
              if(await this.attachPrincipalPolicy()){
                  console.log('trying to connect to iot');
                  if(!await this.initIoTConnect(this.clientId)) {
                      console.error('error attaching to MQTT WS');
                  }
                  this.subscribeIoTTopic("chat/globalchat")
              }
          }
          
      },

      sendmessage(msg) {
          const gameStore = useGameStore()
          console.log("outbound--" + msg);
          if(this.ws.readyState===1) {
              try {
                  this.ws.send(msg);
              } catch(e) {
                  console.log(JSON.stringify(e));
                  this.ws.close();
                  gameStore.ws.connected = false
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
          const gameStore = useGameStore()
          switch(msg.channel) {
              case 'globalchat':
                  gameStore.chat.global.unshift(msg.message + "\r\n")
                  break
              case 'localchat':
                  gameStore.chat.local.unshift(msg.message + "\r\n")
                  break
              case 'system':
                  gameStore.chat.system.unshift(msg.message + "\r\n")
                  break
              case 'pong':
                  break
              case 'livestart':
                  this.livestart(msg)
                  break
              case 'joinedlive':
                  this.joinedlive(msg.message)
                  break
              case 'liveplayer':
                  //allmessages to live players
                  switch(msg.message.action) {
                      case 'joined':
                          this.playerjoined(msg.message)
                          break
                      case 'answered':
                          this.playeranswered(msg.message)
                          break
                  }
                  break
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

      systemChat(msg) {
        const gameStore = useGameStore()
        gameStore.system.unshift(msg + "\r\n")
      },

      showScoreboard(msg) {
        const gameStore = useGameStore()
        gameStore.system.unshift('Showing Scoreboard' + "\r\n")
        gameStore.game.quizName = msg.quizName
        gameStore.scoreboard.players = msg.scoreboard
        gameStore.gamemode = 'scoreboard'
      },
      
      async setupScoreboardList() {
        const gameStore = useGameStore()
        this.cleargameinfo()
        let results = await this.listGames()
        gameStore.games.gamelist =  results.data
        gameStore.gamemode = 'scoreboard'
      },

      setmode(payload) {
        const gameStore = useGameStore()
        if(payload==='join'){
            this.cleargameinfo()
        }
        gameStore.gamemode = payload
      },

      changemode() {
        const gameStore = useGameStore()
        switch(gameStore.gamemode) {
            case 'join':
                this.cleargameinfo()
                gameStore.gamemode = 'quiz'
                break
            case 'quiz':
                gameStore.gamemode = 'scoreboard'
                break
            case 'scoreboard':
                gameStore.gamemode = 'join'
                break
        }
      },

  //BEGIN API Calls
      async listHostGames() {
        const gameStore = useGameStore()
        let parms = { uri: '/players/' + this.username + '/games',
                    jwt:this.myjwt}
        let results = await DataService.getMyGameList(parms)
        gameStore.admin.hostgames.gamelist = results.data
        gameStore.admin.hostgames.mode = 'showlist'
        gameStore.adminmode = 'showlist'
      },

      async listMyGames() {
        const gameStore = useGameStore()
        let parms = {uri: '/players/' + this.username + '/games', jwt: this.myjwt}
        let results = await DataService.getMyGameList(parms)
        gameStore.admin.gamelist = results.data
        gameStore.adminmode = 'showadminlist'
      },

      async listGames() {
        this.cleargameinfo()
        let results = await DataService.getActiveGameList({jwt: this.myjwt()})
        return results
      },

      gamestarted(message) {
        const gameStore = useGameStore()
        if(message.data.quizMode==='Single Player') {
            gameStore.admin.hostgames.mode = 'showlist'
        } else {
            gameStore.admin.hostgames.mode = 'livemode'
        }
      },

      sendping() {
        const gameStore = useGameStore
        if(gameStore.ws.connected) {
            console.log('sending ping');
            let msg = {message:'ping'};
            this.ws.send(JSON.stringify(msg));
        }
      },

      cleargameinfo() {
        const gameStore = useGameStore()
        gameStore.game.quesitons = {}
        gameStore.scoreboard.players = []
        gameStore.game.quizName = ''
        gameStore.admin.newquiz.gameid = ''
        gameStore.live.player.playersresponded=[]
        gameStore.live.player.playersresponded.length=0
      },


      async setupProfile() {
        const gameStore = useGameStore()
        let parms = {jwt: this.myjwt, playerName: this.username};
        let results = await DataService.getPlayer(parms);
        if(results.status===200){
            gameStore.profile.location = results.data.playerLocation
            gameStore.profile.realName = results.data.realName
            gameStore.profile.avatar = results.data.avatar
        }
        parms = {jwt: this.myjwt, playerName: this.username};
        results = await DataService.getPlayerProgress(parms);
        if(results.status===200){
            gameStore.profile.experience = results.data.experience;
            gameStore.profile.wins = results.data.wins;
            gameStore.profile.level = results.data.level;
        }
        parms = {jwt: this.myjwt, playerName: this.username};
        results = await DataService.getPlayerWallet(parms);
        if(results.status===200){
            gameStore.profile.playerWallet = results.data.amount;
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
        const gameStore = useGameStore()
        gameStore.admin.hostgames.mode = 'getlist'
        gameStore.live.admin.live = true
        gameStore.live.admin.uimode = 'lobby'
        gameStore.live.admin.questions = msg.questions
        gameStore.live.admin.quizName = msg.quizname
        gameStore.live.admin.gameId = msg.gameId
        gameStore.live.admin.questionType = msg.questionType
        gameStore.live.admin.gameType = msg.quizMode
      },

      playerjoined(msg) {
        const gameStore = useGameStore()
        for(let i=0; i < gameStore.live.admin.players.length; i++){
            if(gameStore.live.admin.players[i].playerName === msg.playerName)
            {
                //player exists already
                return;
            }
        }
        let userkey = {};
        // should this be playerName or jsut msg?
        userkey.playerName = msg.playerName;
        userkey.score = 0;
        userkey.answered='';
        let answers = new Array(gameStore.live.admin.questions.length).fill(' ');
        userkey.answers = answers;
        gameStore.live.admin.players.push(userkey);
      },

      playeranswered(msg) {
        const gameStore = useGameStore()
        for(let i = 0; i < this.players.length; i++) {
          if(this.players[i].playerName===msg.playerName) {
              msg.playerIndex = i
              msg.questionIndex = this.questionnumber - 1
              gameStore.live.admin.players[msg.playerIndex].answers[msg.questionIndex]= msg.response
              gameStore.live.admin.players[msg.playerIndex].answered = 'Y'
              break
            }
        }
        gameStore.live.admin.responses = this.responses + 1
      },

      joinedlive(msg) {
        const gameStore = useGameStore()
        gameStore.live.player.gameid = msg.gameId
        gameStore.live.player.quizName = msg.quizName
      },

      startgame(msg) {
        const gameStore = useGameStore()
        gameStore.live.player.scoreboard = msg.scoreboard
        gameStore.live.player.uimode = 'getready'
      },

      livequestion(msg) {
        const gameStore = useGameStore()
        gameStore.live.player.uimode = 'question'
        gameStore.live.player.question = msg
        gameStore.live.player.playersresponded=[];
        gameStore.live.player.playersresponded.length=0;        
      },

      livescoreboard(msg) {
        const gameStore = useGameStore()
        gameStore.live.player.uimode = 'scoreboard'
        gameStore.live.player.answer = msg.correctAnswer
        gameStore.live.player.alternatives = msg.alernativeAnswers
        gameStore.live.player.answerFollowup = msg.answerFollowup
        gameStore.live.player.scoreboard = msg.scoreboard
        gameStore.live.player.gametype = msg.gameType
        gameStore.live.player.playersresponded=[];
        gameStore.live.player.playersresponded.length=0;
        gameStore.live.player.scoreboardnote = msg.note
      },

      liveanswerboard(msg) {
        const gameStore = useGameStore()
        gameStore.live.player.uimode = 'answerboard'
        gameStore.live.player.answerboard = msg.questions
        gameStore.live.player.questiongroup = msg.questionGroup
        gameStore.live.player.playersresponded=[];
        gameStore.live.player.playersresponded.length=0;
      },

      updatelivestatus(msg) {
        const gameStore = useGameStore()
        if(msg.statusType === 'Player Answered') {
          gameStore.live.player.playersresponded.push(msg)
        }
      },

      liveendgame(msg) {
        const gameStore = useGameStore()
        gameStore.live.player.uimode = 'end'
        gameStore.live.player.scoreboard = msg.scoreboard
      }, 

      resetliveplayer() {
        const gameStore = useGameStore()
        gameStore.live.player.uimode = ''
        gameStore.live.player.scoreboard = ''
        gameStore.live.player.question = ''
        gameStore.gamemode = ''
        gameStore.live.player.live = false
        gameStore.uimode = 'home'
      },
    },

    destroyed() {
        const gameStore = useGameStore()
        gameStore.ws.conneected = false
        if(!this.ws===null)
            this.ws.close()
    },

})

</script>