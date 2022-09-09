import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'

loadFonts()

createApp(App)
  .use(createPinia())
  .use(vuetify)
  .mount('#app')
