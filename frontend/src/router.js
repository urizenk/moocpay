import { createRouter, createWebHistory } from 'vue-router'
import ReceivePage from './pages/ReceivePage.vue'
import SuccessPage from './pages/SuccessPage.vue'
import AdminPage from './pages/AdminPage.vue'
import SharePage from './pages/SharePage.vue'
import ShareImagePage from './pages/ShareImagePage.vue'
import TransferPage from './pages/TransferPage.vue'
import PaymentPage from './pages/PaymentPage.vue'
import WechatEntryPage from './pages/WechatEntryPage.vue'
import DebugPage from './pages/DebugPage.vue'
import WechatDiagPage from './pages/WechatDiagPage.vue'
import SimpleShareTest from './pages/SimpleShareTest.vue'

const routes = [
  {
    path: '/',
    name: 'AdminPage',
    component: AdminPage
  },
  {
    path: '/debug',
    name: 'DebugPage',
    component: DebugPage
  },
  {
    path: '/wechat-diag/:id',
    name: 'WechatDiagPage',
    component: WechatDiagPage
  },
  {
    path: '/share-test',
    name: 'SimpleShareTest',
    component: SimpleShareTest
  },
  {
    path: '/entry',
    name: 'WechatEntry',
    component: WechatEntryPage
  },
  {
    path: '/share/:id',
    name: 'SharePage',
    component: SharePage
  },
  {
    path: '/share-image/:id',
    name: 'ShareImagePage',
    component: ShareImagePage,
    meta: { title: '生成分享图片' }
  },
  {
    path: '/transfer/:id',
    name: 'TransferPage',
    component: TransferPage,
    meta: { title: '微信转账' }
  },
  {
    path: '/receive/:id',
    name: 'ReceivePage',
    component: ReceivePage,
    meta: { title: '微信转账' }
  },
  {
    path: '/payment/:id',
    name: 'PaymentPage',
    component: PaymentPage,
    meta: { title: '确认支付' }
  },
  {
    path: '/success/:id',
    name: 'SuccessPage',
    component: SuccessPage,
    meta: { title: '收款成功' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
