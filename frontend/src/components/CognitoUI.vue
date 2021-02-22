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
    <v-container>
      <v-row>
          <v-toolbar color="primary" class="headline black--text">
              <v-spacer></v-spacer>
              <v-toolbar-title>{{headerText}}</v-toolbar-title>
              <v-spacer></v-spacer>
          </v-toolbar>
      </v-row>
      <v-row>
          <v-alert v-model="error" type="error" style="error">{{errortext}}</v-alert>
      </v-row>
      <v-row>
          <v-alert v-model="status" type="info" style="info">{{statustext}}</v-alert>
      </v-row>
      <v-container v-if="mode=='login'">
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
        <v-row class="mb-1"> 
            <v-btn x-large block color="accent" class="wite--text" v-on:click='login'>Login</v-btn>
        </v-row>
        <v-row class="mb-1"> 
            <v-btn x-large block color="accent" class="wite--text" v-on:click='setmode("register")'>Register</v-btn>
        </v-row>
        <v-row class="mb-1"> 
            <v-btn x-large block color="accent" class="wite--text" v-on:click='setmode("forgotpassword")'>Reset Password</v-btn>
        </v-row>
      </v-container>
      <v-container v-if="mode=='register'">
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
        <v-row class="mb-1"> 
            <v-btn x-large block color="accent" class="wite--text" v-on:click='register'>Register</v-btn>
        </v-row>
        <v-row class="mb-1"> 
            <v-btn x-large block color="accent" class="wite--text" v-on:click='setmode("login")'>Login</v-btn>
        </v-row>
        <v-row class="mb-1"> 
            <v-btn x-large block color="accent" class="wite--text" v-on:click='setmode("forgotpassword")'>Reset Password</v-btn>
        </v-row>
      </v-container>
      <v-container v-if="mode=='forgotpassword'">
        <v-row>
            <v-col><v-text-field label="Login" v-model='userName' placeholder='Login'/></v-col>
        </v-row>
        <v-row class="mb-1"> 
            <v-btn x-large block color="accent" class="wite--text" v-on:click='forgotpassword'>Reset Password</v-btn>
        </v-row>
        <v-row class="mb-1"> 
            <v-btn x-large block color="accent" class="wite--text" v-on:click='setmode("login")'>Login</v-btn>
        </v-row>
        <v-row class="mb-1"> 
            <v-btn x-large block color="accent" class="wite--text" v-on:click='setmode("register")'>Register</v-btn>
        </v-row>      
      </v-container>
    </v-container>    
  </div>
</template>

<script>
import Config from '@/services/AWSConfig';

export default {

  name: 'CognitoUI',

  methods: {
    login() {
      this.$emit('loginuser', this.userName, this.password);
    },

    setmode(mode) {
      this.mode=mode
    },

    register() {
      this.$emit('signupuser', this.userName, this.password1, this.password2, this.email);
    },

    forgotpassword() {
      this.$emit('forgotpassword', this.userName);
    },

  },

  computed:
  {
    username: function() { return this.$store.state.user.username},
    status: function() { if(this.statustext===''){return false;} return true;},
    error: function() { if(this.errortext===''){return false;} return true;},
    headerText: function() { switch(this.mode) {
        case 'login':
          return `Login to ${Config.appName}`;
        case 'register':
          return `Register for ${Config.appName}`;
        case 'forgotpassword':
          return 'Reset Password';
        default:
          return '';
    }},
  },

  data: function() { return {
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

  props: {
    errortext: String,
    statustext: String
  }
}
</script>