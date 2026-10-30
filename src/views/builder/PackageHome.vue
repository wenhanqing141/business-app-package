<template>
  <div class="pkg-home ai-surface-page" v-loading="loading">
    <!-- ============ 顶栏（线框 1）：退出 / 应用名称 …… 业务图谱 / AI ============ -->
    <!-- 2026-10-11：右上角「发布」按钮已去掉（PRD v2.6 模块十一）——应用包创建完成即自动生效并入应用管理 -->
    <header class="ph-header">
      <AppTooltip v-if="!isPortal" content="退出" placement="bottom">
        <el-button text class="exit-btn" @click="exitPackage">
          <AppIcon class="exit-icon" name="左" :size="16" />
        </el-button>
      </AppTooltip>
      <PackageIcon class="ph-app-icon" :icon="pkg.icon" :size="28" />
      <div class="ph-app-title">
        <AppTooltip :content="pkg.name || '未命名应用包'" placement="bottom" only-when-overflow>
          <span class="ph-app-name">{{ pkg.name || '未命名应用包' }}</span>
        </AppTooltip>
        <AppTooltip v-if="!isPortal" content="编辑应用包" placement="bottom">
          <el-button
            text
            class="package-edit-btn"
            aria-label="编辑应用包基础信息"
            @click="openPackageSetup"
          >
            <AppIcon name="编辑" :size="16" />
          </el-button>
        </AppTooltip>
      </div>

      <div v-if="!isPortal" class="header-right">
        <!-- 业务图谱：AI 按钮左侧 -->
        <el-button text class="graph-btn" @click="openGraph">
          <!-- el-button 会把插槽内容再包一层 span，间距要放在内层容器上才生效 -->
          <span class="graph-inner">
            <AppIcon name="应用关联图谱" :size="16" />
            <span>业务图谱</span>
          </span>
        </el-button>
        <!-- 2026-10-11 本版：业务维护 AI 助手整体去掉——顶栏的 AI 对话入口已移除 -->
      </div>

      <!-- 前台右上角：复用应用包列表页的用户信息，并补充包内角色切换。 -->
      <el-dropdown
        v-else
        class="portal-user-dropdown"
        trigger="click"
        placement="bottom-end"
        popper-class="portal-user-menu"
        @command="onPortalUserCommand"
      >
        <div class="portal-user-trigger" role="button" tabindex="0" aria-label="打开用户菜单">
          <el-avatar class="portal-user-avatar" :size="30">
            {{ portalUser.avatar || portalUser.name?.charAt(0) }}
          </el-avatar>
          <span class="portal-user-name">{{ portalUser.name }}</span>
          <el-tag size="small" type="primary" effect="plain" class="portal-role-tag">
            {{ activePortalRoleName }}
          </el-tag>
          <AppIcon class="portal-user-caret" name="下拉箭头" :size="16" />
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <div class="portal-role-menu-header">切换角色</div>
            <el-dropdown-item
              v-for="role in portalRoles"
              :key="role.id"
              :command="`role:${role.id}`"
              class="portal-role-item"
            >
              <el-icon><UserFilled /></el-icon>
              <span>{{ role.name }}</span>
              <el-icon v-if="role.id === activePortalRole" class="portal-role-check">
                <Check />
              </el-icon>
            </el-dropdown-item>
            <el-dropdown-item v-if="!portalRoles.length" disabled>暂无可切换角色</el-dropdown-item>
            <el-dropdown-item divided command="nav-home" class="portal-return-item">
              <AppIcon name="左" :size="18" />
              <span>返回应用包管理</span>
            </el-dropdown-item>
            <el-dropdown-item class="is-danger portal-logout-item" command="logout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <div class="ph-body">
      <!-- ============ 左栏：分组菜单搜索 + 顶级加号 + 分组树 ============ -->
      <aside class="ph-aside">
        <!-- 设计稿：默认态 [搜索 127 | 排序 ≡ | 添加 +]；搜索态输入框撑满 208 且两个按钮隐藏；
             排序态 [搜索 167 | 退出排序 ⇥]（加号隐藏） -->
        <div v-if="!isPortal" class="aside-search" :class="{ 'is-searching': !!keyword }">
          <PackageSearchInput
            v-model="keyword"
            class="aside-search-input"
            placeholder="请输入"
            :disabled="sortMode"
          />
          <!-- 排序按钮（仅 icon）：点击进入 / 退出排序状态，分组与应用可拖拽排序、跨组移动 -->
          <AppTooltip v-if="!keyword" :content="sortMode ? '退出排序' : '排序'" placement="bottom">
            <el-button
              class="sort-toggle"
              :class="{ sorting: sortMode }"
              size="small"
              @click="toggleSort"
            >
              <RiLogoutBoxRLine v-if="sortMode" :size="18" />
              <RiSortAsc v-else :size="18" />
            </el-button>
          </AppTooltip>
          <el-dropdown
            v-if="!sortMode && !keyword"
            v-model:visible="rootCreateMenuVisible"
            trigger="click"
            placement="bottom-start"
            popper-class="root-create-dropdown"
            @command="onRootPlusCommand"
          >
            <el-button id="root-plus-btn" class="root-plus" size="small">
              <RiAddLine :size="18" />
            </el-button>
            <!-- 菜单顺序：先「新建各类应用」，「添加已有应用 / 添加审批助手」置于末尾，
                 最后是「新建分组」；已接入审批助手时不再出现「添加审批助手」。
                 2026-10-11 本版：原「添加 URL」项已去掉 -->
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="form">新建表单</el-dropdown-item>
                <el-dropdown-item command="approval">新建审批</el-dropdown-item>
                <el-dropdown-item command="chart">新建仪表盘</el-dropdown-item>
                <el-dropdown-item command="query">新建信息查询</el-dropdown-item>
                <el-dropdown-item command="report">新建报表</el-dropdown-item>
                <el-dropdown-item command="paper">新建报告</el-dropdown-item>
                <el-dropdown-item divided command="existing">添加已有应用</el-dropdown-item>
                <el-dropdown-item v-if="!hasApprovalHelper" command="helper"
                  >添加审批助手</el-dropdown-item
                >
                <el-dropdown-item divided command="group">新建分组</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <el-scrollbar id="menu-tree-zone" class="aside-tree" always>
          <MenuTree
            :groups="groups"
            :apps="apps"
            :selected-id="selectedId"
            :keyword="keyword"
            :sort-mode="sortMode"
            :drag-ctx="dragCtx"
            :readonly="isPortal"
            @select="selectApp"
            @plus-command="onPlusCommand"
            @group-command="onGroupCommand"
            @app-command="onAppCommand"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
            @drop-group="onDropGroup"
            @drop-app="onDropApp"
            @drop-root="onDropRoot"
          />
        </el-scrollbar>

        <!-- 左下：应用后台 -->
        <div
          v-if="!isPortal"
          id="app-backend-entry"
          class="aside-footer"
          @click="$router.push('/builder/admin/base-info')"
        >
          <AppIcon name="应用后台" :size="18" />
          <span>应用后台</span>
          <el-icon class="arrow-right"><ArrowRight /></el-icon>
        </div>
      </aside>

      <!-- ============ 右大区：功能预览区 ============ -->
      <section class="ph-preview">
        <AppPreview :app="selectedApp" nested-only @perm-group-change="onPermGroupChange" />
      </section>
    </div>

    <!-- ============ 新建引擎应用 ============ -->
    <el-dialog
      v-model="createDialog.show"
      :title="`新建${createDialog.engineLabel}`"
      width="420px"
      append-to-body
      align-center
      class="ph-dialog ph-dialog--form"
    >
      <el-form class="ph-dialog-form" label-width="88px">
        <el-form-item label="所属分组">
          <el-select
            v-model="createDialog.groupId"
            clearable
            placeholder="顶级（不分组）"
            class="full ph-dialog-select"
            popper-class="ph-dialog-select-popper"
            fit-input-width
          >
            <el-option v-for="g in groupOptions" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用名称" required>
          <BaseTextInput
            v-model="createDialog.name"
            :placeholder="`请输入${createDialog.engineLabel}名称`"
            maxlength="30"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="ph-dialog-actions">
          <el-button @click="createDialog.show = false">取消</el-button>
          <el-button type="primary" @click="submitCreate">创建</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 添加已有应用 ============
         2026-10-11（PRD v2.7 模块五）：① 可选范围仅限「本应用包中创建过的应用」；
         ② 同一应用允许多入口（可重复添加）；③ 表单 / 审批必须逐个明确选定前台 / 后台形态，不预设默认值 -->
    <el-dialog
      v-model="existingDialog.show"
      width="560px"
      append-to-body
      align-center
      class="ph-dialog ph-dialog--list"
    >
      <template #header>
        <div class="existing-dialog-header">
          <span class="el-dialog__title">添加已有应用（本应用包创建过的应用）</span>
          <p class="existing-tip">仅可选择本应用包中创建过的应用；表单 / 审批需先选定前台或后台形态</p>
        </div>
      </template>
      <el-scrollbar v-if="pkgCreatedApps.length" class="existing-scrollbar" always>
        <div class="existing-list">
          <div v-for="m in pkgCreatedApps" :key="m.id" class="existing-item">
            <el-checkbox
              :model-value="!!existingDialog.picked[m.id]"
              @change="(v) => toggleExisting(m, v)"
            />
            <div class="existing-app-info">
              <EngineIcon :engine="m.engine" color="var(--text-1)" />
              <span class="m-name">{{ m.name }}</span>
            </div>
            <div class="m-meta">
              <!-- 表单 / 审批：必须显式选定形态（前台 / 后台均不预设默认值） -->
              <el-radio-group
                v-if="existingDialog.picked[m.id] && needDisplayMode(m.engine)"
                v-model="existingDialog.picked[m.id].displayMode"
                class="m-mode"
                size="small"
              >
                <el-radio-button value="front">前台</el-radio-button>
                <el-radio-button value="back">后台</el-radio-button>
              </el-radio-group>
              <span class="m-from">来自：{{ m.from }}</span>
            </div>
          </div>
        </div>
      </el-scrollbar>
      <el-empty
        v-if="!pkgCreatedApps.length"
        description="本应用包暂无创建过的应用（可在加号菜单新建六类应用）"
        :image-size="64"
      />
      <template #footer>
        <div class="ph-dialog-actions">
          <el-button @click="existingDialog.show = false">取消</el-button>
          <el-button type="primary" :disabled="!canSubmitExisting" @click="submitExisting"
            >添加</el-button
          >
        </div>
      </template>
    </el-dialog>

    <!-- ============ 新建分组 / 子分组 ============ -->
    <el-dialog
      v-model="groupDialog.show"
      :title="groupDialog.parentId ? '新建子分组' : '新建分组'"
      width="380px"
      append-to-body
      align-center
      class="ph-dialog ph-dialog--form"
    >
      <el-form class="ph-dialog-form" label-position="top">
        <el-form-item label="分组名称" required>
          <BaseTextInput
            v-model="groupDialog.name"
            placeholder="请输入分组名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="ph-dialog-actions">
          <el-button @click="groupDialog.show = false">取消</el-button>
          <el-button type="primary" @click="submitGroup">创建</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 修改名称和图标 ============ -->
    <el-dialog
      v-model="groupRenameDialog.show"
      title="修改分组名称"
      width="380px"
      append-to-body
      align-center
      class="ph-dialog ph-dialog--form"
    >
      <el-form class="ph-dialog-form" label-position="top">
        <el-form-item label="分组名称" required>
          <BaseTextInput
            v-model="groupRenameDialog.name"
            placeholder="请输入分组名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="ph-dialog-actions">
          <el-button @click="groupRenameDialog.show = false">取消</el-button>
          <el-button type="primary" @click="submitGroupRename">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 删除分组：复用 Element Plus Dialog / Button ============ -->
    <el-dialog
      v-model="groupDeleteDialog.show"
      title="删除分组"
      width="440px"
      append-to-body
      align-center
      class="ph-dialog ph-dialog--confirm"
    >
      <p class="ph-group-delete-copy">
        确认删除分组「{{ groupDeleteDialog.name }}」吗？其子分组及组内应用入口将一并从应用包移除，应用仍保留在应用市场。
      </p>
      <template #footer>
        <div class="ph-dialog-actions">
          <el-button :disabled="groupDeleteDialog.submitting" @click="groupDeleteDialog.show = false"
            >取消</el-button
          >
          <el-button type="danger" :loading="groupDeleteDialog.submitting" @click="submitGroupDelete">
            删除
          </el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="renameDialog.show"
      title="修改名称和图标"
      width="600px"
      append-to-body
      align-center
      class="ph-dialog ph-dialog--form ph-dialog--rename"
    >
      <el-form class="ph-dialog-form" label-width="72px">
        <el-form-item label="名称">
          <BaseTextInput v-model="renameDialog.name" maxlength="30" show-word-limit />
        </el-form-item>
        <el-form-item label="图标">
          <div class="icon-grid">
            <el-button
              v-for="ic in PRESET_ICONS"
              :key="ic.id"
              class="icon-cell"
              :style="{ '--icon-color': ic.color }"
              :class="{ active: renameDialog.iconPresetId === ic.id }"
              :aria-label="`选择${ic.id}图标`"
              @click="renameDialog.iconPresetId = ic.id"
            >
              <component :is="ic.icon" :size="20" color="#fff" aria-hidden="true" />
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="ph-dialog-actions">
          <el-button @click="renameDialog.show = false">取消</el-button>
          <el-button type="primary" @click="submitRename">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 切换前台 / 后台（表单、审批转后台必须关联权限组） ============ -->
    <el-dialog
      v-model="stageDialog.show"
      :title="stageDialog.viewMode === 'back' ? '切换为应用后台' : '切换为前台'"
      width="440px"
      append-to-body
      align-center
      class="ph-dialog ph-dialog--form"
    >
      <el-alert
        v-if="stageDialog.viewMode === 'back'"
        type="warning"
        :closable="false"
        show-icon
        class="stage-alert"
        :title="
          needPermGroup
            ? '该应用切换为应用后台时，必须关联权限组'
            : '切换后该应用进入应用后台管理，不在用户前台展示'
        "
      />
      <p v-else class="stage-alert-text">
        切换为前台后，用户可在业务应用包前台访问该应用
      </p>
      <el-form
        v-if="stageDialog.viewMode === 'back' && needPermGroup"
        label-width="92px"
        class="ph-dialog-form stage-form"
      >
        <el-form-item label="关联权限组" required>
          <el-select
            v-model="stageDialog.permGroupName"
            class="full ph-dialog-select"
            placeholder="请选择权限组"
            popper-class="ph-dialog-select-popper"
            fit-input-width
          >
            <el-option v-for="n in PERM_GROUP_NAMES" :key="n" :label="n" :value="n" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="ph-dialog-actions">
          <el-button @click="stageDialog.show = false">取消</el-button>
          <el-button type="primary" @click="submitStage">确认切换</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 删除应用入口：复用统一确认弹窗 ============ -->
    <el-dialog
      v-model="deleteDialog.show"
      title="删除应用"
      width="440px"
      append-to-body
      align-center
      class="ph-dialog ph-dialog--confirm"
    >
      <p class="ph-confirm-copy">确认删除「{{ deleteDialog.appName }}」的当前入口？</p>
      <template #footer>
        <div class="ph-dialog-actions">
          <el-button @click="deleteDialog.show = false">取消</el-button>
          <el-button type="danger" :loading="deleteDialog.submitting" @click="submitDelete">
            删除
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 查看引用视图 ============ -->
    <el-dialog
      v-model="refDialog.show"
      title="查看引用视图"
      width="460px"
      append-to-body
      align-center
      class="ph-dialog ph-dialog--data"
    >
      <div class="ref-app">{{ refDialog.appName }}</div>
      <el-empty v-if="!refDialog.list.length" description="未被包内其他应用引用" :image-size="72" />
      <el-table v-else :data="refDialog.list" class="ref-table" size="small">
        <el-table-column label="应用名称" prop="name" />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">{{ ENGINE_MAP[row.engine]?.label || row.engine }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <div class="ph-dialog-actions">
          <el-button type="primary" @click="refDialog.show = false">知道了</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 业务图谱（固定链接 + 动态参数＝包内应用 id 列表） ============ -->
    <el-dialog
      v-model="graphDialog"
      width="580px"
      append-to-body
      align-center
      class="ph-dialog ph-dialog--data"
    >
      <template #header>
        <div class="graph-dialog-header">
          <div class="el-dialog__title">业务图谱</div>
          <p class="graph-dialog-hint">业务图谱以固定链接打开，动态参数传入本包内全部应用 ID 列表</p>
        </div>
      </template>
      <BaseTextInput :model-value="graphUrl" type="textarea" :rows="3" readonly class="graph-url" />
      <template #footer>
        <div class="ph-dialog-actions">
          <el-button @click="copyGraph">复制链接</el-button>
          <el-button type="primary" @click="graphDialog = false">知道了</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 空白创建：补充应用包基础信息（进入搭建页后首个弹窗） ============ -->
    <el-dialog
      v-model="setupDialog.show"
      title="应用包基础信息"
      width="480px"
      append-to-body
      :close-on-click-modal="setupDialog.mode === 'edit'"
      :close-on-press-escape="setupDialog.mode === 'edit'"
      :show-close="setupDialog.mode === 'edit'"
      align-center
      class="ph-dialog ph-dialog--form ph-dialog--setup"
    >
      <el-scrollbar class="setup-scrollbar" always>
        <el-form class="ph-dialog-form" label-width="72px" @submit.prevent>
          <el-form-item label="名称" required>
            <BaseTextInput
              v-model="setupForm.name"
              maxlength="30"
              show-word-limit
              placeholder="请输入应用包名称"
            />
          </el-form-item>
          <el-form-item label="图标">
            <div class="icon-grid setup-icon-grid">
              <el-button
                v-for="ic in PRESET_ICONS"
                :key="ic.id"
                class="icon-cell"
                :style="{ '--icon-color': ic.color }"
                :class="{ active: !setupForm.icon.custom && setupForm.icon.presetId === ic.id }"
                :aria-label="`选择${ic.id}图标`"
                @click="pickSetupPreset(ic.id)"
              >
                <component :is="ic.icon" :size="20" color="#fff" aria-hidden="true" />
              </el-button>
            </div>
            <el-upload
              ref="setupUploadRef"
              class="setup-upload"
              :show-file-list="false"
              accept="image/png,image/jpeg"
              :before-upload="beforeIconUpload"
            >
              <div class="icon-upload-box" :class="{ active: !!setupForm.icon.custom }">
                <template v-if="setupForm.icon.custom">
                  <img :src="setupForm.icon.custom" alt="已上传图标" class="icon-preview" />
                  <el-button
                    text
                    class="setup-upload-remove"
                    aria-label="删除已上传图标"
                    @click.stop="clearSetupIcon"
                  >
                    <RiCloseLine :size="16" aria-hidden="true" />
                  </el-button>
                  <el-button link type="primary" class="setup-upload-retry" @click.stop="openSetupUploadPicker">
                    重新上传
                  </el-button>
                </template>
                <template v-else>
                  <el-icon :size="20"><Upload /></el-icon>
                  <span class="upload-text">自定义上传图标（PNG / JPG，≤ 1MB）</span>
                </template>
              </div>
            </el-upload>
          </el-form-item>
          <el-form-item label="描述">
            <BaseTextInput
              v-model="setupForm.desc"
              type="textarea"
              :rows="3"
              maxlength="200"
              show-word-limit
              placeholder="请输入应用包描述（选填）"
            />
          </el-form-item>
        </el-form>
      </el-scrollbar>
      <template #footer>
        <div class="ph-dialog-actions">
          <el-button
            type="primary"
            :disabled="!setupNameValid"
            :loading="setupSaving"
            @click="saveSetup"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ============ 新手引导：分步遮罩，逐步定位「新建分组 → 添加应用 → 配置菜单」 ============ -->
    <div v-if="guide.active" class="guide-mask">
      <!-- 挖洞高亮框 -->
      <div class="guide-spot" :style="guide.spotStyle" />
      <!-- 引导气泡 -->
      <div class="guide-pop" :style="guide.popStyle">
        <div class="guide-step-no">{{ guide.index + 1 }} / {{ guide.steps.length }}</div>
        <div class="guide-title">{{ guide.steps[guide.index].title }}</div>
        <div class="guide-desc">{{ guide.steps[guide.index].description }}</div>
        <div class="guide-actions">
          <el-button link type="primary" @click="finishGuide">跳过引导</el-button>
          <span class="guide-spacer" />
          <el-button v-if="guide.index > 0" @click="prevGuide">上一步</el-button>
          <el-button class="guide-next-button" type="primary" @click="nextGuide">
            {{ guide.index === guide.steps.length - 1 ? '完成' : '下一步' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { RiAddLine, RiCloseLine, RiLogoutBoxRLine, RiSortAsc } from '@remixicon/vue'
import { ENGINE_MAP, PRESET_ICONS, PERM_GROUP_NAMES, PERM_GROUP_REQUIRED } from '@/mock/pkgSeed'
import {
  fetchBuilderDetail,
  createPackage,
  updatePackage,
  createApp,
  addExistingApp,
  addApprovalHelper,
  createGroup,
  renameGroup,
  deleteGroup,
  renameApp,
  switchAppStage,
  fetchAppReferences,
  deleteApp,
  sortGroups,
  sortApps
} from '@/api/appPackage'
import { fetchPortalSummary } from '@/api/portal'
import AppPreview from '@/components/builder/AppPreview.vue'
import MenuTree from '@/components/builder/MenuTree.vue'
import PackageSearchInput from '@/components/PackageSearchInput.vue'
import AppIcon from '@/components/icons/AppIcon.vue'
import BaseTextInput from '@/components/BaseTextInput.vue'
import { setPkgVersion } from '@/api/pkgVersion'
import EngineIcon from '@/components/icons/EngineIcon.vue'
import PackageIcon from '@/components/icons/PackageIcon.vue'

const router = useRouter()
const route = useRoute()
const isPortal = computed(() => route.name === 'PortalHome')

const loading = ref(false)
const pkg = ref({ name: '' })
const groups = ref([])
const apps = ref([])
const marketApps = ref([])
const keyword = ref('')
const selectedId = ref('app-fb') // 默认选中线框 2 的后台表单，进入即可见后台数据管理页
const portalUser = ref({})
const portalRoles = ref([])
const activePortalRole = ref('')

const selectedApp = computed(() => apps.value.find((a) => a.id === selectedId.value) || null)
const groupOptions = computed(() => groups.value.slice().sort((a, b) => a.sort - b.sort))
const activePortalRoleName = computed(
  () => portalRoles.value.find((role) => role.id === activePortalRole.value)?.name || ''
)
// 审批助手每个应用包唯一：已接入后加号菜单不再显示「添加审批助手」
const hasApprovalHelper = computed(() => apps.value.some((a) => a.engine === 'approval-helper'))

async function loadDetail(portalRole) {
  loading.value = true
  try {
    if (isPortal.value) {
      const d = await fetchPortalSummary(portalRole || activePortalRole.value || undefined)
      portalUser.value = d.user || {}
      portalRoles.value = d.roles || []
      activePortalRole.value = d.activeRole || portalRoles.value[0]?.id || ''
      pkg.value = { name: d.pkgName, icon: {} }
      groups.value = d.groups
      apps.value = d.apps
      marketApps.value = []
      selectedId.value = d.defaultAppId || ''
      return
    }
    // 2026-10-11：可由业务应用包管理页带 pkgId 打开对应应用包（演示共用同一套分组 / 应用数据）
    const d = await fetchBuilderDetail(route.query.pkgId)
    pkg.value = d.pkg
    // 记录页面持有的版本号：写操作会带上做并发校验（PRD v3.0 模块十一）
    setPkgVersion(d.pkg.version, d.pkg.id)
    groups.value = d.groups
    apps.value = d.apps
    marketApps.value = d.marketApps || []
    if (!selectedApp.value) selectedId.value = d.apps[0]?.id || ''
  } finally {
    loading.value = false
  }
}

function onPortalUserCommand(command) {
  if (command.startsWith('role:')) {
    loadDetail(command.slice(5))
  } else if (command === 'logout') {
    logoutPortal()
  } else if (command === 'nav-home') {
    router.push('/package/manage')
  }
}

async function logoutPortal() {
  try {
    await ElMessageBox.confirm('退出后需重新登录才能访问应用包前台，确认退出登录？', '退出登录', {
      confirmButtonText: '退出登录',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  sessionStorage.setItem('portal-logged-out', '1')
  router.push({ path: '/portal/login', query: { loggedout: '1' } })
}

function selectApp(app) {
  selectedId.value = app.id
}

// ============ 拖拽排序（统一容器序列：容器 = 根 null / 某分组；直属子分组与直属应用共用 sort 序号） ============
const sortMode = ref(false)
const dragCtx = reactive({ type: '', id: '' })

function toggleSort() {
  sortMode.value = !sortMode.value
  dragCtx.type = ''
  dragCtx.id = ''
}
function onDragStart(type, id) {
  dragCtx.type = type
  dragCtx.id = id
}
function onDragEnd() {
  dragCtx.type = ''
  dragCtx.id = ''
}

function groupById(id) {
  return id ? groups.value.find((g) => g.id === id) : null
}
// 容器节点序列：直属子分组 + 直属应用，按统一 sort 排序，元素为 { kind, id, ref }
function containerNodes(containerId) {
  const gnodes = groups.value
    .filter((g) => (g.parentId || null) === containerId)
    .map((ref) => ({ kind: 'group', id: ref.id, ref }))
  const anodes = apps.value
    .filter((a) => (a.groupId || null) === containerId)
    .map((ref) => ({ kind: 'app', id: ref.id, ref }))
  return [...gnodes, ...anodes].sort((x, y) => x.ref.sort - y.ref.sort)
}
// candidateId 是否在 rootId 的子树内（沿父链上溯）
function isInsideSubtree(rootId, candidateId) {
  let cur = candidateId
  const seen = new Set()
  while (cur && !seen.has(cur)) {
    if (cur === rootId) return true
    seen.add(cur)
    cur = groupById(cur)?.parentId || null
  }
  return false
}
function depthOf(id) {
  let depth = 0
  let cur = id
  const seen = new Set()
  while (cur && !seen.has(cur)) {
    depth++
    seen.add(cur)
    cur = groupById(cur)?.parentId || null
  }
  return depth
}
function subtreeHeight(id) {
  const kids = groups.value.filter((g) => g.parentId === id)
  return kids.length ? 1 + Math.max(...kids.map((k) => subtreeHeight(k.id))) : 1
}

// 锚点插入下标：在容器序列中先排除被拖节点自身，再按锚点（分组行 / 应用行）取 before / after 位置，
// 避免同容器拖动时被拖节点自身占位导致下标偏移
function anchorIndex(containerId, anchorKind, anchorId, zone, dragType, dragId) {
  const seq = containerNodes(containerId).filter((n) => !(n.kind === dragType && n.id === dragId))
  const i = seq.findIndex((n) => n.kind === anchorKind && n.id === anchorId)
  if (i === -1) return seq.length
  return zone === 'after' ? i + 1 : i
}

// 拖到分组行：zone = before / after（与分组同父级的前后位置）、into（置入组内末尾）、into-first（展开态下沿 = 组内首位）
async function onDropGroup(targetId, zone) {
  const { type, id } = dragCtx
  if (!type || !id) return
  const target = groupById(targetId)
  if (!target) return
  const parentContainer = target.parentId || null

  if (type === 'app') {
    if (zone === 'into') await moveAppTo(id, targetId, null)
    else if (zone === 'into-first') await moveAppTo(id, targetId, 0)
    else {
      const at = anchorIndex(parentContainer, 'group', targetId, zone, type, id)
      await moveAppTo(id, parentContainer, at)
    }
  } else if (type === 'group') {
    if (zone === 'into') await moveGroupTo(id, targetId, null)
    else {
      const at = anchorIndex(parentContainer, 'group', targetId, zone, type, id)
      await moveGroupTo(id, parentContainer, at)
    }
  }
}

// 拖到应用行：以该行为锚点，在其所属容器（根 null / 某分组）中前 / 后落位；应用、分组均可锚定
async function onDropApp(anchorAppId, zone) {
  const { type, id } = dragCtx
  if (!id) return
  if (type === 'app' && id === anchorAppId) return
  const anchor = apps.value.find((a) => a.id === anchorAppId)
  if (!anchor) return
  const containerId = anchor.groupId || null
  const at = anchorIndex(containerId, 'app', anchorAppId, zone, type, id)
  if (type === 'app') await moveAppTo(id, containerId, at)
  else await moveGroupTo(id, containerId, at)
}

// 根级末尾落位区：应用 = 移到分组外；分组 = 置于顶级末尾
async function onDropRoot() {
  const { type, id } = dragCtx
  if (!id) return
  if (type === 'app') await moveAppTo(id, null, null)
  else await moveGroupTo(id, null, null)
}

// 对操作前的归属 / 序号打快照，用于判断是否真的发生变化
function snapshot() {
  return {
    apps: apps.value.map((a) => `${a.id}:${a.groupId || '0'}:${a.sort}`),
    groups: groups.value.map((g) => `${g.id}:${g.parentId || '0'}:${g.sort}`)
  }
}
function snapshotChanged(before) {
  const after = snapshot()
  return {
    appsChanged:
      after.apps.some((s, i) => s !== before.apps[i]) || after.apps.length !== before.apps.length,
    groupsChanged:
      after.groups.some((s, i) => s !== before.groups[i]) ||
      after.groups.length !== before.groups.length
  }
}
// 按变更内容提交：应用序 / 归属走 sortApps，分组序 / 父子关系走 sortGroups（混合序列重编号可能同时改变两者）。
// 两个端点都会递增应用包版本，必须串行调用，确保第二次请求携带第一次保存后同步的新版本。
async function commitSort(before, successMsg) {
  const changed = snapshotChanged(before)
  if (!changed.appsChanged && !changed.groupsChanged) return
  try {
    if (changed.appsChanged) {
      await sortApps(
        apps.value.map((a) => ({ id: a.id, groupId: a.groupId || null, sort: a.sort }))
      )
    }
    if (changed.groupsChanged) {
      await sortGroups(
        groups.value.map((g) => ({ id: g.id, parentId: g.parentId || null, sort: g.sort }))
      )
    }
    ElMessage.success(successMsg)
  } catch (e) {
    ElMessage.error(e.message || '排序保存失败，请重试')
  } finally {
    await loadDetail()
  }
}

// 把应用移动到目标容器（根 = null / 分组 id）的指定位置；index = null 表示追加到容器末尾
async function moveAppTo(dragAppId, containerId, index) {
  const drag = apps.value.find((a) => a.id === dragAppId)
  if (!drag) return
  containerId = containerId || null
  const oldContainer = drag.groupId || null
  const before = snapshot()

  const seq = containerNodes(containerId).filter((n) => !(n.kind === 'app' && n.id === dragAppId))
  const idx = Math.max(0, Math.min(index === null ? seq.length : index, seq.length))
  drag.groupId = containerId
  seq.splice(idx, 0, { kind: 'app', id: dragAppId, ref: drag })
  seq.forEach((n, i) => {
    n.ref.sort = i
  })
  if (oldContainer !== containerId) {
    containerNodes(oldContainer).forEach((n, i) => {
      n.ref.sort = i
    })
  }

  let msg
  if (oldContainer === containerId) msg = '应用顺序已保存'
  else msg = containerId ? `已移入分组「${groupById(containerId)?.name}」` : '已移到分组外（顶级）'
  await commitSort(before, msg)
}

// 把分组移动到目标父容器（根 = null / 分组 id）的指定位置；index = null 表示追加末尾；子树随动
async function moveGroupTo(dragGroupId, newParentId, index) {
  const drag = groupById(dragGroupId)
  if (!drag) return
  newParentId = newParentId || null
  if (newParentId && (newParentId === dragGroupId || isInsideSubtree(dragGroupId, newParentId))) {
    ElMessage.warning('不能将分组拖入其自身或子分组')
    return
  }
  if (newParentId && depthOf(newParentId) + subtreeHeight(dragGroupId) > 5) {
    ElMessage.warning('分组最多支持 5 级层级，无法拖入')
    return
  }
  const oldParentId = drag.parentId || null
  const before = snapshot()

  const seq = containerNodes(newParentId).filter(
    (n) => !(n.kind === 'group' && n.id === dragGroupId)
  )
  const idx = Math.max(0, Math.min(index === null ? seq.length : index, seq.length))
  drag.parentId = newParentId
  seq.splice(idx, 0, { kind: 'group', id: dragGroupId, ref: drag })
  seq.forEach((n, i) => {
    n.ref.sort = i
  })
  if (oldParentId !== newParentId) {
    containerNodes(oldParentId).forEach((n, i) => {
      n.ref.sort = i
    })
  }

  const msg = newParentId ? `已移入分组「${groupById(newParentId)?.name}」` : '已移到顶级'
  await commitSort(before, msg)
}

// ============ 退出（退出搭建页，回业务应用包管理页面；PRD v3.0 模块十四） ============
function exitPackage() {
  router.push('/package/manage')
}

// ============ 加号菜单（顶级 group=null；分组行携带 group 上下文） ============
const createDialog = reactive({ show: false, engine: '', engineLabel: '', name: '', groupId: null })
const existingDialog = reactive({ show: false, picked: {}, groupId: null })
const groupDialog = reactive({ show: false, name: '', parentId: null })
const groupRenameDialog = reactive({ show: false, groupId: '', name: '' })
const groupDeleteDialog = reactive({ show: false, groupId: '', name: '', submitting: false })
const rootCreateMenuVisible = ref(false)

function onRootPlusCommand(cmd) {
  rootCreateMenuVisible.value = false
  onPlusCommand(cmd, null)
}

function closeRootCreateMenuOnOutsidePointerDown(event) {
  if (!rootCreateMenuVisible.value || !(event.target instanceof Element)) return
  if (event.target.closest('#root-plus-btn, .root-create-dropdown')) return
  rootCreateMenuVisible.value = false
}

function onPlusCommand(cmd, group) {
  const groupId = group ? group.id : null
  if (cmd === 'existing') {
    Object.assign(existingDialog, { show: true, picked: {}, groupId })
  } else if (cmd === 'helper') {
    addHelper(groupId)
  } else if (cmd === 'group') {
    Object.assign(groupDialog, { show: true, name: '', parentId: null })
  } else if (cmd === 'subgroup') {
    Object.assign(groupDialog, { show: true, name: '', parentId: groupId })
  } else if (ENGINE_MAP[cmd]) {
    Object.assign(createDialog, {
      show: true,
      engine: cmd,
      engineLabel: ENGINE_MAP[cmd].label,
      name: '',
      groupId
    })
  }
}

async function submitCreate() {
  if (!createDialog.name.trim()) {
    ElMessage.warning('请输入应用名称')
    return
  }
  const app = await createApp({
    engine: createDialog.engine,
    name: createDialog.name,
    groupId: createDialog.groupId
  })
  createDialog.show = false
  ElMessage.success(`已创建${createDialog.engineLabel}，默认为前台应用`)
  selectedId.value = app.id
  await loadDetail()
}

const pkgCreatedApps = computed(() => marketApps.value)

/** 表单 / 审批需用户显式选定前台 / 后台形态（与 PRD「区分前后台」口径一致） */
const needDisplayMode = (engine) => PERM_GROUP_REQUIRED.includes(engine)

function toggleExisting(m, checked) {
  if (checked) {
    // 形态不预设默认值：表单 / 审批先置空，由用户选择后才可提交
    existingDialog.picked[m.id] = { appId: m.id, engine: m.engine, displayMode: '' }
  } else {
    delete existingDialog.picked[m.id]
  }
}

const pickedList = computed(() => Object.values(existingDialog.picked))
const canSubmitExisting = computed(
  () =>
    pickedList.value.length > 0 &&
    pickedList.value.every((p) => !needDisplayMode(p.engine) || !!p.displayMode)
)

async function submitExisting() {
  if (!canSubmitExisting.value) return
  for (const p of pickedList.value) {
    await addExistingApp({
      appId: p.appId,
      displayMode: p.displayMode || undefined,
      groupId: existingDialog.groupId
    })
  }
  existingDialog.show = false
  ElMessage.success(
    pickedList.value.length > 1 ? `已添加 ${pickedList.value.length} 个入口` : '已添加到应用包'
  )
  selectedId.value = ''
  await loadDetail()
}

async function addHelper(groupId) {
  try {
    const app = await addApprovalHelper({ groupId })
    ElMessage.success('审批助手已接入本应用包')
    selectedId.value = app.id
    await loadDetail()
  } catch {
    // 每个应用包仅可接入一个审批助手；已接入后加号菜单里不再出现该项，此处不再弹错误提示
  }
}

async function submitGroup() {
  if (!groupDialog.name.trim()) {
    ElMessage.warning('请输入分组名称')
    return
  }
  if (groupDialog.parentId && depthOf(groupDialog.parentId) >= 5) {
    ElMessage.warning('分组最多支持 5 级层级，无法新建子分组')
    return
  }
  await createGroup({ name: groupDialog.name, parentId: groupDialog.parentId })
  groupDialog.show = false
  ElMessage.success(groupDialog.parentId ? '子分组已创建' : '分组已创建')
  await loadDetail()
}

async function onGroupCommand(command, group) {
  if (command === 'rename') {
    Object.assign(groupRenameDialog, { show: true, groupId: group.id, name: group.name })
    return
  }
  if (command !== 'delete') return
  Object.assign(groupDeleteDialog, {
    show: true,
    groupId: group.id,
    name: group.name,
    submitting: false
  })
}

async function submitGroupDelete() {
  if (!groupDeleteDialog.groupId || groupDeleteDialog.submitting) return
  groupDeleteDialog.submitting = true
  try {
    const data = await deleteGroup(groupDeleteDialog.groupId)
    const removedAppIds = new Set((data.removedApps || []).map((app) => app.id))
    if (removedAppIds.has(selectedId.value)) selectedId.value = ''
    groupDeleteDialog.show = false
    ElMessage.success(data.message || '分组已删除')
    await loadDetail()
  } catch (error) {
    ElMessage.error(error.message || '删除分组失败，请重试')
  } finally {
    groupDeleteDialog.submitting = false
  }
}

async function submitGroupRename() {
  const name = groupRenameDialog.name.trim()
  if (!name) {
    ElMessage.warning('请输入分组名称')
    return
  }
  await renameGroup({ id: groupRenameDialog.groupId, name })
  groupRenameDialog.show = false
  ElMessage.success('分组名称已修改')
  await loadDetail()
}

// ============ 应用 ••• 菜单 ============
const renameDialog = reactive({ show: false, appId: '', name: '', iconPresetId: '' })
const stageDialog = reactive({ show: false, appId: '', viewMode: 'front', permGroupName: '' })
const refDialog = reactive({ show: false, appName: '', list: [] })
const deleteDialog = reactive({ show: false, appId: '', appName: '', submitting: false })

async function onAppCommand(cmd, app) {
  if (cmd === 'edit') {
    selectedId.value = app.id
    ElMessage.info(`进入「${app.name}」应用编辑器（演示环境以预览代替）`)
  } else if (cmd === 'rename') {
    Object.assign(renameDialog, {
      show: true,
      appId: app.id,
      name: app.name,
      iconPresetId: app.iconPresetId || 'ic-flag'
    })
  } else if (cmd === 'switch-stage') {
    const toBack = app.viewMode !== 'back'
    Object.assign(stageDialog, {
      show: true,
      appId: app.id,
      viewMode: toBack ? 'back' : 'front',
      permGroupName: app.permGroupName || PERM_GROUP_NAMES[0]
    })
  } else if (cmd === 'references') {
    const data = await fetchAppReferences(app.id)
    Object.assign(refDialog, { show: true, appName: app.name, list: data.refBy })
  } else if (cmd === 'delete') {
    // 2026-10-11：删除粒度为「当前这一个入口」；弹窗为简单二次确认，
    // 不列出该应用在包内的其他入口、也不列出引用情况（需要看引用关系走「查看引用视图」）
    Object.assign(deleteDialog, { show: true, appId: app.id, appName: app.name, submitting: false })
  }
}

async function submitDelete() {
  if (!deleteDialog.appId || deleteDialog.submitting) return
  deleteDialog.submitting = true
  try {
    const data = await deleteApp(deleteDialog.appId)
    deleteDialog.show = false
    ElMessage.success(data.message || '已从应用包移除，应用保留在应用市场')
    if (selectedId.value === deleteDialog.appId) selectedId.value = ''
    await loadDetail()
  } finally {
    deleteDialog.submitting = false
  }
}

const needPermGroup = computed(() => {
  const app = apps.value.find((a) => a.id === stageDialog.appId)
  return app ? PERM_GROUP_REQUIRED.includes(app.engine) : false
})

async function submitRename() {
  await renameApp({
    id: renameDialog.appId,
    name: renameDialog.name,
    iconPresetId: renameDialog.iconPresetId
  })
  renameDialog.show = false
  ElMessage.success('已保存')
  await loadDetail()
}

/**
 * 预览区右上角切换关联权限组（2026-10-11）：选择后**自动保存**，无需再点按钮。
 * 走与应用后台「权限设置」同一份配置（模块五/八），保存后重拉详情使预览与左栏同步。
 */
async function onPermGroupChange(name) {
  const app = selectedApp.value
  if (!app || !name || name === app.permGroupName) return
  await switchAppStage(app.id, { viewMode: 'back', permGroupName: name })
  ElMessage.success(`已关联权限组「${name}」，改动已自动保存`)
  await loadDetail()
}

async function submitStage() {
  if (needPermGroup.value && !stageDialog.permGroupName) {
    ElMessage.warning('请选择关联权限组')
    return
  }
  const app = await switchAppStage(stageDialog.appId, {
    viewMode: stageDialog.viewMode,
    permGroupName: stageDialog.permGroupName
  })
  stageDialog.show = false
  ElMessage.success(
    app.viewMode === 'back' ? `已切换为应用后台（${app.permGroupName}）` : '已切换为前台'
  )
  await loadDetail()
}

// ============ 业务图谱 ============
const graphDialog = ref(false)
const graphUrl = computed(() => {
  const ids = apps.value.map((a) => a.id).join(',')
  return `https://demo.example.com/app-graph?pkgId=pkg-1&appIds=${ids}`
})
function openGraph() {
  graphDialog.value = true
}
async function copyGraph() {
  try {
    await navigator.clipboard.writeText(graphUrl.value)
    ElMessage.success('固定链接已复制')
  } catch {
    ElMessage.info('请手动选择复制链接')
  }
}

// 2026-10-11 本版：业务维护 AI 助手整体去掉（原「应用包 AI 助手」抽屉、
// aiMessages / AI_RULES 关键词回复、sendAi 与顶栏 AI 入口一并移除）

// ============ 空白创建：补充基础信息弹窗 + 分步新手引导 ============
const setupDialog = reactive({ show: false, mode: 'create' })
const setupSaving = ref(false)
const setupUploadRef = ref(null)
const setupForm = reactive({
  name: '未命名业务应用包',
  desc: '',
  // 图标：系统推荐图标（内置占位，后续对接微服务图标库）或用户自定义上传
  icon: { presetId: 'ic-briefcase', custom: null }
})
const setupNameValid = computed(() => !!setupForm.name.trim())

function openPackageSetup() {
  setupForm.name = pkg.value.name || '未命名业务应用包'
  setupForm.desc = pkg.value.desc || ''
  setupForm.icon = { ...(pkg.value.icon || { presetId: PRESET_ICONS[0].id, custom: null }) }
  setupDialog.mode = 'edit'
  setupDialog.show = true
}

// 选择系统推荐图标（取消自定义上传）
function pickSetupPreset(presetId) {
  setupForm.icon = { presetId, custom: null }
}

// 自定义图标：限 PNG / JPG、≤ 1MB
function beforeIconUpload(file) {
  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    ElMessage.error('自定义图标仅支持 PNG / JPG 格式')
    return false
  }
  if (file.size > 1024 * 1024) {
    ElMessage.error('自定义图标大小不能超过 1MB')
    return false
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    setupForm.icon = {
      presetId: setupForm.icon.presetId || PRESET_ICONS[0].id,
      custom: e.target.result
    }
    ElMessage.success('图标已上传')
  }
  reader.readAsDataURL(file)
  return false // Demo 本地预览，阻止自动上传
}

function clearSetupIcon() {
  setupForm.icon = { presetId: setupForm.icon.presetId || PRESET_ICONS[0].id, custom: null }
}

function openSetupUploadPicker() {
  const input = setupUploadRef.value?.$el?.querySelector('input[type="file"]')
  if (!input) return
  input.value = ''
  input.click()
}

async function saveSetup() {
  setupSaving.value = true
  try {
    if (setupDialog.mode === 'edit') {
      pkg.value = await updatePackage({
        name: setupForm.name,
        desc: setupForm.desc,
        icon: setupForm.icon
      })
      setupDialog.show = false
      ElMessage.success('应用包基础信息已保存')
      return
    }

    const createdPkg = await createPackage({
      name: setupForm.name,
      desc: setupForm.desc,
      icon: setupForm.icon
    })
    setupDialog.show = false
    ElMessage.success('应用包已创建')
    await router.replace({ path: '/builder/home', query: { pkgId: createdPkg.id } })
    await loadDetail()
    await startGuide()
  } catch (e) {
    ElMessage.error((setupDialog.mode === 'edit' ? '保存' : '创建') + '失败：' + e.message)
  } finally {
    setupSaving.value = false
  }
}

// 新手引导：分步遮罩，每步点「下一步」，依次引导新建分组、添加应用、配置菜单
const GUIDE_STEPS = [
  {
    // el-dropdown 会覆盖触发器的 id，这里用 class 定位根加号
    target: '.root-plus',
    title: '第 1 步：新建分组',
    description:
      '点击搜索框旁的「加号」，选择「新建分组」，按业务场景创建分组（分组最多 5 级，不校验重名）。'
  },
  {
    target: '#menu-tree-zone',
    title: '第 2 步：添加应用',
    description:
      '通过分组名称右侧的「加号」添加已有应用、审批助手、URL，或新建表单 / 审批 / 仪表盘等应用；新建应用默认加入菜单。'
  },
  {
    target: '#app-backend-entry',
    title: '第 3 步：配置菜单',
    description:
      '点击左下角「应用后台」，配置菜单权限与应用权限，以及聚合表 / 业务流 / 数据工厂；改动点保存即生效，无需发布。'
  }
]

const guide = reactive({
  active: false,
  index: 0,
  steps: GUIDE_STEPS,
  spotStyle: {},
  popStyle: {}
})

const GUIDE_POP_W = 340
const GUIDE_POP_H = 190
const GUIDE_PAD = 6 // 高亮框与目标元素的间距

// 按当前步骤目标元素的位置，计算高亮框与气泡坐标
function layoutGuide() {
  const el = document.querySelector(GUIDE_STEPS[guide.index].target)
  if (!el) return
  const r = el.getBoundingClientRect()
  guide.spotStyle = {
    left: `${r.left - GUIDE_PAD}px`,
    top: `${r.top - GUIDE_PAD}px`,
    width: `${r.width + GUIDE_PAD * 2}px`,
    height: `${r.height + GUIDE_PAD * 2}px`
  }
  // 气泡优先放高亮框右侧（顶部与高亮框对齐）；右侧空间不足时退回下方
  let left = r.right + GUIDE_PAD + 10
  let top = r.top - GUIDE_PAD
  if (left + GUIDE_POP_W <= window.innerWidth - 12) {
    top = Math.min(Math.max(12, top), window.innerHeight - GUIDE_POP_H - 12)
  } else {
    left = Math.max(12, r.left - GUIDE_PAD)
    top = r.bottom + GUIDE_PAD + 10
    if (top + GUIDE_POP_H > window.innerHeight - 12) top = r.top - GUIDE_PAD - GUIDE_POP_H - 10
    top = Math.max(12, top)
  }
  guide.popStyle = { left: `${left}px`, top: `${top}px`, width: `${GUIDE_POP_W}px` }
}

async function startGuide() {
  guide.index = 0
  guide.active = true
  await nextTick()
  layoutGuide()
  window.addEventListener('resize', layoutGuide)
}
function nextGuide() {
  if (guide.index >= GUIDE_STEPS.length - 1) {
    finishGuide()
    return
  }
  guide.index++
  layoutGuide()
}
function prevGuide() {
  if (guide.index > 0) {
    guide.index--
    layoutGuide()
  }
}
function finishGuide() {
  guide.active = false
  window.removeEventListener('resize', layoutGuide)
}

onMounted(async () => {
  document.addEventListener('pointerdown', closeRootCreateMenuOnOutsidePointerDown, true)
  if (route.query.setup === '1') {
    // 空白创建进入：先弹窗补基础信息，完成后再加载详情并启动新手引导
    setupDialog.show = true
    return
  }
  await loadDetail()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeRootCreateMenuOnOutsidePointerDown, true)
})
</script>

<style scoped>
.pkg-home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f8ff;
  position: relative;
}

/* 顶栏（设计稿：64px 高、浅蓝白底、无分割线） */
.ph-header {
  height: var(--builder-header-height);
  flex-shrink: 0;
  background: transparent;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
}
/* 退出：与外层列表页入口统一为 36×36 圆角方块。 */
.exit-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  background: var(--fill-1);
  color: var(--text-1) !important;
  flex-shrink: 0;
}
.exit-btn:hover {
  --el-button-hover-border-color: var(--color-primary);
  background: var(--brand-7);
  border-color: var(--color-primary);
  color: var(--brand-1) !important;
}
.exit-btn :deep(.el-icon) {
  color: inherit;
}
.exit-icon {
  font-size: 20px;
}
.ph-app-icon {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  flex-shrink: 0;
}
.ph-app-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.ph-app-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.ph-app-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.package-edit-btn {
  width: 24px;
  height: 24px;
  min-height: 24px;
  padding: 0;
  border: 0;
  box-shadow: none;
  color: var(--text-2);
}
.package-edit-btn:hover,
.package-edit-btn:focus-visible {
  color: var(--color-primary);
  box-shadow: none;
}
/* 业务图谱：设计稿为深色文字（14px/400）、图标右缘到文字左缘 4px */
.graph-btn {
  color: var(--text-1) !important;
  font-weight: 400;
}
.graph-inner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.graph-btn:hover {
  color: var(--brand-1) !important;
}
.header-right {
  margin-left: auto;
  display: flex;
  align-items: center;
  /* 设计稿：AI 图标与业务图谱间距 17px；2026-10-11 去掉发布按钮后为顶栏最右元素 */
  gap: 17px;
}

/* 前台用户入口与应用包列表页保持同一组头像、姓名和下拉箭头节奏。 */
.portal-user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  outline: none;
  transition: background var(--motion-hover);
}
.portal-user-dropdown {
  flex-shrink: 0;
  margin-left: auto;
}
.portal-user-trigger:hover,
.portal-user-trigger:focus-visible {
  background: var(--fill-1);
}
.portal-user-avatar {
  flex-shrink: 0;
  background: var(--color-primary);
  color: var(--color-text-anti);
  font-size: 16px;
  font-weight: 600;
}
.portal-user-name {
  color: var(--text-1);
  font-size: 14px;
  white-space: nowrap;
}
.portal-role-tag {
  margin-left: 2px;
  font-weight: 600;
  --el-tag-text-color: var(--color-primary);
  --el-tag-bg-color: color-mix(in srgb, var(--el-tag-text-color) 10%, transparent);
  --el-tag-border-color: color-mix(in srgb, var(--el-tag-text-color) 10%, transparent);
}
.portal-user-caret {
  color: var(--icon-1);
  flex-shrink: 0;
}

