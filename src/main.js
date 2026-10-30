import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import AppTooltip from './components/AppTooltip.vue'
import AppIcon from './components/icons/AppIcon.vue'
import { registerRemixIcons } from './components/icons/remixIcons'
import App from './App.vue'
import router from './router'
import './styles/index.css'
import './styles/ai-create-consistency.css'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)

  app.use(pinia)
  app.use(router)
  // ElementPlus 全局中文:分页 "Total/Go to"、日期选择器、上传按钮、空态等统一本地化
  app.use(ElementPlus, { locale: zhCn })

  // 全局注册 Remix Icon 语义别名；Element Plus 图标仅保留依赖兼容，不作为新增来源。
  registerRemixIcons(app)

  // 全局注册业务语义图标映射：模板用 <AppIcon name="分组" /> 调用
  app.component('AppIcon', AppIcon)
  // 项目级文字提示：统一基于 Element Plus Tooltip，沉淀浮层样式与延时。
  app.component('AppTooltip', AppTooltip)

  // 等路由 ready 后挂载
  await router.isReady()
  app.mount('#app')
}

bootstrap()
