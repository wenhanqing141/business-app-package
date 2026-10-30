// src/api/request.js

import axios from 'axios'
import { ElMessageBox } from 'element-plus'
import { installInlineMock } from '@/utils/inlineMockAdapter'
import { resolveApiMode } from '@/utils/apiMode'
import { getPkgId, getPkgVersion, setPkgVersion } from './pkgVersion'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// 写请求统一带上「当前页面持有的应用包版本」，供服务端做并发校验（PRD v3.0 模块十一）
request.interceptors.request.use((config) => {
  const method = String(config.method || 'get').toLowerCase()
  const packageId = getPkgId()
  if (method !== 'get' && getPkgVersion()) {
    const versionPayload = {
      __pkgVersion: getPkgVersion(),
      ...(packageId ? { __pkgId: packageId } : {})
    }
    if (config.data && typeof config.data === 'object') {
      config.data = { ...config.data, ...versionPayload }
    } else {
      config.params = { ...(config.params || {}), ...versionPayload }
    }
  }
  return config
})

// 写成功后刷新「页面持有的应用包版本」（服务端每次保存成功都会递增，PRD v3.0 模块十一）
async function refreshPkgVersion() {
  try {
    const packageId = getPkgId()
    const d = await request.get('/pkg/version', {
      params: packageId ? { __pkgId: packageId } : {}
    })
    if (d && d.version) setPkgVersion(d.version, d.id || packageId)
  } catch {
    /* 忽略：拿不到最新版本时下一次写操作会按旧版本校验 */
  }
}

// 响应拦截器：统一处理 { code, data, message } 格式
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 0) {
        // 写操作成功 → 刷新持有的版本号（GET 无副作用，不会递归刷新）
        const method = String(response.config?.method || 'get').toLowerCase()
        if (method !== 'get') {
          // 等待版本同步完成后再放行调用方，避免连续弹窗操作仍携带上一版版本号。
          return refreshPkgVersion().then(() => res.data)
        }
        return res.data
      }
      // 并发版本校验失败：弹窗提示（PRD v3.0：当前应用包版本过低，请刷新页面后重试！）
      if (res.code === 4090) {
        ElMessageBox.alert(res.message || '当前应用包版本过低，请刷新页面后重试！', '保存失败', {
          type: 'warning',
          confirmButtonText: '刷新页面',
          showClose: false
        })
          .then(() => window.location.reload())
          .catch(() => {})
      }
      return Promise.reject(new Error(res.message || `业务错误 code=${res.code}`))
    }
    return res
  },
  (error) => {
    console.error('[request error]', error)
    return Promise.reject(error)
  }
)

// 生产模式 + mock 启用 → 挂 inline adapter（拦截在 axios 层，请求不进网络）
// dev 模式继续走 vite-plugin-mock（HTTP 层拦截），不动
if (import.meta.env.PROD) {
  const mode = resolveApiMode()
  if (mode === 'mock') {
    installInlineMock(request)
  }
}

export default request
