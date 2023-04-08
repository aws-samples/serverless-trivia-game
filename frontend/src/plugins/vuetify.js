// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Vuetify
import { createVuetify } from 'vuetify'

const stsDarkTheme = {
  dark: true,
  colors: {
    background: '#121212',
    surface: '#121212',
    primary: '#6400f0',
    'primary-darken-1': '#3700B3',
    secondary: '#03DAC6',
    'secondary-darken-1': '#018786',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
    'signout': '#FB8C00',
    'button-main' : '#000aff',
    'button-sub': '#0089ff',
    'accent': '#7378f5',
    'text-button-main': '#d0d1ee',
    'answera': '#00a8f4',  
    'answerb': '#e9da53',
    'answerc': '#eb4833',
    'answerd': '#36c43a',
    'answeratext': '#000000',
    'answerbtext': '#FFFFFF',
    'answerctext': '#000000',
    'answerdtext': '#000000'
  }
}

export default createVuetify({
  theme: {
    defaultTheme: 'stsDarkTheme',
    themes: {
      stsDarkTheme,
    }
  }
})
