/**
 * 当前页面持有的应用包版本（PRD v3.0 模块十一「并发修改的版本校验」，2026-10-11）
 *
 * 读接口（搭建页详情 / 应用包管理列表）拿到 `version` 后写入这里；
 * 写接口由 `request.js` 统一带上 `__pkgVersion`，服务端比对不一致即返回 code 4090，
 * 前端弹窗「当前应用包版本过低，请刷新页面后重试！」。
 *
 * 当前页只会编辑一个应用包，因此保存该包的 ID 与版本号；
 * 切换应用包时由页面详情接口同步替换，避免将 A 包的版本用于校验 B 包。
 */
let heldVersion = null
let heldPackageId = null

export const setPkgVersion = (v, packageId = null) => {
  heldVersion = v || null
  heldPackageId = packageId || null
}

export const getPkgVersion = () => heldVersion
export const getPkgId = () => heldPackageId
