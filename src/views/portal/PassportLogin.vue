<template>
  <!--
    超星 passport 登录页（Demo 模拟）
    PRD v3.0 模块十四：退出登录 / 未登录访问业务应用包管理页面时跳转到此，
    登录成功后回跳 `redirect` 指定页面。正式开发直接对接 passport，不新建自建登录。
  -->
  <div class="passport-page ai-surface-page">
    <div class="passport-card">
      <div class="pp-logo">
        <span class="pp-mark">超星</span>
        <span class="pp-name">学习通 · 统一身份认证</span>
      </div>

      <el-alert
        v-if="loggedOut"
        title="您已退出登录"
        description="退出后需重新登录才能访问业务应用包管理；点击浏览器后退也不会恢复登录态。"
        type="warning"
        :closable="false"
        show-icon
        class="pp-tip"
      />
      <el-alert
        v-else
        title="请先登录"
        description="当前未登录或登录态已失效，登录成功后将回到业务应用包管理页面。"
        type="info"
        :closable="false"
        show-icon
        class="pp-tip"
      />

      <div class="pp-form">
        <el-input v-model="account" placeholder="账号 / 手机号" disabled />
        <el-input v-model="password" placeholder="密码" type="password" disabled show-password />
      </div>

      <el-button type="primary" class="pp-btn" @click="login"> 登录（演示：一键登录） </el-button>
      <p class="pp-note">
        Demo 模拟页；正式环境跳转超星 passport 统一登录，登录后按 redirect 回跳。
      </p>

      <el-button text class="pp-back" @click="goHome">返回应用包管理</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const account = ref('zhangli')
const password = ref('********')

const loggedOut = computed(() => route.query.loggedout === '1')

function login() {
  // 演示不接真实登录：清除退出标记 → 回跳 redirect（默认业务应用包管理页）
  sessionStorage.removeItem('pkg-logged-out')
  const redirect = route.query.redirect || '/package/manage'
  ElMessage.success('登录成功')
  router.push(redirect)
}
function goHome() {
  router.push('/package/manage')
}
</script>

<style scoped>
.passport-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f8fc;
}
.passport-card {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
  padding: 32px 32px 24px;
  display: flex;
  flex-direction: column;
}
.pp-logo {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 18px;
}
.pp-mark {
  font-size: 20px;
  font-weight: 700;
  color: #1f6cf9;
}
.pp-name {
  font-size: 13px;
  color: var(--text-3);
}
.pp-tip {
  margin-bottom: 16px;
}
.pp-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pp-btn {
  width: 100%;
  margin-top: 18px;
}
.pp-note {
  margin: 12px 0 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-4);
  text-align: center;
}
.pp-back.el-button {
  margin: 10px auto 0;
  font-size: 12px;
  color: var(--text-3);
}
.pp-back:hover {
  color: var(--brand-1);
}
</style>