:global(.portal-user-menu.el-popper) {
  width: min(320px, calc(100vw - 16px));
}
:global(.portal-user-menu .portal-role-menu-header) {
  padding: 10px 14px 8px;
  color: var(--text-2);
  font-size: 14px;
  line-height: 1.5;
}
:global(.portal-user-menu .portal-role-item) {
  display: flex;
  align-items: center;
  gap: 8px;
}
:global(.portal-user-menu .portal-return-item) {
  display: flex;
  align-items: center;
  gap: 8px;
}
:global(.portal-user-menu .portal-logout-item) {
  display: flex;
  align-items: center;
  gap: 8px;
}
:global(.portal-user-menu .portal-role-item .portal-role-check) {
  margin-left: auto;
  color: var(--color-primary);
}
:global(.portal-user-menu .el-dropdown-menu__item .el-icon) {
  flex-shrink: 0;
  margin-right: 0;
  font-size: 18px;
}
:global(.portal-user-menu .el-dropdown-menu__item > span) {
  min-width: 0;
}

.ph-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* 左栏（设计稿：240px 宽、与顶栏同底、无分割线） */
.ph-aside {
  width: var(--builder-aside-width);
  min-width: var(--builder-aside-width);
  max-width: var(--builder-aside-width);
  flex-shrink: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 覆盖页面一致性样式中的侧栏底色，统一继承应用列表页背景。 */
.pkg-home.ai-surface-page .ph-aside {
  background: transparent;
  border-right: 0;
}
.aside-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 8px;
}
/* 复用应用包列表页的搜索输入框；此处只负责在侧栏中分配宽度。 */
.aside-search-input {
  flex: 1 1 auto;
  min-width: 0;
}
/* 设计稿：图标墨迹左缘距输入框左缘 12.8px、文字左缘距 40.1px */
/* 设计稿：排序态搜索框整体置灰（排序期间不可搜索） */
.aside-search :deep(.aside-search-input.is-disabled .el-input__wrapper) {
  background: var(--fill-2);
  box-shadow: 0 0 0 1px var(--border-2) inset;
}
.aside-search :deep(.aside-search-input.is-disabled .el-input__inner) {
  color: var(--text-4);
  -webkit-text-fill-color: var(--text-4);
}
.aside-search :deep(.aside-search-input.is-disabled .el-input__prefix) {
  color: var(--text-4);
}
/* 排序 / 添加按钮统一为 36×36、10px 圆角的方形按钮（白底 + 细描边），不是圆形。 */
.sort-toggle,
.root-plus {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid var(--border-2);
  background: var(--fill-1);
}
.root-plus {
  color: var(--text-1);
}
.root-plus:hover {
  --el-button-hover-border-color: var(--color-primary);
  color: var(--brand-1);
  border-color: var(--color-primary);
  background: var(--brand-7);
}
/* 排序模式开关（根加号左侧，仅 icon）：设计稿基础态为三横线 + 箭头，排序中转为橙红「退出排序」 */
.sort-toggle {
  color: var(--text-2);
}
.sort-toggle:hover {
  --el-button-hover-border-color: var(--color-primary);
  color: var(--brand-1);
  border-color: var(--color-primary);
  background: var(--brand-7);
}
.sort-toggle.sorting {
  color: var(--icon-sort-exit);
}
.sort-toggle.sorting:hover {
  --el-button-hover-border-color: var(--color-primary);
  color: var(--icon-sort-exit);
  border-color: var(--color-primary);
  background: var(--brand-7);
}
.aside-tree {
  flex: 1;
  min-width: 0;
  min-height: 0;
  /* 纵向 flex：让树撑满树区高度，搜索空态才能在整块区域内居中 */
  display: flex;
  flex-direction: column;
}
.aside-tree :deep(.el-scrollbar__wrap) {
  overflow-x: hidden !important;
}
.aside-tree :deep(.el-scrollbar__bar.is-horizontal) {
  display: none;
}
.aside-tree :deep(.el-scrollbar__view) {
  min-height: 100%;
  min-width: 0;
}
/* 左下「应用后台」入口（设计稿：207×39、rx=7.5、白底描边、文字 14px/400 #12141A） */
.aside-footer {
  flex-shrink: 0;
  margin: 8px 16px 16px;
  height: 39px;
  background: var(--fill-1);
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  /* 设计稿：图标左内边距 12、图标与文字间距 5 */
  gap: 5px;
  padding: 0 12px;
  font-size: 14px;
  color: var(--text-1);
  cursor: pointer;
  transition:
    color 0.15s ease,
    border-color 0.15s ease,
    background-color 0.15s ease;
}
.aside-footer:hover {
  border-color: var(--color-border-brand);
  color: var(--brand-1);
  background: var(--brand-7);
}
.aside-footer .arrow-right {
  margin-left: auto;
  font-size: 12px;
}

