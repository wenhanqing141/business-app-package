<template>
  <!-- 前台登录占位页（纯 Mock；真实环境沿用微服务统一登录） -->
  <div class="portal-login ai-surface-page">
    <div class="login-card">
      <AppIcon :size="34" style="color: #0047ff" name="应用" />
      <div class="title">校园后勤管理</div>
      <div class="tag">业务应用包前台</div>

      <template v-if="loggedOut">
        <el-alert
          title="您已退出登录"
          description="退出后需重新登录才能访问应用包前台；点击浏览器后退也不会恢复登录态。"
          type="warning"
          :closable="false"
          show-icon
          class="tip"
        />
        <el-button type="primary" class="action" @click="relogin">
          <el-icon><UserFilled /></el-icon>重新登录（演示）
        </el-button>
      </template>
      <template v-else>
        <el-alert
          title="请先登录"
          description="登录状态已失效或尚未登录，登录成功后将进入应用包前台。"
          type="info"
          :closable="false"
          show-icon
          class="tip"
        />
        <el-button type="primary" class="action" @click="relogin">
          <el-icon><UserFilled /></el-icon>登录并进入前台（演示）
        </el-button>
      </template>

      <el-button text class="back-home" @click="goHome">返回应用包管理</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/icons/AppIcon.vue'

// 与路由守卫约定的前台退出标记 key（sessionStorage：关闭标签页即清除）
const PORTAL_AUTH_KEY = 'portal-logged-out'

const router = useRouter()
const route = useRoute()
const loggedOut = computed(() => route.query.loggedout === '1')

function relogin() {
  // 演示环境不接真实登录：清除退出标记后直接回前台（真实环境走微服务统一登录）
  sessionStorage.removeItem(PORTAL_AUTH_KEY)
  router.push('/portal')
}
function goHome() {
  router.push('/package/manage')
}
</script>

<style scoped>
.portal-login {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fc;
}
.login-card {
  width: 400px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 34px 32px 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.title {
  margin-top: 12px;
  font-size: 20px;
  font-weight: 600;
  color: #12141a;
}
.tag {
  margin-top: 4px;
  font-size: 12px;
  color: #57585e;
}
.tip {
  width: 100%;
  margin-top: 22px;
}
.action {
  width: 100%;
  margin-top: 16px;
}
.back-home.el-button {
  margin-top: 16px;
  font-size: 12px;
  color: #57585e;
}
.back-home:hover {
  color: #0047ff;
}
</style>
