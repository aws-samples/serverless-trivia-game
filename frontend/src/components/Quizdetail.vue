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
                <v-toolbar-title>Enter Question {{ questionnumber }} of {{ totalquestions }}</v-toolbar-title>
                <v-spacer></v-spacer>
                </v-toolbar>
            </v-row>
            <v-row>
                <v-alert v-model="error" dismissible type="error" style="error">{{errortext}}</v-alert>
            </v-row>
            <v-row v-if="mode==='Multiplayer - Competitive'">
                <v-select label="Question Group" v-model='questionGroup' placeholder='Question Group' :items="groups"/>
            </v-row>
            <v-row>
                <v-textarea label="Question Text" v-model='question' placeholder='Question' rows="4"/>
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
                <v-row>
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
            <v-row>
                <v-btn color="accent" x-large block class="white--text" v-on:click='savequestions'>Save Question</v-btn>
            </v-row>

    </v-container>
</template>

<script>
export default {
    name: 'QuizDetail',
    props: {
        questionnumber: Number,
        totalquestions: Number,
        questiontype: String,
        mode: String
    },
    data: function() {
        return {
            question:'',
            answerA:'',
            answerB:'',
            answerC:'',
            answerD:'',
            correctAnswer: '',
            alternatives: [],
            questionGroup: 0,
            answers: ['A', 'B', 'C', 'D'],
            groups: [1,2,3,4,5,6,7,8,9,10],
            error: false,
            errortext:'',
            answerFollowup:'',
            lastgroup: 0
        }
    },
    computed: {
        multiplechoice: function() {
            if(this.questiontype==='Multiple Choice') {
                return true;
            } else {
                return false;
            }
        }
    },
    methods: {
        clearForm: function() {
            this.lastgroup = this.questionGroup;
            this.question = '';
            this.answerA = '';
            this.answerB = '';
            this.answerC = '';
            this.answerD = '';
            this.correctAnswer = '';
            this.answerFollowup = '';
            this.alternatives = [];
            this.questionGroup=this.lastgroup;
        },
        savequestions: function() {
            this.errortext = '';
            this.error = false;
            if(this.multiplechoice){
                switch(this.correctAnswer){
                    case 'A':
                        if(this.answerA===''){
                            this.errortext = 'Answer A must have an answer to be selected as the correct answer';
                        }
                        break;
                    case 'B':
                        if(this.answerB===''){
                            this.errortext = 'Answer B must have an answer to be selected as the correct answer';
                        }
                        break;
                    case 'C':
                        if(this.answerC===''){
                            this.errortext = 'Answer C must have an answer to be selected as the correct answer';
                        }
                        break;
                    case 'D':
                        if(this.answerD===''){
                            this.errortext = 'Answer D must have an answer to be selected as the correct answer';
                        }
                        break;
                }
            } else if(this.question===''){
                this.errortext = 'Please enter question text';
            } else if((this.answerA==='' || this.answerB ==='') && this.multiplechoice ){
                this.errortext = 'Multiple Choice Question must have at least A and B answers';
            } else if(this.correctAnswer ===''){
                this.errortext = 'Please enter/select the correct answer';
            } else if(this.questionGroup<this.lastgroup) {
                this.errortext = 'Current group cannot be before last group';
            }
            if(this.errortext === '') {
                this.$emit("save-question", this.question, this.answerA, this.answerB, this.answerC, this.answerD, this.correctAnswer, this.questionGroup, this.alternatives, this.answerFollowup);
                this.clearForm();
            } else {
                this.error = true;
            }
        }
    }    
}
</script>