/* 右预览区：白色面板贴齐顶栏与左栏，右侧 / 下方留 16px 间距（设计稿） */
.ph-preview {
  flex: 1;
  min-width: 0;
  padding: 0 8px 8px 0;
  background: transparent;
  border: 0;
}
.ph-preview :deep(> div) {
  height: 100%;
  box-sizing: border-box;
  background: var(--fill-1);
  border: 1px solid var(--border-2);
  border-radius: 24px;
  overflow: hidden;
}

/* 顶栏 AI 助手图标入口（设计稿实测 27.6×26.3 ≈ 28px 彩色圆标） */
.ai-entry {
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.15s ease;
}
.ai-entry img {
  width: 28px;
  height: 28px;
  display: block;
}
.ai-entry:hover {
  opacity: 0.85;
}

.full {
  width: 100%;
}

/* 添加已有应用：标题辅助说明与连续列表。 */
.existing-dialog-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.existing-tip {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-3);
}
.m-mode {
  flex: none;
}
.m-mode :deep(.el-radio-button__inner) {
  font-size: 14px;
  border-radius: 0;
}
.m-mode :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: var(--radius-full) 0 0 var(--radius-full);
}
.m-mode :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 var(--radius-full) var(--radius-full) 0;
}
.m-meta {
  display: flex;
  flex: none;
  align-items: center;
  gap: 12px;
  min-width: 0;
  margin-left: auto;
}
.existing-list {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: hidden;
  border: 0;
  border-radius: var(--radius-md);
}
.existing-list::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  box-sizing: border-box;
  border: 1px solid var(--border-2);
  border-radius: inherit;
  content: '';
  pointer-events: none;
}
.existing-scrollbar {
  max-height: none;
}
.existing-scrollbar :deep(.el-scrollbar__view) {
  padding: 0;
}
.existing-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 0;
  border-bottom: 1px solid var(--border-2);
  border-radius: 0;
  margin: 0;
  width: 100%;
  background: var(--fill-1);
  transition:
    background-color 0.15s ease;
}
.existing-item:hover {
  background: var(--fill-2);
}
.existing-app-info {
  flex: 1 1 auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.m-name {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--text-1);
}
.m-from {
  flex: none;
  font-size: 14px;
  color: var(--text-3);
  white-space: nowrap;
}
.ph-dialog--list .el-dialog__footer .el-button--primary {
  --el-button-border-color: transparent;
  --el-button-hover-border-color: transparent;
  --el-button-active-border-color: transparent;
}

