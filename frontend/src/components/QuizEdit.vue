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
        <span v-if="adminmode==='showadminedit'">
            <v-toolbar color="primary" class="headline black--text">
                <v-toolbar-title>Game Info</v-toolbar-title>
                <v-spacer></v-spacer>
            </v-toolbar>
            <v-row class="mb-6"></v-row>
            <v-card>
                <v-card-text>
                    <v-row class="mb-3">Quiz Name: {{quizName}}</v-row>
                    <v-row class="mb-3">Question Type: {{questionType}}</v-row>
                    <v-row class="mb-3">Quiz Mode: {{quizMode}}</v-row>
                </v-card-text>
            
 <!-- Revive when v-data-table is added to Vuetify Beta 
                <v-card-title>Question Listing<v-spacer></v-spacer>
                <v-text-field
                    v-model="search"
                    append-icon="mdi-magnify"
                    label="Search"
                    single-line
                    hide-details
                ></v-text-field>
            </v-card-title>
            <v-row align="center" justify="center">
                <v-data-table
                    :headers="questionheaders"
                    :items="questions"
                    item-key="qeustionNumber"
                    dense
                    sort-by="questionNumber"
                    no-data-text="No questions in game"
                    :search="search"
                    >
                    <template v-slot:item="props">
                        <tr @click="editQuestion(props.item)">
                            <td>{{props.item.questionNumber}}</td>
                            <td>{{props.item.question}}</td>
                        </tr>
                    </template>
                </v-data-table>
            </v-row> -->
            <v-row>
                <v-col cols="3"></v-col><v-col cols="6">

                <v-row>
                    <v-table width="100%">
                        <thead>
                            <tr>
                                <th class="text-left">
                                    #
                                </th>
                                <th class="text-left">
                                    Question
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="noquestions"><td><b>No questions in game</b></td></tr>
                            <tr
                                v-for="(question, index) in questions"
                                :key="question.questionNumber"
                                @click="editQuestion(question, index)"
                            >
                                <td align="left">{{ question.questionNumber }}</td>
                                <td align="left">{{ question.question }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-row>
                <v-col cols="3"></v-col>
            </v-col>
            </v-row>
            </v-card>
            <v-row class="mb-9"></v-row>
            <span v-if="showquestion">
                <v-card>
                <v-row>
                    <v-alert v-model="error" dismissible type="error" style="error">{{errortext}}</v-alert>
                </v-row>
                <v-row v-if="quizMode==='Multiplayer - Competitive'">
                    <v-select label="Question Group" v-model='questionGroup' placeholder='Question Group' :items="groups"/>
                </v-row>
                <v-row>
                    <v-textarea label="Question Text" v-model='questionText' placeholder='Question' rows="4"/>
                </v-row>
                <span v-if="multiplechoice">
                    <v-row>
                        <v-text-field label="Answer A" v-model='answerA' placeholder='Answer A'/>
                    </v-row>
                    <v-row>
                        <v-text-field label="Answer B" v-model='answerB' placeholder='Answer B'/>
                    </v-row>
                    <v-row>
                        <v-text-field label="Answer C" v-model='answerC' placeholder='Answer C'/>
                    </v-row>
                    <v-row>
                        <v-text-field label="Answer D" v-model='answerD' placeholder='Answer D'/>
                    </v-row>
                    <v-row>
                        <v-select label="Correct Answer" v-model='correctAnswer' :items="answers" placeholder='correct answer'/>
                    </v-row>
                </span>
                <span v-if="!multiplechoice">
                    <v-row>
                        <v-text-field label="Answer" v-model="correctAnswer" placeholder="Answer"/>
                    </v-row>
                    <v-row class="mb-3">
                        <v-combobox v-model="alternatives" label="Alternative Answers" multiple chips></v-combobox>
                    </v-row>
                    <v-row>
                    </v-row>
                </span>
                <span>
                    <v-row>
                        <v-text-field label="Answer Followup" v-model="answerFollowup" placeholder="Extra text to follow up on answer"/>
                    </v-row>
                </span>
            <v-row class="mb-6"><v-btn x-large block color=button-main class="white--text" v-on:click="saveQuestion">Save Question</v-btn></v-row>
            <v-row class="mb-6"><v-btn x-large block color=button-main class="white--text" v-on:click="cancel">Cancel</v-btn></v-row>
            </v-card>
            </span>
            <span v-if="!showquestion">
                <v-row class="mb-6"><v-btn x-large block color=button-main class="white--text" v-on:click="addQuestion">Add Question</v-btn></v-row>
                <v-row class="mb-6"><v-btn x-large block color=button-main class="white--text" v-on:click="saveUpdates">Save Updates</v-btn></v-row>
                <v-row class="mb-6"><v-btn x-large block color=button-main class="white--text" v-on:click="closequiz">Close Quiz</v-btn></v-row>
            </span>
        </span>
    </div>
</template>

<script>
import { useGameStore } from '@/store/game.js'

export default {
    name: 'quiz-edit',
    data: function() { return {
        questionheaders: [{ text: '#', align:'left', sortable:'false', value:'questionNumber'},
                    { text: 'Question', value: 'question'}],
        search:'',
        showquestion:false,
        questionIndex: -1,
        questionNumber: -1,
        errortext:'',
        error:false,
        mode:'',
        questionText:'',
        correctAnswer:'',
        answerA:'',
        answerB:'',
        answerC:'',
        answerD:'',
        alternatives:[],
        questionGroup:0,
        answerFollowup:'',
        answers: ['A', 'B', 'C', 'D'],
        groups: [1,2,3,4,5,6,7,8,9,10],
        index: -1
    }},
    emits:['save-updates'],
    methods: {
        async editQuestion(question, index) {
            this.questionNumber = question.questionNumber
            this.questionIndex = this.questionNumber -1
            this.showquestion=true
            this.questionText=this.questions[this.questionIndex].question
            this.answerA=this.questions[this.questionIndex].answerA
            this.answerB=this.questions[this.questionIndex].answerB
            this.answerC=this.questions[this.questionIndex].answerC
            this.answerD=this.questions[this.questionIndex].answerD
            this.correctAnswer=this.questions[this.questionIndex].correctAnswer
            this.alternatives=this.questions[this.questionIndex].alternatives
            this.questionGroup=this.questions[this.questionIndex].questionGroup
            this.answerFollowup=this.questions[this.questionIndex].answerFollowup
            this.index = index
        },
        closequiz() {
            const gameStore = useGameStore()
            gameStore.admin.hostgames.mode = 'getlist'
            gameStore.uimode = 'home'
        },
        addQuestion() {
            this.questionNumber = this.totalquestions + 1
            this.questionIndex = this.questionNumber - 1
            this.showquestion=true
            this.questionText=''
            this.answerA=''
            this.answerB=''
            this.answerC=''
            this.answerD=''
            this.correctAnswer=''
            this.alternatives=[]
            this.answerFollowup=''
            this.questionGroup=this.lastgroup
            this.index = this.totalquestions + 1
        },
        cancel() {
            this.questionNumber = -1
            this.questionIndex = -1
            this.showquestion = false
        },
        async saveQuestion() {
            const gameStore = useGameStore()
            this.errortext = ''
            this.error = false
            if(this.multiplechoice){
                switch(this.correctAnswer){
                    case 'A':
                        if(this.answerA===''){
                            this.errortext = 'Answer A must have an answer to be selected as the correct answer'
                        }
                        break
                    case 'B':
                        if(this.answerB===''){
                            this.errortext = 'Answer B must have an answer to be selected as the correct answer'
                        }
                        break
                    case 'C':
                        if(this.answerC===''){
                            this.errortext = 'Answer C must have an answer to be selected as the correct answer'
                        }
                        break
                    case 'D':
                        if(this.answerD===''){
                            this.errortext = 'Answer D must have an answer to be selected as the correct answer'
                        }
                        break
                }
            } else if(this.questionText===''){
                this.errortext = 'Please enter question text'
            } else if(this.correctAnswer ===''){
                this.errortext = 'Please enter/select the correct answer'
            } else if(this.questionGroup<this.lastgroup) {
                this.errortext = 'Current group cannot be before last group'
            }
            if((this.answerA==='' || this.answerB ==='') && this.multiplechoice && this.errortext ==='' ){
                this.errortext = 'Multiple Choice Question must have at least A and B answers'
            } 
            if(this.errortext === '') {
                let data = {question: this.questionText, questionNumber: this.questionNumber,
                    answerA: this.answerA, answerB: this.answerB, answerC: this.answerC, answerD: this.answerD,
                    correctAnswer: this.correctAnswer, questionGroup: this.questionGroup, alternatives: this.alternatives,
                    answerFollowup: this.answerFollowup}
                gameStore.admin.game.questions.splice(this.index,1,data)
                this.showquestion=false
                this.questionNumber= -1
                this.questionIndex = -1
                this.index = -1
            } else {
                this.error = true
            }
        },
        async saveUpdates() {
            this.$emit("save-updates")
        }

    },
    computed: {
        adminmode: function() {
            const gameStore = useGameStore()
            return gameStore.adminmode},
        gamelist: function() {
            const gameStore = useGameStore()
            return gameStore.admin.gamelist},
        username: function() {
            const gameStore = useGameStore()
            return gameStore.user.username},
        gethostbutton: function() {if(this.question==0){return "Start Quiz";} else {return "Next Question";}},
        game: function() {
            const gameStore = useGameStore()
            return gameStore.admin.game;},
        gameid: function() {
            const gameStore = useGameStore()
            return gameStore.admin.game.gameId},
        quizName: function() {
            const gameStore = useGameStore()
            return gameStore.admin.game.quizName;},
        questionType: function() {
            const gameStore = useGameStore()
            return gameStore.admin.game.questionType;},
        quizMode: function() {
            const gameStore = useGameStore()
            return gameStore.admin.game.quizMode;},
        questions: function() {
            const gameStore = useGameStore()
            return gameStore.admin.game.questions},
        totalquestions: function() {
            const gameStore = useGameStore()
            return gameStore.admin.game.questions.length},
        multiplechoice: function() {
            const gameStore = useGameStore()
            return (gameStore.admin.game.questionType==='Multiple Choice')},
        lastgroup: function() {
            const gameStore = useGameStore()
            if(this.totalquestions>0)
                {return gameStore.admin.game.questions[this.totalquestions - 1].questionGroup}
                return 1},
        noquestions: function() { 
            return this.totalquestions == 0
        }
    }
}


</script>