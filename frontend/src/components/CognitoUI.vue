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
    <div>
      <v-row class="mb-12"></v-row>
          <v-toolbar color="primary" class="headline black--text">
            <v-spacer></v-spacer>
              <v-toolbar-title>{{headerText}}</v-toolbar-title>
          </v-toolbar>
      <v-row v-if="gameStore.cognito.errortext!==''">
          <v-alert v-model="gameStore.cognito.error" type="error" style="error">{{ gameStore.cognito.errortext }}</v-alert>
      </v-row>
      <v-row v-if="gameStore.cognito.statustext!==''">
          <v-alert v-model="gameStore.cognito.status" type="info" style="info">{{ gameStore.cognito.statustext }}</v-alert>
      </v-row>
      <v-container v-if="mode==='login'">
        <v-row>
            <v-col><v-text-field label="Login" v-model='userName' placeholder='Login'/></v-col>
        </v-row>
        <v-row>
            <v-col><v-text-field label="Password" v-model='password' placeholder='Password'
                  :append-icon="show ? 'mdi-eye': 'mdi-eye-off'"
                  :type="show ? 'text': 'password'"
                  @click:append="show = !show"
                  /></v-col>
        </v-row>
        <v-row class="mb-6"> 
            <v-btn x-large block color=button-main v-on:click='login'>Login</v-btn>
        </v-row>
        <v-row class="mb-6"> 
            <v-btn x-large block color=button-main v-on:click='setmode("register")'>Register</v-btn>
        </v-row>
        <v-row class="mb-6"> 
            <v-btn x-large block color=button-main v-on:click='setmode("forgotpassword")'>Reset Password</v-btn>
        </v-row>
      </v-container>
      <div v-if="mode=='register'">
        <v-row>
            <v-col><v-text-field label="Login" v-model='userName' placeholder='Login'/></v-col>
        </v-row>
        <v-row>
            <v-col><v-text-field label="Email" v-model='email' placeholder='Email'/></v-col>
        </v-row>
        <v-row>
            <v-col><v-text-field label="Password" v-model='password1' placeholder='Password'
                  :append-icon="show1 ? 'mdi-eye': 'mdi-eye-off'"
                  :type="show1 ? 'text': 'password'"
                  @click:append="show1 = !show1"
                  /></v-col>
        </v-row>
        <v-row>
            <v-col><v-text-field label="Confirm Password" v-model='password2' placeholder='Confirm Password'
                  :append-icon="show2 ? 'mdi-eye': 'mdi-eye-off'"
                  :type="show2 ? 'text': 'password'"
                  @click:append="show2 = !show2"
                  /></v-col>
        </v-row>
        <div>
          <v-row class="mb-6"> 
              <v-btn x-large block color=button-main v-on:click='register()'>Register</v-btn>
          </v-row>
          <v-row class="mb-6"> 
              <v-btn x-large block color=button-main v-on:click='setmode("login")'>Login</v-btn>
          </v-row>
          <v-row class="mb-6"> 
              <v-btn x-large block color=button-main v-on:click='setmode("forgotpassword")'>Reset Password</v-btn>
          </v-row>
        </div>
      </div>
      <v-container v-if="mode=='forgotpassword'">
        <v-row>
            <v-col><v-text-field label="Login" v-model='userName' placeholder='Login'/></v-col>
        </v-row>
        <v-row class="mb-6"> 
            <v-btn x-large block color=button-main class="wite--text" v-on:click='forgotpassword'>Reset Password</v-btn>
        </v-row>
        <v-row class="mb-6"> 
            <v-btn x-large block color=button-main class="wite--text" v-on:click='setmode("login")'>Login</v-btn>
        </v-row>
        <v-row class="mb-6"> 
            <v-btn x-large block color=button-main class="wite--text" v-on:click='setmode("register")'>Register</v-btn>
        </v-row>      
      </v-container>
    </div>    
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { AWSConfig } from '@/services/AWSConfig.js'
import { useGameStore } from '@/store/game.js'

export default defineComponent({

  name: 'CognitoUI',

  setup() {
    const gameStore = useGameStore()
    return { gameStore, AWSConfig }
  },
  
  data() { return {
    userName: '',
    password: '',
    show: false,
    show1: false,
    show2: false,
    mode: 'login',
    email: '',
    password1: '',
    password2: ''
  }},
  emits: ['signupuser', 'loginuser', 'forgotpassword'],

  methods: {
    login() {
      const parms = { 'userName': this.userName, 'password': this.password}
      this.$emit('loginuser', parms);
    },

    setmode(mode) {
      const gameStore = useGameStore()
      gameStore.cognito.statustext = ''
      gameStore.cognito.status = false
      gameStore.cognito.errortext = ''
      gameStore.cognito.error = false
      this.mode=mode
    },

    register() {
      const parms = { 'userName' : this.userName, 'password1': this.password1,
        'password2': this.password2, 'email': this.email}
      this.$emit('signupuser', parms)
    },

    forgotpassword() {
      this.$emit('forgotpassword', this.userName);
    },

  },

  computed:
  {
    username: function() { const gameStore = useGameStore(); 
      return gameStore.state.user.username},
    headerText: function() { switch(this.mode) {
        case 'login':
          return `Login`;
        case 'register':
          return `Register`;
        case 'forgotpassword':
          return 'Reset Password';
        default:
          return '';
    }},
  }
})
</script>