/* 图标选择 */
.icon-grid {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  background: var(--fill-1);
}
.icon-grid .icon-cell + .icon-cell {
  margin-left: 0;
}
.icon-cell {
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(135deg, var(--icon-color), color-mix(in srgb, var(--icon-color) 62%, #fff));
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    filter 0.15s ease,
    transform 0.15s ease;
}
.icon-cell:hover {
  border-color: var(--icon-color);
  filter: saturate(1.08) brightness(1.04);
}
.icon-cell.active {
  outline: 1.5px solid var(--brand-1);
  outline-offset: 1px;
}
/* 基础信息弹窗：推荐图标与上传区的间距 */
.setup-icon-grid {
  margin-bottom: 8px;
}
.setup-icon-grid .icon-cell {
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
}
.setup-upload {
  display: block;
  width: 100%;
}
.setup-upload :deep(.el-upload) {
  display: block;
  width: 100%;
}

.stage-alert {
  margin-bottom: 12px;
}
.stage-alert-text {
  margin: 0 0 12px;
  color: var(--text-1);
  font-size: var(--font-size-md);
  line-height: 1.6;
}
.ph-group-delete-copy {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.6;
}
.stage-form {
  margin-top: 4px;
}

.ref-app {
  font-weight: 600;
  color: var(--text-1);
  margin-bottom: 10px;
}
.ref-table {
  --el-table-border-color: var(--border-2);
  --el-table-header-bg-color: var(--fill-2);
  --el-table-bg-color: var(--fill-1);
  --el-table-tr-bg-color: var(--fill-1);
  --el-table-row-hover-bg-color: var(--fill-1);
  --el-table-header-text-color: var(--text-1);
  --el-table-text-color: var(--text-2);
  font-size: var(--font-size-md);
  box-sizing: border-box;
  border: 1px solid var(--border-2);
  border-radius: 8px;
  overflow: hidden;
}
.ref-table :deep(.el-table__inner-wrapper) {
  overflow: hidden;
}
.ref-table :deep(.el-table__inner-wrapper::before) {
  content: none;
}
.ref-table :deep(th.el-table__cell),
.ref-table :deep(.cell) {
  font-size: var(--font-size-md);
}
.ref-table :deep(th.el-table__cell),
.ref-table :deep(td.el-table__cell) {
  height: 40px;
  padding-top: 0;
  padding-bottom: 0;
  padding-right: 0;
  padding-left: 0;
  border-bottom-color: var(--border-2);
}
.ref-table :deep(th.el-table__cell:not(:last-child)),
.ref-table :deep(td.el-table__cell:not(:last-child)) {
  border-right: 1px solid var(--border-2);
}
.ref-table :deep(.el-table__body tr:last-child > td.el-table__cell) {
  border-bottom: 0;
}
.ref-table :deep(th.el-table__cell .cell),
.ref-table :deep(td.el-table__cell .cell) {
  padding-right: var(--spacing-lg);
  padding-left: var(--spacing-lg);
}
.ref-table :deep(th.el-table__cell) {
  color: var(--text-1);
  font-weight: var(--font-weight-medium);
}
.ref-table :deep(td.el-table__cell) {
  color: var(--text-2);
}

.graph-url :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}
.graph-dialog-hint {
  margin: 4px 0 0;
  color: var(--text-3);
  font-size: 14px;
  line-height: 20px;
}

/* AI 抽屉 */
:deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
}
.ai-chat {
  flex: 1;
  overflow: auto;
  padding: 4px 16px 0;
}
.ai-msg {
  display: flex;
  margin-bottom: 12px;
}
.ai-msg.user {
  justify-content: flex-end;
}
.bubble {
  max-width: 82%;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.6;
  background: var(--fill-3);
  color: var(--text-1);
}
.ai-msg.user .bubble {
  background: var(--brand-1);
  color: #fff;
}
.ai-input {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border-1);
}

