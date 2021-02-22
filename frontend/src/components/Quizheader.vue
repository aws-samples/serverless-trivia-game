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
                <v-toolbar-title>Enter Main Quiz Information</v-toolbar-title>
                <v-spacer></v-spacer>
            </v-toolbar>
        </v-row>
        <v-row>
            <v-alert v-model="error" dismissible type="error" style="error">{{errortext}}</v-alert>
        </v-row>
        <v-row>
            <v-text-field label="Quiz Name" v-model='quizName' placeholder='Quiz Name'/>
        </v-row>
        <v-row>
            <v-text-field label="Quiz Description" v-model='quizDescription' placeholder='Description of Quiz'/>
        </v-row>
        <v-row>
            <v-text-field label="Number of Questions" v-model='quizNumberOfQuestions' placeholder='Number of Questions'/>
        </v-row>
        <v-row>
            <v-select label="Question Type" :items="questionTypes" v-model='questionType'/>
        </v-row>
        <v-row>
            <v-select label="Quiz Mode" :items="quizModes" v-model='quizMode'/>
        </v-row>
        <v-row>
            <v-btn x-large block color="accent" class="white--text" v-on:click='checkinput'>Enter Questions</v-btn>
        </v-row>
    </v-container>
</template>

<script>
export default {
    name: 'QuizHeader',
    data: function() {
    return {
        quizName: '',
        quizNumberOfQuestions: 0,
        quizDescription: '',
        questionType: '',
        quizMode: '',
        questionTypes: ['Multiple Choice', 'Open Answer'],
        quizModes: ['Single Player', 'Multiplayer - Casual', 'Multiplayer - Competitive', 'Multiplayer - Live Scorebard'],
        error: false,
        errortext: ''
    }},
    methods: {
        checkinput: function() {
            this.errortext = '';
            this.error = false;
            if(this.quizName===''){
                this.errortext = 'Please enter a quiz name';
            } else if(this.quizDescription===''){
                this.errortext = 'Please enter a description of the quiz';
            } else if(this.quizNumberOfQuestions < 1 || isNaN(this.quizNumberOfQuestions)){
                this.errortext = 'Please enter number of questions > 0';
            } else if(this.quizMode===''){
                this.errortext = 'Please select a quiz mode';
            } else if(this.questionType===''){
                this.errortext = 'Please select your question type';
            }
            if(this.errortext==='') {
                this.$emit("get-questions", this.quizName, this.quizDescription, this.quizNumberOfQuestions, this.questionType, this.quizMode)
            } else {
                this.error = true;
            }
        }
    }
}
</script>