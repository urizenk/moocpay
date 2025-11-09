import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { Button, Cell, CellGroup, Dialog, Toast, NavBar, Form, Field, Icon } from 'vant'
import '@vant/touch-emulator'

const app = createApp(App)

// 注册Vant组件
app.use(Button)
app.use(Cell)
app.use(CellGroup)
app.use(Dialog)
app.use(Toast)
app.use(NavBar)
app.use(Form)
app.use(Field)
app.use(Icon)

app.use(router)
app.mount('#app')