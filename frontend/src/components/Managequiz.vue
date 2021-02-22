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
        <QuizList v-if="adminmode=='showadminlist'"/>
        <QuizEdit v-if="adminmode=='showadminedit'"
            v-on:save-question="saveEditQuestion"
        >
        </QuizEdit>
        <QuizHeader v-if="adminmode=='showheader'"
            v-on:get-questions="getQuestions">
        </QuizHeader>
        <QuizDetail v-if="adminmode=='showquestions'" 
            v-bind:totalquestions="quizNumberOfQuestions"
            v-bind:questionnumber="questionNumber"
            v-bind:questiontype="questionType"
            v-bind:mode="quizMode"
            v-on:save-question="getNextQuestion">
        </QuizDetail>

    </div>
</template>

<script>
import QuizList from './QuizList'
import QuizHeader from './Quizheader';
import QuizDetail from './Quizdetail';
import QuizEdit from './QuizEdit';
import DataService from '@/services/DataServices';

export default {
    name: 'Managequiz',
    components: {
        QuizHeader,
        QuizDetail,
        QuizList,
        QuizEdit
    },
    data: function() { return {
        quizName: '',
        quizDescriptoion: '',
        quizNumberOfQuestions: 0,
        questionType: '',
        quizMode: '',
        questionNumber: 0
    }},
    computed: {
        username: function() {return this.$store.state.user.username;},
        adminmode: function() {return this.$store.state.adminmode},
        gameid: function() {return this.$store.state.admin.newquiz.gameid},
        myjwt: function() { return this.$store.state.user.cognito.idToken.jwtToken }
    },
    methods: {
        setMode(newmode) {
            this.$store.commit('setAdminMode', newmode);
        },
        async getQuestions(name, description, questions, type, mode) {
            this.quizName = name;
            this.quizDescription = description;
            this.quizNumberOfQuestions = +questions;
            this.questionType = type;
            this.quizMode = mode;
            this.questionNumber = 1;
            //save the header as the first question to get the gameid
            let header = {quizName: name, quizDescription: description, questionType: type,
                quizMode: mode, playerName: this.username, usage: 'unlimited' };
            header.quizName = name;
            let response = await this.saveHeader(header);
            this.$store.commit('setGameId', response.data.gameid);
            if(this.questionNumber<=this.quizNumberOfQuestions) {
                this.setMode('showquestions');
            } else
            {
                alert('You entered an invalid number of questions!');
            }
        },
        async getNextQuestion(questiontext, answera, answerb, answerc, answerd, correctanswer, questiongroup, alternatives, answerfollowup) {
            let question = {questionNumber: this.questionNumber, question: questiontext, 
                correctAnswer: correctanswer, answerFollowup: answerfollowup, gameId: this.gameid };
                question.questionNumber = this.questionNumber;
            if(this.questionType==='Multiple Choice') {
                question.answerA = answera;
                question.answerB = answerb;
                question.answerC = answerc;
                question.answerD = answerd;
            }
            if(this.questionType==='Open Answer') {
                question.alternatives = alternatives;
            }
            if(this.quizMode==='Multiplayer - Competitive') {
                question.questionGroup = questiongroup
            }
            //this.$emit("send-message", JSON.stringify({message:'savequestion', data: question}));
            await this.saveQuestion(question);
            this.questionNumber ++;
            if(this.questionNumber<=this.quizNumberOfQuestions) {
                this.setMode('showquestions');
            } else
            {
                this.questionNumber = 0;
                this.$store.commit('setUIMode', 'home')
                this.$store.commit('setGameId', undefined);
            }
        },
        async saveEditQuestion(gameid, questionNumber, quizMode, questionType, questiontext, answera, answerb, answerc, answerd, correctanswer, questiongroup, alternatives, answerfollowup) {            
            let question = {questionNumber: questionNumber, question: questiontext, 
                correctAnswer: correctanswer, answerFollowup: answerfollowup, gameId: gameid };
            if(questionType==='Multiple Choice') {
                question.answerA = answera;
                question.answerB = answerb;
                question.answerC = answerc;
                question.answerD = answerd;
            }
            if(questionType==='Open Answer') {
                question.alternatives = alternatives;
            }
            if(quizMode==='Multiplayer - Competitive') {
                question.questionGroup = questiongroup
            }
            await this.saveQuestion(question);
        },
        async saveHeader(parms){
            parms.jwt = this.myjwt;
            return await DataService.saveHeader(parms);
        },
        async saveQuestion(parms){
            parms.jwt = this.myjwt;
            return await DataService.saveQuestion(parms);
        }
     }
}
</script>