/* 空白创建：基础信息弹窗（图标仅支持上传） */
.icon-upload-box {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 88px;
  border: 1px dashed var(--border-2);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  background: var(--fill-4);
  color: var(--text-3);
  transition: all 0.15s;
}
.icon-upload-box:hover {
  border-color: var(--brand-1);
}
.icon-upload-box.active {
  border-style: solid;
  border-color: var(--brand-1);
  background: var(--fill-1);
}
.icon-upload-box.active .icon-preview {
  width: 36px;
  height: 36px;
}
.setup-upload-remove {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  min-width: 24px;
  height: 24px;
  padding: 0;
  color: var(--text-3);
}
.setup-upload-remove:hover {
  color: var(--color-status-error);
  background: color-mix(in srgb, var(--color-status-error) 8%, transparent);
}
.setup-upload-retry {
  height: 20px;
  padding: 0;
  font-size: 14px;
  line-height: 20px;
}
.upload-text {
  font-size: 12px;
}
.icon-preview {
  display: block;
  box-sizing: border-box;
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
}

/* 新手引导：全屏遮罩 + 挖洞高亮 + 气泡 */
.guide-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
}
/* 高亮框本身透明，靠超大 box-shadow 盖住其余区域形成"挖洞" */
.guide-spot {
  position: fixed;
  border: 1.5px solid #0047ff;
  border-radius: 8px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
  transition: all 0.22s ease;
  pointer-events: none;
}
.guide-pop {
  position: fixed;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  padding: 16px 18px 14px;
  box-sizing: border-box;
}
.guide-step-no {
  font-size: 12px;
  color: #0047ff;
  font-weight: 600;
  margin-bottom: 4px;
}
.guide-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 6px;
}
.guide-desc {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.7;
}
.guide-actions {
  display: flex;
  align-items: center;
  margin-top: 14px;
}
.guide-spacer {
  flex: 1;
}
.guide-next-button {
  box-shadow: none;
}

