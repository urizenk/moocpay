import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { Button, Cell, CellGroup, Dialog, Toast, NavBar, Form, Field, Icon, List, Empty, Tag, RadioGroup, Radio, Popup } from 'vant'
import '@vant/touch-emulator'

// 导入 Vant 样式
import 'vant/lib/index.css'

// 导入全局移动端样式
import './styles/mobile.css'

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
app.use(List)
app.use(Empty)
app.use(Tag)
app.use(RadioGroup)
app.use(Radio)
app.use(Popup)

app.use(router)
app.mount('#app')
