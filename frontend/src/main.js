import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import { createPinia } from 'pinia'


createApp(App).use(createPinia())
  .use(vuetify)
  .mount('#app')