@media (max-width: 768px) {
  .ph-header {
    padding: 0 12px;
  }
  .ph-app-name {
    max-width: 120px;
  }
  .graph-btn {
    padding: 8px 4px;
  }
  .aside-search {
    gap: 6px;
    padding: 0 12px 8px;
  }
  .aside-footer {
    margin-right: 12px;
    margin-left: 12px;
  }
  .ph-preview {
    padding: 0 8px 8px 0;
  }
}
</style>

<style>
/* `append-to-body` 会让 Element Plus 将弹窗 teleport 到 body，下列结构样式必须保持非 scoped。 */
.ph-dialog {
  margin: var(--spacing-lg) auto;
  padding: 0;
  overflow: hidden;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-xl);
  background: var(--fill-1);
  box-shadow: var(--shadow-3);
}
.ph-dialog--rename {
  height: auto;
  max-height: calc(100vh - 32px);
}
.ph-dialog .el-dialog__header {
  margin: 0;
  padding: 20px 56px var(--spacing-lg) var(--spacing-xl);
}
.ph-dialog .el-dialog__title {
  color: var(--text-1);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: 24px;
}
.ph-dialog .el-dialog__headerbtn {
  top: var(--spacing-md);
  right: var(--spacing-lg);
  display: inline-flex;
  width: 32px;
  height: 32px;
  margin: 0;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-2);
  transition:
    color var(--motion-hover),
    background-color var(--motion-hover);
}
.ph-dialog .el-dialog__headerbtn:hover {
  background: var(--fill-2);
  color: var(--text-1);
}
.ph-dialog .el-dialog__headerbtn .el-dialog__close {
  color: inherit;
  font-size: 20px;
}
.ph-dialog .el-dialog__body {
  padding: 0 var(--spacing-xl);
  color: var(--text-2);
}
/* 基础信息弹窗：使用 Element Plus 浮动式滚动条，头部与底部操作固定。 */
.ph-dialog--setup {
  height: min(600px, calc(100dvh - 32px));
  max-height: min(600px, calc(100dvh - 32px));
}
.ph-dialog--setup .el-dialog__body {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
.ph-dialog--setup .setup-scrollbar {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  /* 滚动轨道延展至弹窗内侧，右侧保持 4px；内容仍沿用 24px 右内边距。 */
  width: calc(100% + var(--spacing-xl));
  margin-right: calc(var(--spacing-xl) * -1);
}
.ph-dialog--setup .setup-scrollbar .el-scrollbar__wrap {
  overflow-x: hidden !important;
  overflow-y: auto !important;
}
.ph-dialog--setup .setup-scrollbar .el-scrollbar__view {
  min-height: 100%;
  box-sizing: border-box;
  padding: 0 var(--spacing-xl) 0 0;
}
.ph-dialog--setup .setup-scrollbar .el-scrollbar__bar.is-horizontal {
  display: none;
}
.ph-dialog--setup .setup-scrollbar .el-scrollbar__bar.is-vertical {
  top: 4px;
  right: 4px;
  bottom: 4px;
  width: 6px;
}
.ph-dialog--setup .setup-scrollbar .el-scrollbar__thumb {
  background: rgba(87, 88, 94, 0.35);
}
.ph-dialog .el-dialog__footer {
  padding: var(--spacing-xl);
}
.ph-dialog-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
.ph-confirm-copy {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.6;
}
.ph-dialog .el-dialog__footer .el-button {
  min-width: 80px;
  height: 36px;
  padding: 0 var(--spacing-lg);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
}
.ph-dialog .el-dialog__footer .el-button + .el-button {
  margin-left: 0;
}
.ph-dialog .el-dialog__footer .el-button:not(.el-button--primary):not(.el-button--danger) {
  --el-button-text-color: var(--text-1);
  --el-button-bg-color: var(--fill-1);
  --el-button-border-color: var(--border-2);
  --el-button-hover-text-color: var(--text-1);
  --el-button-hover-bg-color: var(--fill-2);
  --el-button-hover-border-color: var(--border-4);
}
.ph-dialog .el-dialog__footer .el-button--primary {
  --el-button-bg-color: var(--brand-1);
  --el-button-border-color: var(--brand-1);
  --el-button-hover-bg-color: var(--brand-2);
  --el-button-hover-border-color: var(--brand-2);
}
.ph-dialog .el-dialog__footer .el-button--danger {
  --el-button-bg-color: var(--color-status-error);
  --el-button-border-color: var(--color-status-error);
  --el-button-hover-bg-color: color-mix(in srgb, var(--color-status-error) 85%, #000);
  --el-button-hover-border-color: color-mix(in srgb, var(--color-status-error) 85%, #000);
}
.ph-dialog-form .el-form-item {
  /* 弹窗字段之间统一保留 20px 纵向间距。 */
  margin-bottom: 20px;
  display: block;
}
.ph-dialog-form .el-form-item:last-child {
  margin-bottom: 0;
}
.ph-dialog-form .el-form-item__label {
  position: relative;
  display: block;
  width: auto !important;
  height: auto;
  padding: 0;
  margin: 0 0 8px;
  color: var(--text-1);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  line-height: 20px;
  text-align: left;
}
.ph-dialog-form .el-form-item.is-required .el-form-item__label::before {
  position: absolute;
  top: 0;
  left: -9px;
  margin: 0;
}
.ph-dialog-form .el-form-item__content {
  min-width: 0;
  margin-left: 0 !important;
  line-height: normal;
}
.ph-dialog .el-input__wrapper,
.ph-dialog .el-select__wrapper {
  min-height: 36px;
  box-shadow: 0 0 0 1px var(--border-2) inset;
}
.ph-dialog .el-input__inner,
.ph-dialog .el-textarea__inner,
.ph-dialog .el-select__selected-item {
  color: var(--text-1);
}
.ph-dialog .el-input__inner::placeholder,
.ph-dialog .el-textarea__inner::placeholder,
.ph-dialog .el-select__placeholder.is-transparent {
  color: var(--text-3);
}
.ph-dialog .el-select__placeholder:not(.is-transparent) {
  color: var(--text-1);
}
.ph-dialog .el-input__wrapper:hover,
.ph-dialog .el-select__wrapper:hover {
  box-shadow: 0 0 0 1px var(--color-border-brand) inset;
}
.ph-dialog .el-input__wrapper.is-focus,
.ph-dialog .el-select__wrapper.is-focused {
  box-shadow: 0 0 0 1px var(--brand-1) inset;
}
.ph-dialog .el-input__count,
.ph-dialog .el-input__count-inner {
  color: var(--text-3);
}
.ph-dialog-select-popper .el-select-dropdown__wrap .el-scrollbar__view {
  padding: 0;
}
.ph-dialog-select-popper .el-select-dropdown__item {
  min-height: 40px;
  height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  color: var(--text-1);
}
.ph-dialog-select-popper .el-select-dropdown__item:hover {
  background: var(--fill-2);
}
.ph-dialog-select-popper .el-select-dropdown__item.is-selected {
  background: transparent;
  color: var(--brand-1);
}
.ph-dialog-select-popper .el-select-dropdown__item.is-selected:hover {
  background: var(--fill-2);
}
.ph-message-box {
  width: min(400px, calc(100vw - 32px));
  border: 1px solid var(--border-2);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-3);
}
.ph-message-box .el-message-box__header {
  padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-md);
}
.ph-message-box .el-message-box__title {
  color: var(--text-1);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}
.ph-message-box .el-message-box__content {
  padding: 0 var(--spacing-xl) var(--spacing-xl);
  color: var(--text-2);
}
.ph-message-box .el-message-box__btns {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-xl) var(--spacing-xl);
}
.ph-message-box .el-message-box__btns .el-button {
  min-width: 80px;
  height: 36px;
  margin: 0;
  border-radius: var(--radius-sm);
}
@media (max-width: 640px) {
  .ph-dialog {
    width: calc(100vw - 32px) !important;
  }
  .ph-dialog .el-dialog__header,
  .ph-dialog .el-dialog__body,
  .ph-dialog .el-dialog__footer {
    padding-right: var(--spacing-lg);
    padding-left: var(--spacing-lg);
  }
  .ph-dialog .el-dialog__header {
    padding-right: 52px;
  }
  .ph-dialog-actions .el-button {
    flex: 1;
  }
}
</style>
