import { createRouter, createWebHistory } from 'vue-router'
import ChatCard from './pages/ChatCard.vue'
import ReceivePage from './pages/ReceivePage.vue'
import SuccessPage from './pages/SuccessPage.vue'
import AdminPage from './pages/AdminPage.vue'
import SharePage from './pages/SharePage.vue'
import TransferPage from './pages/TransferPage.vue'
import PaymentPage from './pages/PaymentPage.vue'

const routes = [
  {
    path: '/',
    name: 'ChatCard',
    component: ChatCard
  },
  {
    path: '/receive/:id',
    name: 'ReceivePage',
    component: ReceivePage
  },
  {
    path: '/success/:id',
    name: 'SuccessPage',
    component: SuccessPage
  },
  {
    path: '/admin',
    name: 'AdminPage',
    component: AdminPage
  },
  {
    path: '/share/:id',
    name: 'SharePage',
    component: SharePage
  },
  {
    path: '/transfer/:id',
    name: 'TransferPage',
    component: TransferPage
  },
  {
    path: '/payment/:id',
    name: 'PaymentPage',
    component: PaymentPage
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router