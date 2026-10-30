<template>
  <div class="ac-page">
    <!-- ============ 顶栏：返回创建向导 | AI 创建 ============ -->
    <header class="ac-header">
      <AppTooltip content="返回业务应用包管理" placement="bottom">
        <el-button class="ac-back" aria-label="返回业务应用包管理" @click="onBack">
          <RiArrowLeftLine :size="20" aria-hidden="true" />
        </el-button>
      </AppTooltip>
      <span class="ac-header-title">AI 创建</span>
    </header>

    <!-- ============ 主体：阶段 0～2 单栏居中；蓝图生成后转两栏 ============ -->
    <div
      ref="bodyRef"
      class="ac-body"
      :class="[
        twoColumn ? 'two-col' : 'single',
        {
          dragging,
          'blueprint-open': phase === 'blueprint',
          'build-open': phase === 'generating' || phase === 'done',
          'processing-state': busy,
          'intake-state': phase === 'intake',
          'analysis-state': phase === 'analysis',
          'conversation-state': !isHero
        }
      ]"
    >
      <!-- ---------------- 左栏：对话区（阶段 0 为 hero 初始态） ---------------- -->
      <AuiProvider :config="assistantConfig">
        <section class="ac-chat" :class="{ hero: isHero }">
          <!-- 初始态：AI 标识 + 问候语 -->
          <div v-if="isHero" class="ac-hero-group">
            <div class="ac-hero-top">
              <div class="ac-hero-logo">
                <iframe
                  class="ac-fluid-orb"
                  src="/liquid-orb.html"
                  title="动态流体球"
                  aria-hidden="true"
                  tabindex="-1"
                />
              </div>
              <h1 class="ac-hero-title">
                Hi，我可以帮你把<span class="ac-hero-title-gradient">想法快速搭出来</span>
              </h1>
              <p class="ac-hero-subtitle">从业务目标开始，AI 会帮你梳理流程、角色和应用</p>
            </div>

            <!-- 初始态：示例引导卡片与标题说明组成同一视觉区块 -->
            <div class="ac-hero-cards">
              <SuggestionByIndexProvider
                v-for="(s, index) in AI_SUGGESTIONS"
                :key="s.title"
                :index="index"
              >
                <SuggestionPrimitiveTrigger :class="['ac-hero-card', s.tone]" send>
                  <span class="ac-hero-card-head">
                    <span class="ac-hero-card-icon" :class="s.tone">
                      <AppIcon :name="s.icon" :size="16" />
                    </span>
                    <span class="ac-hero-card-title"><SuggestionPrimitiveTitle /></span>
                  </span>
                  <span class="ac-hero-card-desc"><SuggestionPrimitiveDescription /></span>
                </SuggestionPrimitiveTrigger>
              </SuggestionByIndexProvider>
            </div>
          </div>

          <!-- 2026-10-11：顶部的 5 阶段步骤条已去掉（PRD v2.9 模块三）——创建过程仍为 5 阶段，但不再在页面顶部展示流程指示器 -->

          <!-- 消息流 -->
          <el-scrollbar
            v-if="!isHero"
            ref="streamRef"
            class="ac-stream"
            always
            @scroll="onStreamScroll"
          >
            <div
              v-for="(m, index) in messages"
              :key="m.id"
              :id="`ac-msg-${m.id}`"
              :class="[
                'ac-row',
                m.role,
                { 'is-latest-ai': m.role === 'ai' && index === messages.length - 1 }
              ]"
            >
              <!-- 纯文本 -->
              <div v-if="m.type === 'text'" class="ac-bubble">{{ m.text }}</div>

              <!-- 用户消息（可带附件） -->
              <div v-else-if="m.type === 'user'" class="ac-bubble">
                <div v-if="m.text">{{ m.text }}</div>
                <div v-if="m.docs && m.docs.length" class="ac-docs">
                  <span v-for="d in m.docs" :key="d" class="ac-doc">
                    <AppIcon name="表单" :size="16" />{{ d }}
                  </span>
                </div>
              </div>

              <!-- ① 需求接入确认 -->
              <div v-else-if="m.type === 'intake'" class="ac-card intake">
                <div class="ac-card-head">
                  <span>需求已接收</span>
                  <el-button
                    class="ac-fold"
                    text
                    circle
                    :aria-expanded="!m.collapsed"
                    :aria-label="m.collapsed ? '展开需求摘要' : '收起需求摘要'"
                    @click="m.collapsed = !m.collapsed"
                  >
                    <RiArrowDownSLine class="ac-fold-icon" :class="{ open: !m.collapsed }" />
                  </el-button>
                </div>
                <div v-show="!m.collapsed">
                  <p class="ac-card-text">{{ m.summary }}</p>
                  <div v-if="m.docs.length" class="ac-docs">
                    <span v-for="d in m.docs" :key="d" class="ac-doc">
                      <AppIcon name="表单" :size="16" />{{ d }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- ② 已调用业务分析 skill -->
              <div v-else-if="m.type === 'skill'" class="ac-card skill">
                <div class="ac-card-head">
                  <span>{{ m.text }}</span>
                </div>
                <p class="ac-card-text">{{ m.sub }}</p>
              </div>

              <!-- ② 合并追问：一次补齐业务分析所需信息 -->
              <el-collapse
                v-else-if="m.type === 'ask-group'"
                class="ac-card ask ask-group ac-collapse"
                :class="{ 'is-open': !m.collapsed, 'is-answered': m.submitted }"
                :model-value="m.collapsed ? [] : ['content']"
                @update:model-value="syncAskCollapse(m, $event)"
              >
                <el-collapse-item name="content">
                  <template #title>
                    <div class="ac-card-head">
                      <RiQuestionFill class="ac-ask-head-icon" :size="20" aria-hidden="true" />
                      <span class="ac-ask-heading">
                        <span class="ac-ask-title">{{
                          m.submitted ? '已收集的信息' : '补充关键信息'
                        }}</span>
                      </span>
                    </div>
                  </template>
                  <template #icon>
                    <RiArrowDownSLine class="ac-collapse-icon" aria-hidden="true" />
                  </template>
                  <div v-if="!m.submitted" class="ac-ask-group-fields">
                    <section v-for="(q, qIndex) in m.questions" :key="q.id" class="ac-ask-item">
                      <div class="ac-ask-question-head">
                        <span class="ac-ask-index">{{ String(qIndex + 1).padStart(2, '0') }}</span>
                        <div>
                          <p class="ac-ask-question-title">{{ q.title }}</p>
                          <p v-if="q.hint" class="ac-ask-question-help">{{ q.hint }}</p>
                        </div>
                      </div>

                      <el-radio-group
                        v-if="q.type === 'single'"
                        v-model="m.answers[qIndex].value"
                        class="ac-ask-radio-group"
                      >
                        <el-radio-button
                          v-for="opt in q.options"
                          :key="opt.label"
                          :label="opt.label"
                          >{{ opt.label }}</el-radio-button
                        >
                      </el-radio-group>

                      <el-checkbox-group
                        v-else-if="q.type === 'multi'"
                        v-model="m.answers[qIndex].picked"
                        class="ac-checks ac-ask-check-group"
                      >
                        <el-checkbox v-for="opt in q.options" :key="opt" :value="opt">{{
                          opt
                        }}</el-checkbox>
                      </el-checkbox-group>

                      <template v-else-if="q.type === 'fill'">
                        <el-input v-model="m.answers[qIndex].draft" :placeholder="q.placeholder" />
                      </template>
                    </section>

                    <div class="ac-ask-submit">
                      <el-button
                        type="primary"
                        :disabled="!askGroupReady(m)"
                        @click="submitAskGroup(m)"
                      >
                        生成业务蓝图
                      </el-button>
                    </div>
                  </div>

                  <div v-else class="ac-card-answered ac-ask-group-answered">
                    <ol class="ac-ask-answer-list">
                      <li v-for="(answer, answerIndex) in m.answerSummary" :key="answerIndex">
                        <span class="ac-ask-answer-index">{{
                          String(answerIndex + 1).padStart(2, '0')
                        }}</span>
                        <p class="ac-ask-answer-title">{{ answer.title }}</p>
                        <p class="ac-ask-answer-value">{{ answer.value }}</p>
                      </li>
                    </ol>
                  </div>
                </el-collapse-item>
              </el-collapse>

              <!-- ③ 蓝图确认卡片（本流程唯一一次确认，内联非弹窗） -->
              <div v-else-if="m.type === 'confirm'" class="ac-card confirm" :class="[m.status]">
                <div class="ac-card-head">
                  <span class="ac-confirm-title">业务系统蓝图</span>
                  <el-tag v-if="m.status === 'confirmed'" size="small" type="success"
                    >已确认</el-tag
                  >
                  <el-tag
                    v-else-if="m.status === 'superseded'"
                    class="ac-confirm-status ac-confirm-status--info"
                    size="small"
                    type="info"
                    effect="plain"
                    >已被更新版本取代</el-tag
                  >
                  <el-tag
                    v-else
                    class="ac-confirm-status ac-confirm-status--warning"
                    size="small"
                    type="warning"
                    >等待你确认</el-tag
                  >
                  <el-button
                    class="ac-fold"
                    text
                    circle
                    :aria-expanded="!m.collapsed"
                    :aria-label="m.collapsed ? '展开蓝图详情' : '收起蓝图详情'"
                    @click="m.collapsed = !m.collapsed"
                  >
                    <RiArrowDownSLine class="ac-fold-icon" :class="{ open: !m.collapsed }" />
                  </el-button>
                </div>

                <div v-show="!m.collapsed">
                  <p class="ac-card-text ac-blueprint-summary">
                    {{ BLUEPRINT_META.summary }}
                    <span class="ac-blueprint-feature-count">{{ blueprintFeatureCount }}个功能点</span>
                  </p>
                  <div v-if="BLUEPRINT_META.uncertain.length" class="ac-uncertain">
                    <div class="ac-uncertain-title">
                      <RiInformationFill class="ac-uncertain-icon" :size="20" aria-hidden="true" />
                      <span>识别到但不确定的事项</span>
                    </div>
                    <ul>
                      <li v-for="u in BLUEPRINT_META.uncertain" :key="u">{{ u }}</li>
                    </ul>
                  </div>

                  <!-- 按钮只在最新一轮蓝图卡片下显示 -->
                  <div
                    v-if="isActiveBp(m)"
                    class="ac-card-actions ac-blueprint-actions ac-complete-actions"
                  >
                    <el-button type="primary" @click="startBuild(m)">开始搭建</el-button>
                    <el-button text @click="focusRevise">调整蓝图</el-button>
                  </div>
                  <p v-else class="ac-card-foot">
                    本轮蓝图已被后续调整取代，按钮不再提供——请在最下方的蓝图卡片上操作。
                  </p>
                </div>
              </div>

              <!-- ④ 生成进度 + 创建业务应用包 -->
              <div v-else-if="m.type === 'progress'" class="ac-card progress">
                <div class="ac-card-head">
                  <RiCheckboxCircleFill v-if="genMode === 'done'" class="ok" />
                  <RiLoader4Line v-else class="running is-spin" />
                  <span>{{ genMode === 'done' ? '应用包生成完成' : '应用生成' }}</span>
                  <span class="ac-progress-count"
                    >{{ autoDoneCount }} / {{ autoItems.length }}</span
                  >
                  <el-button
                    class="ac-fold"
                    text
                    circle
                    :aria-expanded="!m.collapsed"
                    :aria-label="m.collapsed ? '展开生成详情' : '收起生成详情'"
                    @click="m.collapsed = !m.collapsed"
                  >
                    <RiArrowDownSLine class="ac-fold-icon" :class="{ open: !m.collapsed }" />
                  </el-button>
                </div>

                <div v-show="!m.collapsed">
                  <p class="ac-card-text">
                    按蓝图逐个生成应用并自动发布。暂不支持自动创建的应用已计入待完成任务，由人工处理。
                  </p>
                  <div class="ac-progress">
                    <el-table
                      :data="genItems"
                      class="ac-progress-table"
                      size="small"
                      table-layout="fixed"
                      width="100%"
                      scrollbar-always-on
                    >
                      <el-table-column label="应用" min-width="144">
                        <template #default="{ row: it }">
                          <span class="ac-progress-name">{{ it.name }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="类型" width="84">
                        <template #default="{ row: it }">
                          <span class="ac-progress-engine">{{ ENGINE_META[it.engine].label }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="状态" width="150">
                        <template #default="{ row: it }">
                          <span class="ac-progress-status" :class="it.status">{{
                            GEN_STATUS_TEXT[it.status]
                          }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column label="说明" min-width="172">
                        <template #default="{ row: it }">
                          <span class="ac-progress-reason" :class="it.status">{{
                            it.reason || (it.status === 'manual' ? '需在待完成任务中人工创建' : '—')
                          }}</span>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>

                </div>
              </div>

              <!-- ⑤ 搭建完成：待完成任务文档 + 系统跳转链接（同一步、同一张卡片） -->
              <div v-else-if="m.type === 'done'" class="ac-card done">
                <div class="ac-card-head">
                  <RiCheckboxCircleFill class="ac-done-icon" />
                  <span>搭建完成</span>
                  <el-button
                    class="ac-fold"
                    text
                    circle
                    :aria-expanded="!m.collapsed"
                    :aria-label="m.collapsed ? '展开完成详情' : '收起完成详情'"
                    @click="m.collapsed = !m.collapsed"
                  >
                    <RiArrowDownSLine class="ac-fold-icon" :class="{ open: !m.collapsed }" />
                  </el-button>
                </div>

                <div v-show="!m.collapsed">
                  <p class="ac-card-text">
                    业务应用包「{{ AI_SCENE.systemName }}」已创建，包含
                    {{ pkgInfo ? pkgInfo.groupCount : AI_SCENE.groups.length }} 个分组、{{
                      autoDoneCount
                    }}
                    个已生成应用（另 {{ pendingCount }} 个暂未完成，需人工处理）。
                  </p>

                  <div class="ac-todo">
                    <div class="ac-todo-head">
                      <RiFileTextFill class="ac-todo-title-icon" :size="20" aria-hidden="true" />
                      <span>系统搭建待完成任务</span>
                      <el-tag class="ac-todo-tag" size="small" type="warning" effect="plain" round
                        >待补充配置项 {{ todoCount }} 项</el-tag
                      >
                    </div>
                    <ul class="ac-todo-list">
                      <li v-for="r in todoRows.slice(0, 3)" :key="r.key">
                        <span class="ac-todo-module">{{ r.label }}</span
                        >{{ r.note }}
                      </li>
                    </ul>
                  </div>

                  <div class="ac-card-actions ac-complete-actions">
                    <el-button type="primary" @click="downloadBlueprintDoc">下载业务系统蓝图</el-button>
                    <el-button text @click="jumpToSystem">跳转业务系统</el-button>
                  </div>

                </div>
              </div>
            </div>

            <div v-if="busy" class="ac-typing-row" role="status" aria-live="polite">
              <div class="ac-typing-bubble">
                <span>AI 正在处理</span>
                <i></i><i></i><i></i>
              </div>
            </div>

          </el-scrollbar>

          <!-- 输入区：使用 assistant-ui Vue composer primitive 承载文本状态与发送语义 -->
          <div class="ac-composer" :class="{ 'is-highlight': highlightInput }">
            <AppTooltip v-if="!atBottom" content="新消息" placement="top">
              <el-button class="ac-jump" circle aria-label="新消息" @click="scrollToBottom">
                <RiArrowDownLine :size="18" aria-hidden="true" />
              </el-button>
            </AppTooltip>
            <div class="ac-composer-box" :class="{ 'has-attachments': files.length }">
              <div v-if="files.length" class="ac-attach-list" aria-label="已上传附件">
                <div
                  v-for="(f, i) in files"
                  :key="f.name + i"
                  class="ac-attach-card"
                  :class="`is-${fileTone(f.name)}`"
                >
                  <span class="ac-attach-icon" aria-hidden="true">
                    <component :is="fileIcon(f.name)" :size="20" />
                  </span>
                  <span class="ac-attach-copy">
                    <AppTooltip :content="f.name" placement="top" only-when-overflow>
                      <span class="ac-attach-name">{{ f.name }}</span>
                    </AppTooltip>
                    <span class="ac-attach-meta"
                      >{{ fileTypeLabel(f.name) }} · {{ formatFileSize(f.size) }}</span
                    >
                  </span>
                  <button
                    class="ac-attach-remove"
                    type="button"
                    :aria-label="`移除附件 ${f.name}`"
                    @click="files.splice(i, 1)"
                  >
                    <RiCloseLine :size="16" />
                  </button>
                </div>
              </div>
              <div class="ac-composer-inner">
                <ComposerPrimitiveInput
                  class="ac-composer-input"
                  :placeholder="placeholder"
                  :disabled="!inputEnabled"
                  @input="onComposerInput"
                />
                <div class="ac-composer-bar">
                  <div class="ac-composer-tools">
                    <el-upload
                      class="ac-upload"
                      :auto-upload="false"
                      :show-file-list="false"
                      multiple
                      accept=".md,.txt,.doc,.docx,.pdf,.xlsx"
                      :on-change="onPickFile"
                    >
                      <AppTooltip
                        content="上传需求文档（md / txt / doc / docx / pdf / xlsx）"
                        placement="top"
                      >
                        <el-button
                          class="ac-upload-btn"
                          text
                          circle
                          :disabled="!inputEnabled"
                          aria-label="上传需求文档"
                        >
                          <RiAddLine />
                        </el-button>
                      </AppTooltip>
                    </el-upload>

                    <el-dropdown
                      v-if="SHOW_SKILL_PICKER"
                      trigger="click"
                      :disabled="!inputEnabled"
                      @command="onPickSkill"
                    >
                      <button
                        class="ac-tool-btn ac-tool-skill"
                        :disabled="!inputEnabled"
                        type="button"
                      >
                        <RiGridLine />{{ skillLabel }}
                        <RiArrowDownSLine class="ac-tool-caret" />
                      </button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item
                            v-for="s in AI_SKILLS"
                            :key="s.value"
                            :command="s.value"
                            :divided="!!s.divided"
                          >
                            {{ s.label }}
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>

                  <AppTooltip v-if="busy" content="停止生成" placement="top">
                    <el-button
                      class="ac-send ac-cancel"
                      circle
                      aria-label="停止生成"
                      @click="cancelComposer"
                    >
                      <RiStopFill />
                    </el-button>
                  </AppTooltip>
                  <AppTooltip v-else content="发送（Enter）" placement="top">
                    <el-button
                      class="ac-send"
                      circle
                      :disabled="!canSend"
                      aria-label="发送（Enter）"
                      @click="sendComposer"
                    >
                      <RiArrowUpLine />
                    </el-button>
                  </AppTooltip>
                </div>
              </div>
            </div>
          </div>
        </section>
      </AuiProvider>

      <!-- ---------------- 分割线：鼠标悬浮可拖拽调整两栏宽度 ---------------- -->
      <AppTooltip v-if="twoColumn" content="拖动调整两栏宽度" placement="top">
        <div class="ac-splitter" :class="{ active: dragging }" @mousedown.prevent="onSplitDown" />
      </AppTooltip>

      <!-- ---------------- 右栏：蓝图 / 业务搭建 ---------------- -->
      <aside v-if="twoColumn" class="ac-preview" :style="{ width: rightWidth + 'px' }">
        <el-tabs v-model="previewTab" class="ac-tabs">
          <el-tab-pane label="蓝图" name="blueprint">
            <el-scrollbar class="ac-pane ac-pane-blueprint" always>
              <BlueprintReview :content="blueprintMd" @comment="submitBlueprintComment" />
            </el-scrollbar>
          </el-tab-pane>

          <el-tab-pane label="业务搭建" name="build">
            <div ref="buildPaneRef" class="ac-pane ac-pane-build">
              <div v-if="!autoItems.length" class="ac-empty">
                <img class="ac-empty-illustration" :src="aiBuildEmptyImage" alt="" />
                <p>点「开始搭建」后，这里会展示应用生成进度与各引擎创建页预览</p>
              </div>
              <template v-else>
                <!-- 仅列 AI 自动创建的应用（报表 / 报告 / 信息查询类待人工创建，不在此列）。
                     一行多卡网格：列数随栏宽自适应（初始 4 列），最多显示 4 行，超出滚动 -->
                <ul class="ac-build-list" :style="{ '--build-cols': buildCols }">
                  <li
                    v-for="it in autoItems"
                    :key="it.id"
                    class="ac-build-item"
                    :class="[it.status, { active: it.id === previewTargetId }]"
                    @click="pinTarget(it)"
                  >
                    <span class="ac-build-top">
                      <EngineIcon :engine="it.engine" :size="16" color="var(--text-1)" />
                      <span class="ac-build-name">{{ it.name }}</span>
                    </span>
                    <span class="ac-build-status">
                      {{ GEN_STATUS_TEXT[it.status] }}
                    </span>
                  </li>
                </ul>

                <!-- 预览区域不加载真实引擎页面，统一保留嵌套区域占位。 -->
                <div class="ac-frame">
                  <span class="ac-frame-empty">嵌套区域</span>
                </div>
              </template>
            </div>
          </el-tab-pane>
        </el-tabs>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import aiBuildEmptyImage from '@/assets/ai-build-empty.png'
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowLeftLine,
  RiArrowDownSLine,
  RiArrowUpLine,
  RiCheckboxCircleFill,
  RiCloseLine,
  RiFileExcel2Line,
  RiFileLine,
  RiFilePdf2Line,
  RiFileTextLine,
  RiFileTextFill,
  RiFileWord2Line,
  RiGridLine,
  RiInformationFill,
  RiLoader4Line,
  RiMarkdownLine,
  RiQuestionFill,
  RiStopFill,
} from '@remixicon/vue'
import {
  AuiConfig,
  AuiProvider,
  ComposerPrimitiveInput,
  SuggestionByIndexProvider,
  SuggestionPrimitiveDescription,
  SuggestionPrimitiveTitle,
  SuggestionPrimitiveTrigger
} from '@assistant-ui/vue'
import { RuntimeAdapter } from '@assistant-ui/core/store'
import { createPackageFromAi } from '@/api/aiCreate'
import AppIcon from '@/components/icons/AppIcon.vue'
import EngineIcon from '@/components/icons/EngineIcon.vue'
import BlueprintReview from '@/components/builder/BlueprintReview.vue'
import { createAssistantComposerRuntime } from '@/runtime/assistantUiRuntime'
import {
  AI_FAIL_ITEM,
  AI_LOGO_URL,
  AI_QUESTIONS,
  AI_SCENE,
  AI_SKILLS,
  AI_SUGGESTIONS,
  BLUEPRINT_DOC_MD,
  BLUEPRINT_DOC_NAME,
  BLUEPRINT_META,
  DELIVERABLE_AFTER_GEN,
  ENGINE_META,
  blueprintFeatureCount,
  buildBlueprintMd,
  countTodo
} from '@/mock/aiCreate'

const router = useRouter()

// 创建流程仍为 5 阶段（需求描述 / 业务分析 / 业务系统蓝图 / 应用包生成 / 搭建完成），
// 但 2026-10-11 起**不再在页面顶部展示步骤条**（原 5 节点流程指示器已去掉）：
// 阶段状态由 phase / bpMode / genMode 驱动页面与卡片，不再有独立的 stages 状态。
const GEN_STATUS_TEXT = {
  pending: '等待中',
  running: '生成中',
  published: '已生成 · 已发布',
  unpublished: '已生成 · 未发布',
  manual: '待人工创建',
  error: '生成失败'
}

const messages = ref([])

// 会话态：粗粒度 phase 驱动步骤条与布局，细分状态各用一个 ref
// phase: idle | intake | analysis | blueprint | generating | done
const phase = ref('idle')
// bpMode: generating（重新生成中）| waiting（等待确认）| revising（点过调整蓝图）| confirmed
const bpMode = ref('waiting')
// genMode: apps（逐个生成）| package（创建业务应用包）| done
// 异常项（生成失败 / 未发布）一律不提供重试：计入待完成任务文档由人工处理，不阻塞队列与创建
const genMode = ref('apps')
const busy = ref(false)

const blueprintMd = ref('')
const revisions = ref([])
const activeBpCardId = ref(null)

const streamRef = ref(null)
const files = ref([])
const highlightInput = ref(false)
const atBottom = ref(true)

// 初始态（hero）：logo + 问候语 + 大输入框 + 示例卡片；发出第一条需求后转为对话布局
const isHero = computed(() => phase.value === 'idle')
const logoFailed = ref(false)

// 输入框内「技能」选择器（Demo 演示用；PRD 模块三未定义该控件）
// ⚠️ 2026-10-11 按需求负责人指示**暂时隐藏该按钮**——逻辑与样式全部保留，改回 true 即可恢复
const SHOW_SKILL_PICKER = false
const pickedSkill = ref('auto')
const skillLabel = computed(() => {
  const s = AI_SKILLS.find((x) => x.value === pickedSkill.value)
  return s && s.value !== 'auto' ? s.label : '技能'
})
function onPickSkill(cmd) {
  pickedSkill.value = cmd
}
// 阶段 2 卡片里的「调用方式」——选择器同时列出阶段 4 的应用创建 skill，
// 选到应用创建 skill 时须说明它作用于阶段 4，本阶段业务分析仍由业务分析 skill 承担
const analysisSkillNote = computed(() => {
  const s = AI_SKILLS.find((x) => x.value === pickedSkill.value)
  if (!s || s.value === 'auto') return 'AI 自动选择'
  if (s.stage === 'app') {
    return `由你在输入框「技能」中指定「${s.label}」（用于阶段 4 生成应用；本阶段业务分析仍由「业务分析 skill」承担）`
  }
  return '由你在输入框「技能」中指定'
})

// 右栏
const previewTab = ref('blueprint')

// 右栏「业务搭建」应用清单：一行多卡网格，列数随栏宽自适应——
// 初始一行 4 个、卡片最小宽 150px；栏变宽时按最小宽算出能多放几个，再均分宽度保证卡片等宽
const buildPaneRef = ref(null)
const BUILD_MIN_CARD_W = 150
const BUILD_CARD_GAP = 6
const buildCols = ref(4)
let buildResizeObserver = null

function measureBuildCols() {
  const el = buildPaneRef.value
  if (!el) return
  // .ac-pane 左右各 24px 内边距，clientWidth 含内边距需扣掉；隐藏（display:none）时宽为 0，跳过
  const contentW = el.clientWidth - 48
  if (contentW <= 0) return
  buildCols.value = Math.max(
    4,
    Math.floor((contentW + BUILD_CARD_GAP) / (BUILD_MIN_CARD_W + BUILD_CARD_GAP))
  )
}

// 阶段 4：生成清单（必须 reactive——直接改 it.status 才触发响应式）
const genItems = reactive([])
const previewTargetId = ref('')
const autoFollow = ref(true)
const pkgState = ref('idle') // idle | running | ok
const pkgInfo = ref(null)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let seq = 0

// ============================================================
// 基础工具
// ============================================================
function push(msg, { force = false } = {}) {
  const m = { id: ++seq, collapsed: false, ...msg }
  messages.value.push(m)
  composerBridge.setExternalMessages(messages.value)
  scroll(force)
  return m
}

function pushUser(text, docs = [], force = true) {
  return push({ role: 'user', type: 'user', text, docs }, { force })
}

/**
 * 自动滚动：仅在贴底时跟随，否则不打断用户回看历史（改由底部「↓ 新消息」提示）
 */
function scroll(force = false) {
  nextTick(() => {
    const el = streamRef.value?.wrapRef ?? streamRef.value
    if (!el) return
    if (force || atBottom.value) {
      el.scrollTop = el.scrollHeight
      atBottom.value = true
    }
  })
}

function onStreamScroll() {
  const el = streamRef.value?.wrapRef ?? streamRef.value
  if (!el) return
  atBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 40
}

function scrollToBottom() {
  scroll(true)
}

// ============================================================
// 布局：单栏居中 ↔ 两栏（含分割线拖拽）
// ============================================================
// 用蓝图是否已产出来决定布局，而不是用 phase——避免「已转两栏但右栏空一帧」的闪烁
const twoColumn = computed(() => !!blueprintMd.value)

const MIN_LEFT = 480
const MIN_RIGHT = 380
const DEFAULT_RIGHT = 420
const SPLITTER_W = 8
const PAD = 8

const bodyRef = ref(null)
const rightWidth = ref(DEFAULT_RIGHT)
const dragging = ref(false)
let stopDrag = null

function onSplitDown(e) {
  if (e.button !== 0 || !twoColumn.value || !bodyRef.value) return
  const rect = bodyRef.value.getBoundingClientRect()
  const rightEdge = rect.right - PAD // 右栏宽度为 0 时的 clientX
  const maxRight = () =>
    // 夹取上界；用 max 兜底，窄屏时不至于出现上界小于下界
    Math.max(MIN_RIGHT, rect.width - PAD * 2 - SPLITTER_W - MIN_LEFT)

  const onMove = (ev) => {
    const w = rightEdge - ev.clientX
    rightWidth.value = Math.min(Math.max(w, MIN_RIGHT), maxRight())
  }
  const onUp = () => {
    dragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
    stopDrag = null
  }

  dragging.value = true
  stopDrag = onUp
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

// 拖拽中卸载页面时兜底移除监听，避免泄漏（统一在下方 onBeforeUnmount 处理）

/** 首次进入两栏时对话面板按最小宽度展示，剩余空间交给右侧蓝图面板。 */
function splitEven() {
  const el = bodyRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const maxRight = Math.max(MIN_RIGHT, rect.width - PAD * 2 - SPLITTER_W - MIN_LEFT)
  rightWidth.value = maxRight
}

watch(twoColumn, (v) => {
  if (v) nextTick(splitEven)
})

// 应用清单列数：进两栏时测量并挂 ResizeObserver（拖分割线 / 窗口缩放均触发重算），
// 切回该 tab 时（tab 隐藏期间宽度读不到）补测一次
watch(twoColumn, (v) => {
  if (!v) {
    buildResizeObserver?.disconnect()
    buildResizeObserver = null
    return
  }
  nextTick(() => {
    measureBuildCols()
    if (!buildResizeObserver && buildPaneRef.value) {
      buildResizeObserver = new ResizeObserver(measureBuildCols)
      buildResizeObserver.observe(buildPaneRef.value)
    }
  })
})
watch(previewTab, (t) => {
  if (t === 'build') nextTick(measureBuildCols)
})

// 拖拽中卸载页面时兜底移除监听，避免泄漏
onBeforeUnmount(() => {
  stopDrag && stopDrag()
  buildResizeObserver && buildResizeObserver.disconnect()
})

watch(phase, (p) => {
  if (p === 'blueprint') previewTab.value = 'blueprint'
  else if (p === 'generating' || p === 'done') previewTab.value = 'build'
})

// ============================================================
// 输入区
// ============================================================
const inputEnabled = computed(() => {
  if (busy.value) return false
  if (phase.value === 'idle' || phase.value === 'analysis') return true
  if (phase.value === 'blueprint') return bpMode.value !== 'confirmed'
  return false
})

const composerText = ref('')
const canSend = computed(() => inputEnabled.value && composerText.value.trim().length > 0)

const placeholder = computed(() => {
  if (busy.value) return 'AI 正在处理，请稍候…'
  if (phase.value === 'idle') return '描述你要搭建的业务系统，Enter 发送'
  if (phase.value === 'analysis') return '请补充上方信息，或直接输入整体答复'
  if (phase.value === 'blueprint') {
    if (bpMode.value === 'revising')
      return '继续输入修改意见，AI 会据此调整蓝图（如：去掉设备巡检，增加一个报销表单）'
    return '可直接输入修改意见调整蓝图；点「调整蓝图」会把光标聚焦到这里'
  }
  if (phase.value === 'generating') return '正在生成应用与业务应用包，无需操作…'
  if (phase.value === 'done')
    return '本次创建已完成，后续调整请到业务系统搭建页或使用业务维护 AI 助手'
  return ''
})

const assistantSubmit = ref(() => {})
const composerBridge = createAssistantComposerRuntime({
  onNew: (text) => assistantSubmit.value(text),
  suggestions: AI_SUGGESTIONS.map((s) => ({
    title: s.title,
    label: s.desc,
    prompt: s.prompt
  })),
  getState: () => ({
    isDisabled: !inputEnabled.value,
    // assistant-ui also uses this flag for the hero suggestion triggers;
    // the visible send button applies the stricter content check below.
    isSendDisabled: !inputEnabled.value
  })
})
const assistantConfig = AuiConfig({
  threads: RuntimeAdapter(composerBridge.runtime)
})
assistantSubmit.value = onSend
watch([inputEnabled, busy, phase, bpMode], () => {
  composerBridge.sync()
  nextTick(resetComposerInputHeight)
})

function onComposerInput(event) {
  composerText.value = event?.target?.value || ''
  composerBridge.sync()
  resizeComposerInput(event)
}

function sendComposer() {
  if (!canSend.value || busy.value) return
  composerBridge.runtime.thread.composer.send()
  composerText.value = ''
}

function cancelComposer() {
  composerBridge.runtime.thread.composer.cancel()
}

function resetComposerInputHeight() {
  const textarea = document.querySelector('.ac-composer-input')
  if (!(textarea instanceof HTMLTextAreaElement) || textarea.value) return
  textarea.style.height = ''
  textarea.style.overflowY = 'hidden'
}

function resizeComposerInput(event) {
  const textarea = event?.target
  if (!(textarea instanceof HTMLTextAreaElement)) return
  textarea.style.height = 'auto'
  const maxHeight = 200
  const nextHeight = Math.min(textarea.scrollHeight, maxHeight)
  textarea.style.height = `${nextHeight}px`
  textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
}

function onPickFile(uploadFile) {
  const name = uploadFile?.name || ''
  if (!name) return
  files.value.push({ name, size: uploadFile.size || 0 })
  if (/\.(pdf|xlsx)$/i.test(name)) {
    push({
      role: 'ai',
      type: 'text',
      text: `「${name}」为非结构化格式，AI 将只提取其中的文字，版式可能丢失。`
    })
  }
}

const fileExtension = (name = '') => name.split('.').pop()?.toLowerCase() || ''

function fileIcon(name) {
  const icons = {
    md: RiMarkdownLine,
    pdf: RiFilePdf2Line,
    doc: RiFileWord2Line,
    docx: RiFileWord2Line,
    xlsx: RiFileExcel2Line,
    txt: RiFileTextLine
  }
  return icons[fileExtension(name)] || RiFileLine
}

function fileTone(name) {
  const tones = {
    md: 'markdown',
    pdf: 'pdf',
    doc: 'word',
    docx: 'word',
    xlsx: 'excel',
    txt: 'text'
  }
  return tones[fileExtension(name)] || 'default'
}

function fileTypeLabel(name) {
  const extension = fileExtension(name)
  const labels = {
    md: 'Markdown',
    pdf: 'PDF',
    doc: 'Word',
    docx: 'Word',
    xlsx: 'Excel',
    txt: 'Text'
  }
  return labels[extension] || '文件'
}

function formatFileSize(bytes = 0) {
  if (!bytes) return '0KB'
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function onSend(text = '') {
  const normalizedText = text.trim()
  if (!normalizedText) return
  if (!inputEnabled.value) return
  if (phase.value === 'idle') return startCreate(normalizedText)
  if (phase.value === 'analysis') return answerAskByText(normalizedText)
  // 等待确认期间的输入一律按「修改蓝图」处理，与点「调整蓝图」等价
  if (phase.value === 'blueprint') return reviseBlueprint(normalizedText)
}

function answerAskByText(text) {
  const m = [...messages.value].reverse().find((x) => x.type === 'ask-group' && !x.submitted)
  if (!m) return
  submitAskGroup(m, text)
}

function pickSuggestion(s) {
  if (phase.value !== 'idle') return
  onSend(s.prompt)
}

function focusComposer() {
  document.querySelector('.ac-composer-input')?.focus()
}

/** 点「调整蓝图」：聚焦并高亮输入框，方便继续对话修改。 */
function focusRevise() {
  if (phase.value !== 'blueprint' || bpMode.value === 'confirmed') return
  bpMode.value = 'revising'
  highlightInput.value = true
  nextTick(() => focusComposer())
}

function submitBlueprintComment({ section, text }) {
  if (phase.value !== 'blueprint' || bpMode.value === 'confirmed' || busy.value) return
  reviseBlueprint(`针对蓝图「${section}」的修改意见：${text}`)
}

// ============================================================
// 阶段 1 需求描述 → 阶段 2 业务分析（调用 skill + 选择题追问）
// ============================================================
async function startCreate(text) {
  const docs = files.value.map((f) => f.name)
  const reqText = text || '（已上传需求文档，请据此分析业务）'
  files.value = []
  pushUser(reqText, docs)
  phase.value = 'intake'
  busy.value = true
  await sleep(700)
  push({ role: 'ai', type: 'intake', stageKey: 'requirement', docs, summary: reqText })
  await sleep(300)

  push({
    role: 'ai',
    type: 'skill',
    stageKey: 'analysis',
    text: '已调用「业务分析 skill」',
    sub:
      `调用方式：${analysisSkillNote.value}。` +
      '按 references/comparison-checklist.md 的字段清单与《业务系统蓝图模板》逐项比对，' +
      '缺失项合并为一张信息补充卡片一次收集；追问不属于确认。'
  })
  await sleep(500)
  pushAsk()
}

function pushAsk() {
  push({
    role: 'ai',
    type: 'ask-group',
    stageKey: 'analysis',
    questions: AI_QUESTIONS,
    answers: AI_QUESTIONS.map(() => ({ value: '', picked: [], draft: '' })),
    submitted: false,
    answerSummary: []
  })
  phase.value = 'analysis'
  busy.value = false
  nextTick(() => focusComposer())
}

function askGroupReady(m) {
  return m.questions.every((q, index) => {
    const answer = m.answers[index]
    if (q.type === 'single') return Boolean(answer.value)
    if (q.type === 'multi') return answer.picked.length > 0
    return Boolean(answer.draft.trim())
  })
}

function syncAskCollapse(m, value) {
  m.collapsed = !value.includes('content')
}

function askGroupReply(q, answer) {
  if (q.type === 'single') {
    return q.options.find((option) => option.label === answer)?.reply || `已记录：${answer}。`
  }
  return q.reply(q.type === 'multi' ? answer.split('、') : answer)
}

async function submitAskGroup(m, freeform = '') {
  if (m.submitted || busy.value || (!freeform && !askGroupReady(m))) return
  if (freeform) {
    m.submitted = true
    m.answerSummary = [{ title: '整体答复', value: freeform }]
    busy.value = true
    pushUser(freeform)
    await sleep(260)
    push({ role: 'ai', type: 'text', text: `已记录你的整体答复：${freeform}。` })
    await sleep(320)
    runToBlueprint()
    return
  }

  const answers = m.questions.map((q, index) => {
    const answer = m.answers[index]
    if (q.type === 'single') return answer.value
    if (q.type === 'multi') return answer.picked.join('、')
    return answer.draft.trim()
  })
  m.submitted = true
  m.answerSummary = m.questions.map((q, index) => ({ title: q.title, value: answers[index] }))
  busy.value = true

  pushUser(answers.join('；'))
  await sleep(260)
  push({
    role: 'ai',
    type: 'text',
    text: m.questions.map((q, index) => askGroupReply(q, answers[index])).join(' ')
  })

  await sleep(320)
  runToBlueprint()
}

// ============================================================
// 阶段 3 业务系统蓝图（生成 → 调整 → 确认，唯一一次确认）
// ============================================================
async function runToBlueprint() {
  phase.value = 'blueprint'
  bpMode.value = 'generating'
  busy.value = true
  await sleep(1100)
  blueprintMd.value = buildBlueprintMd()
  previewTab.value = 'blueprint'
  push({ role: 'ai', type: 'text', text: '业务系统蓝图已生成，请在右侧「蓝图」Tab 查看。' })
  await sleep(220)
  pushConfirmCard()
}

function pushConfirmCard() {
  const m = push({
    role: 'ai',
    type: 'confirm',
    stageKey: 'blueprint',
    round: revisions.value.length,
    status: 'waiting'
  })
  activeBpCardId.value = m.id
  bpMode.value = 'waiting'
  busy.value = false
}

/** 按钮只在最新一轮蓝图卡片下显示 */
const isActiveBp = (m) => m.id === activeBpCardId.value && m.status === 'waiting'

function startBuild(m) {
  if (!isActiveBp(m)) return
  m.status = 'confirmed'
  activeBpCardId.value = null
  bpMode.value = 'confirmed'
  highlightInput.value = false
  runGeneration()
}

async function reviseBlueprint(text) {
  const cur = messages.value.find((x) => x.id === activeBpCardId.value)
  if (cur) cur.status = 'superseded'
  activeBpCardId.value = null

  highlightInput.value = false
  busy.value = true
  bpMode.value = 'generating'
  pushUser(text)

  revisions.value.push(text)
  await sleep(1100)
  // 每轮修改直接覆盖为最新蓝图：仅保留最新版，不提供版本切换
  blueprintMd.value = buildBlueprintMd({ revisions: revisions.value.slice() })
  previewTab.value = 'blueprint'
  push({
    role: 'ai',
    type: 'text',
    text: '已按你的意见更新蓝图（仅保留最新版，不支持版本切换），请在右侧「蓝图」Tab 查看。'
  })
  await sleep(220)
  pushConfirmCard()
}

// ============================================================
// 阶段 4 应用包生成：先生成应用并自动发布，再创建业务应用包
// ============================================================
const autoItems = computed(() => genItems.filter((i) => i.kind === 'auto'))
const autoDoneCount = computed(
  () => autoItems.value.filter((i) => ['published', 'unpublished'].includes(i.status)).length
)
/** 未完成（待人工创建 / 生成失败）——计入待完成任务文档，由人工处理 */
const pendingCount = computed(
  () => genItems.filter((i) => ['manual', 'error'].includes(i.status)).length
)
function buildGenItems() {
  const items = []
  AI_SCENE.groups.forEach((g) => {
    g.apps.forEach((a, idx) => {
      items.push({
        id: `${g.name}-${a.name}-${idx}`,
        name: a.name,
        engine: a.engine,
        kind: a.kind,
        fail: !!a.fail,
        publishFail: !!a.publishFail,
        status: 'pending',
        reason: ''
      })
    })
  })
  return items
}

async function runGeneration() {
  phase.value = 'generating'
  genMode.value = 'apps'
  pkgState.value = 'idle'
  pkgInfo.value = null
  previewTab.value = 'build'
  autoFollow.value = true

  genItems.splice(0, genItems.length, ...buildGenItems())
  push({ role: 'ai', type: 'progress', stageKey: 'generate' })

  for (const it of genItems) {
    // 报表 / 报告 / 信息查询：本期不支持自动创建，计入待完成任务文档（绝不算失败）
    if (it.kind === 'manual') {
      it.status = 'manual'
      await sleep(240)
      continue
    }
    it.status = 'running'
    if (autoFollow.value) previewTargetId.value = it.id
    await sleep(620)

    // 边界演示：生成失败 → 标红 + 原因，不提供重试、不阻塞后续应用
    if (it.fail) {
      it.status = 'error'
      it.reason = AI_FAIL_ITEM.reason
      continue
    }
    // 边界演示：应用自动发布失败 → 「已生成 · 未发布」，不提供重试、不阻塞业务应用包创建
    if (it.publishFail) {
      it.status = 'unpublished'
      it.reason = '自动发布失败：引擎发布接口超时（演示）'
      continue
    }
    it.status = 'published'
  }

  if (autoFollow.value) previewTargetId.value = autoItems.value.at(-1)?.id || ''
  await maybeFinishGeneration()
}

/** 失败项不阻塞：生成失败 / 未发布的均计入待完成任务文档，应用队列跑完即创建业务应用包 */
async function maybeFinishGeneration() {
  if (genMode.value === 'package' || genMode.value === 'done') return
  genMode.value = 'package'
  await createPackage()
}

async function createPackage() {
  pkgState.value = 'running'
  pkgInfo.value = await createPackageFromAi({ pkgName: AI_SCENE.systemName })
  pkgState.value = 'ok'
  await finishAll()
}

async function finishAll() {
  genMode.value = 'done'
  previewTab.value = 'build'
  await sleep(400)
  phase.value = 'done'
  busy.value = false
  push({ role: 'ai', type: 'done', stageKey: 'finish' })
}

function pinTarget(it) {
  previewTargetId.value = it.id
  autoFollow.value = false
}

// ============================================================
// 阶段 5 搭建完成：待完成任务文档 + 系统跳转链接
// ============================================================
const todoCount = countTodo()
const todoRows = DELIVERABLE_AFTER_GEN.filter((r) => r.status !== '✅ 已完成')

function triggerDownload(href, name) {
  const a = document.createElement('a')
  a.href = href
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** 下载《业务系统蓝图》（第 13 节按本次实际生成结果回填，即待完成任务清单） */
function downloadBlueprintDoc() {
  const name = `${BLUEPRINT_DOC_NAME}.md`
  try {
    // 带 BOM：Windows 记事本打开时中文不乱码
    const blob = new Blob(['﻿' + BLUEPRINT_DOC_MD], {
      type: 'text/markdown;charset=utf-8'
    })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, name)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch {
    triggerDownload(
      `data:text/markdown;charset=utf-8,${encodeURIComponent(BLUEPRINT_DOC_MD)}`,
      name
    )
  }
}

function jumpToSystem() {
  ElMessage({
    message: '已跳转到该业务系统的搭建页（演示环境落到示例应用包）',
    type: 'success'
  })
  router.push('/builder/home')
}

function onBack() {
  // PRD：未完成前中途退出，系统不保留创建任务、不提供中断恢复
  // 2026-10-11：创建入口迁至业务应用包管理页面（PRD v3.0 模块十四），返回目标随之调整
  router.push('/package/manage')
}

// 阶段 0 为 hero 初始态（问候语 + 示例卡片由模板渲染，不走消息流），
// 因此这里不预置欢迎语消息；用户发出第一条需求后才进入对话流。
</script>

<style scoped>
.ac-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--layout-main-bg, #f5f8ff);
  overflow: hidden;
}

/* ---------------- 顶栏（对齐搭建页：64px、浅蓝白底、无分割线） ---------------- */
.ac-header {
  flex: none;
  height: var(--builder-header-height, 64px);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid #e9edf5;
  backdrop-filter: blur(14px);
}
.ac-back {
  flex: none;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #e4e8f1;
  border-radius: 12px;
  background: var(--fill-1);
  color: var(--text-1) !important;
  box-shadow: 0 1px 2px rgba(20, 27, 45, 0.04);
}
.ac-back:hover {
  background: #eef1ff;
  border-color: #b9c2ff;
  color: var(--brand-1) !important;
}
.ac-header-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-1);
}
.ac-header-sub {
  font-size: 13px;
  color: #7b8495;
}

/* ---------------- 主体 ---------------- */
.ac-body {
  flex: 1;
  min-height: 0;
  display: flex;
}
/* 阶段 0～2：单栏，对话框居中 */
.ac-body.single {
  align-items: center;
  justify-content: center;
  padding: 32px 24px 48px;
  background: #f7f8fc;
}
.ac-body.single .ac-chat {
  flex: 0 1 auto;
  width: 100%;
  max-width: 960px;
  max-height: 100%;
}
/* 初始态（hero）：对话框高度随内容、整体居中，消息流封顶后内部滚动 */
.ac-body.single .ac-chat.hero .ac-stream {
  flex: 0 1 auto;
  max-height: 48vh;
}
/* 对话态（发出第一条消息后）：对话框固定高度（撑满主体），不再随对话内容自动展开，
   消息流占满剩余空间并内部滚动 */
.ac-body.single .ac-chat:not(.hero) {
  height: 100%;
  max-height: 100%;
}
.ac-body.single .ac-chat:not(.hero) .ac-stream {
  flex: 1;
  max-height: none;
}
/* 阶段 3 起：两栏（左右及底部面板间距 8px） */
.ac-body.two-col {
  gap: 0;
  padding: 0 8px 8px;
}
.ac-body.two-col .ac-chat {
  flex: 1;
  min-width: 0;
}

/* ================= 左栏：对话区（面板风格对齐搭建页：描边、无投影、12px 圆角） ================= */
.ac-chat {
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: #fff;
  border: 1px solid var(--border-2);
  border-radius: var(--builder-panel-radius, 12px);
  overflow: hidden;
}

/* ---- 阶段 0：hero 初始态（无卡片边框，内容整体居中） ---- */
.ac-body.single .ac-chat.hero {
  background: transparent;
  box-shadow: none;
  border: none;
  border-radius: 0;
  overflow: visible;
  justify-content: center;
  align-items: center;
  gap: 22px;
  padding: 0 8px;
}
/* 三段顺序：标题 → 输入框 → 示例卡片 */
.ac-chat.hero .ac-hero-top {
  order: 1;
}
.ac-chat.hero .ac-composer {
  order: 2;
  width: 100%;
  max-width: 760px;
  padding: 0;
  border-top: none;
}
.ac-chat.hero .ac-hero-cards {
  order: 3;
}
/* 对话态顺序：消息流 → 输入区（顶部步骤条已去掉，2026-10-11） */
.ac-chat:not(.hero) .ac-stream {
  order: 1;
}
.ac-chat:not(.hero) .ac-composer {
  order: 2;
}

.ac-hero-top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.ac-hero-logo {
  width: 68px;
  height: 68px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: #fff;
  border: 1px solid #e5e9f2;
  box-shadow: 0 10px 28px rgba(73, 87, 139, 0.12);
  overflow: hidden;
}
.ac-hero-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.ac-hero-logo :deep(.app-icon) {
  color: var(--brand-1);
}
.ac-hero-title {
  margin: 0;
  font-size: 30px;
  line-height: 1.25;
  font-weight: 650;
  color: var(--text-1);
  text-align: center;
  letter-spacing: 0;
}
.ac-hero-subtitle {
  margin: 0;
  color: #7b8495;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

/* 示例引导卡片（图标 + 标题一行，说明另起一行） */
.ac-hero-cards {
  width: 100%;
  max-width: 760px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.ac-hero-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 106px;
  padding: 16px 18px;
  text-align: left;
  background: #fff;
  border: 1px solid #e5e9f2;
  border-radius: 16px;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(20, 27, 45, 0.03);
  transition:
    border-color var(--motion-hover),
    box-shadow var(--motion-hover),
    transform var(--motion-hover);
}
.ac-hero-card:hover {
  border-color: #e5e9f2;
  box-shadow: 0 10px 24px rgba(73, 87, 139, 0.1);
  transform: translateY(-2px);
}
.ac-hero-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ac-hero-card-icon {
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ac-hero-card-icon.blue {
  background: var(--brand-7);
  color: var(--brand-1);
}
.ac-hero-card-icon.orange {
  background: color-mix(in srgb, var(--color-status-warning) 12%, transparent);
  color: var(--color-status-warning);
}
.ac-hero-card-icon.purple {
  background: #f0ecff;
  color: #6b52d6;
}
.ac-hero-card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-1);
}
.ac-hero-card-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-3);
}

@media (max-width: 1100px) {
  .ac-hero-cards {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* 消息流 */
.ac-stream {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.ac-row {
  display: flex;
  gap: 8px;
}
.ac-row.ai {
  justify-content: flex-start;
}
.ac-row.user {
  justify-content: flex-end;
}
.ac-avatar {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--brand-7);
  color: var(--brand-1);
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.ac-row.ai > .ac-card,
.ac-row.ai > .ac-bubble {
  width: 100%;
  max-width: none;
  box-sizing: border-box;
}
.ac-bubble {
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 13px;
  line-height: 1.8;
  background: var(--fill-2);
  color: var(--text-1);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.ac-row.user .ac-bubble {
  background: var(--brand-7);
}

/* 卡片 */
.ac-card {
  background: var(--fill-4);
  border: 1px solid var(--border-2);
  border-radius: var(--radius-lg);
  padding: 12px 14px;
}
.ac-card-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-1);
}
.ac-card-head .ok {
  color: var(--color-status-success);
}
.ac-card-head .warn {
  color: var(--color-status-warning);
}
.ac-card-head .running {
  color: var(--color-status-info);
}
.ac-card-head .brand {
  color: var(--brand-1);
}
.ac-card-text {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--text-2);
}
.ac-card-note {
  color: var(--text-4);
}
.ac-card-foot {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--text-4);
  line-height: 1.7;
}
.ac-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.ac-complete-actions .el-button + .el-button {
  margin-left: 0;
}
.ac-complete-actions .el-button:not(.el-button--primary):hover,
.ac-complete-actions .el-button:not(.el-button--primary):focus-visible {
  background: var(--brand-8);
  color: var(--brand-1);
}
.ac-blueprint-actions .el-button + .el-button {
  margin-left: 0;
}
.ac-card-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-3);
}
.ac-fact-link {
  color: var(--brand-1);
  cursor: pointer;
}
.ac-uncertain {
  margin-top: 10px;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-sm);
}
.ac-uncertain-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-status-warning);
}
.ac-uncertain ul {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--text-2);
}
.ac-card-answered {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-status-success);
}
.ac-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin-top: 10px;
}
/* 展开 / 收起 */
.ac-fold {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 1;
  cursor: pointer;
  color: var(--icon-1);
}
.ac-fold.el-button:hover,
.ac-fold.el-button:focus-visible {
  color: var(--text-2);
  background: #f4f6fa;
}
.ac-fold.el-button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(64, 128, 255, 0.14);
}
.ac-fold-icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
  transform: rotate(-90deg);
  transition: transform var(--motion-hover);
}
.ac-fold-icon.open {
  transform: rotate(0);
}

/* 需求接收摘要：标题、展开控件和正文保持紧凑的阅读节奏。 */
.ac-card.intake .ac-card-head {
  gap: 8px;
}
.ac-card.intake .ac-fold {
  flex: none;
  width: 16px;
  height: 16px;
  margin-left: 0;
  padding: 0;
  border: 0;
  background: transparent;
}
.ac-card.intake .ac-fold-icon {
  font-size: 16px;
}
.ac-card.intake .ac-card-text {
  margin-top: 4px;
}

/* 进度与完成卡片的折叠控件紧跟标题信息，不推到卡片最右侧。 */
.ac-card.progress .ac-fold,
.ac-card.done .ac-fold {
  margin-left: 0;
}

/* 需求接入 / 追问 / 蓝图确认 / 完成 卡片的差异 */
.ac-card.skill {
  background: var(--brand-8);
  border-color: var(--brand-7);
}
.ac-card.ask {
  border-color: var(--color-status-warning);
}
.ac-card.confirm {
  border-color: var(--color-status-warning);
}
.ac-card.confirm.confirmed {
  border-color: var(--color-status-success);
  background: var(--fill-4);
}
.ac-card.confirm.superseded {
  border-color: var(--border-2);
  background: var(--fill-2);
  opacity: 0.85;
}
.ac-card.done {
  border-color: var(--color-status-success);
}
.ac-done-icon {
  color: var(--color-status-success);
}

/* 生成进度 */
/* 计数紧跟标题右侧（不推向最右，右侧仍留折叠箭头） */
.ac-progress-count {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-3);
}
.ac-progress {
  margin-top: 12px;
}
.ac-progress-table {
  --el-table-border-color: var(--border-2);
  --el-table-header-bg-color: var(--fill-2);
  --el-table-bg-color: var(--fill-1);
  --el-table-tr-bg-color: var(--fill-1);
  --el-table-row-hover-bg-color: var(--fill-1);
  --el-table-text-color: var(--text-1);
  --el-table-header-text-color: var(--text-1);
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  overflow: hidden;
}
.ac-progress-table :deep(.el-table__inner-wrapper::before) {
  height: 0;
}
.ac-progress-table :deep(th.el-table__cell) {
  padding: 0;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
}
.ac-progress-table :deep(td.el-table__cell) {
  padding: 0;
  vertical-align: top;
  font-size: 14px;
}
.ac-progress-table :deep(.cell) {
  font-size: 14px;
  line-height: 1.5;
}
.ac-progress-table :deep(th.el-table__cell .cell) {
  padding: 8px 16px;
}
.ac-progress-table :deep(td.el-table__cell .cell) {
  padding: 10px 16px;
}
.ac-progress-status.published {
  color: var(--color-status-success);
}
.ac-progress-status.error {
  color: var(--color-status-error);
}
.ac-progress-status.unpublished {
  color: var(--color-status-warning);
}
.ac-progress-name {
  color: var(--text-1);
  font-weight: var(--font-weight-medium);
}
.ac-progress-engine {
  color: var(--text-1);
}
.ac-progress-status {
  color: var(--text-1);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
}
.ac-progress-status.manual {
  color: var(--color-status-info);
}
.ac-progress-reason {
  color: var(--text-1);
}

/* 创建业务应用包 */
.ac-pkg {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px dashed var(--border-4);
  border-radius: var(--radius-md);
}
.ac-pkg.ok {
  border-style: solid;
  border-color: color-mix(in srgb, var(--color-status-success) 70%, transparent);
  background: color-mix(in srgb, var(--color-status-success) 12%, transparent);
}
.ac-pkg-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-1);
}
.ac-pkg-note {
  font-size: 11.5px;
  font-weight: 400;
  color: var(--text-4);
}
.ac-pkg-text {
  margin: 6px 0 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-2);
  display: flex;
  align-items: center;
  gap: 6px;
}
.ac-pkg-text.ok {
  color: var(--color-status-success);
}

/* 搭建完成 */
.ac-todo {
  margin-top: 10px;
}
.ac-todo-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: var(--font-weight-bold);
  color: var(--text-1);
}
.ac-todo-title-icon {
  flex: 0 0 20px;
  color: currentColor;
}
.ac-todo-list {
  margin: 6px 0 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.8;
  color: var(--text-2);
}
.ac-todo-module {
  color: var(--text-1);
  font-weight: 600;
  margin-right: 6px;
}
.ac-todo-more {
  margin: 6px 0 0;
  font-size: 11.5px;
  color: var(--text-4);
}
/* 新消息提示：锚定输入区顶部，始终保持 24px 间距并水平居中。 */
.ac-jump.el-button {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 24px);
  z-index: 21;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--color-border-subtle);
  border-radius: 50%;
  background: var(--color-bg-container);
  color: var(--color-text-placeholder);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-1);
}
.ac-jump.el-button:hover,
.ac-jump.el-button:focus-visible {
  border-color: var(--color-primary-focus);
  background: var(--ac-primary-soft);
  color: var(--ac-primary) !important;
}

/* 附件 */
.ac-docs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.ac-doc {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: #fff;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-2);
}

/* ================= 输入区（composer） ================= */
.ac-composer {
  flex: none;
  position: relative;
  padding: 10px 16px 12px;
  border-top: 1px solid var(--border-1);
}
.ac-attach-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

/* 渐变描边：外层画渐变、内层白底 */
.ac-composer-box {
  padding: 1.5px;
  border-radius: 18px;
  background: linear-gradient(135deg, #a8c7ff 0%, #8ad8f5 45%, #b9c6ff 100%);
  transition: box-shadow var(--motion-hover);
}
/* 初始态才加外层光晕——对话态输入框在白色卡片内，光晕会显脏 */
.ac-chat.hero .ac-composer-box {
  box-shadow: 0 0 20px rgba(122, 178, 255, 0.35);
}
.ac-composer-inner {
  background: #fff;
  border-radius: 16.5px;
  padding: 10px 12px 8px;
}
.ac-composer-inner :deep(.el-textarea__inner) {
  padding: 0;
  border: none;
  box-shadow: none;
  background: transparent;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-1);
  font-family: inherit;
}
.ac-composer-inner :deep(.el-textarea__inner::placeholder) {
  color: var(--icon-1);
}
/* 点「调整蓝图」后的高亮提示 */
.ac-composer.is-highlight .ac-composer-box {
  box-shadow: 0 0 0 4px rgba(0, 71, 255, 0.12);
}
.ac-composer.is-highlight .ac-composer-inner {
  background: var(--brand-8);
}

.ac-composer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 6px;
}
.ac-composer-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

/* 工具按钮（附件 / 技能）：设计稿的文字按钮形态 */
.ac-tool-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 8px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-2);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition:
    background var(--motion-hover),
    color var(--motion-hover);
}
.ac-tool-btn:hover:not(:disabled) {
  background: var(--fill-2);
  color: var(--text-1);
}
.ac-tool-btn:disabled {
  color: var(--text-disabled);
  cursor: not-allowed;
}
.ac-tool-skill {
  border: 1px solid var(--border-2);
  background: #fff;
}
.ac-tool-caret {
  font-size: 11px;
  color: var(--icon-1);
}

/* 圆形发送按钮 */
.ac-send {
  flex: none;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-1);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  transition: background var(--motion-hover);
}
.ac-send:hover:not(:disabled) {
  background: var(--brand-2, #0038cc);
}
.ac-send:disabled {
  background: var(--fill-2);
  color: var(--icon-2);
  opacity: 0.4;
  cursor: not-allowed;
}

/* ================= 分割线（可拖拽调宽） ================= */
.ac-splitter {
  flex: none;
  width: 8px;
  position: relative;
  cursor: col-resize;
}
.ac-splitter::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 3px;
  width: 2px;
  background: transparent;
  transition: background var(--motion-hover);
}
.ac-splitter:hover::before,
.ac-splitter.active::before {
  background: var(--brand-1);
}
/* 拖拽中：整页禁止选中文本、光标保持一致 */
.ac-body.dragging {
  user-select: none;
  cursor: col-resize;
}
.ac-body.dragging .ac-preview {
  transition: none;
}

/* ================= 右栏（面板风格对齐搭建页：描边、无投影、12px 圆角） ================= */
.ac-preview {
  flex: none;
  min-width: 0;
  background: #fff;
  border: 1px solid var(--border-2);
  border-radius: var(--builder-panel-radius, 12px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.ac-tabs {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.ac-tabs :deep(.el-tabs__header) {
  flex: none;
  margin: 0;
  padding: 0 var(--spacing-xl);
  height: 48px;
  border-bottom: 1px solid var(--border-2);
}
.ac-tabs :deep(.el-tabs__item) {
  height: 48px;
  line-height: 48px;
  font-size: 16px;
}
.ac-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
.ac-tabs :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
}
.ac-tabs :deep(.el-tab-pane) {
  height: 100%;
}
.ac-pane {
  height: 100%;
  overflow-y: auto;
  padding: 14px var(--spacing-xl) 20px;
}
.ac-pane-blueprint {
  overflow: hidden;
  padding: 0;
}
.ac-pane-blueprint :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}
.ac-pane-blueprint :deep(.el-scrollbar__view) {
  min-height: 100%;
  padding: var(--spacing-xl) var(--spacing-xl) 20px;
}

/* 空态 */
.ac-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-4);
  font-size: 13px;
}
.ac-empty-illustration {
  display: block;
  width: 100px;
  height: 100px;
  object-fit: contain;
}
.ac-empty p {
  margin: 0;
  color: var(--text-3);
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
}

/* 业务搭建：应用清单 + iframe 外框 */
/* 该标签页改为纵向 flex：清单（最多 4 行，超出滚动）+ 预览框撑满剩余高度 */
.ac-pane-build {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 8px 24px 24px;
}
.ac-build-head {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
}
/* 一行多卡网格：列数由 --build-cols 按栏宽自适应（初始 4），1fr 均分保证卡片等宽；
   高度最多 4 行，卡片内容自适应并保留最小高度，超出时滚动 */
.ac-build-list {
  flex: none;
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(var(--build-cols, 4), minmax(0, 1fr));
  gap: 8px;
  max-height: calc(4 * 52px + 3 * 8px);
  overflow-y: auto;
}
.ac-build-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  height: auto;
  min-height: 52px;
  padding: 8px 12px;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  font-size: 12.5px;
  color: var(--text-2);
  cursor: pointer;
  background: var(--fill-1);
  min-width: 0;
  transition:
    border-color var(--motion-hover),
    background var(--motion-hover);
}
.ac-build-top {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.ac-build-item:hover {
  background: var(--fill-2);
}
.ac-build-item.active {
  border-color: var(--brand-1);
  background: var(--brand-8);
}
.ac-build-item.manual {
  color: var(--text-3);
  background: var(--fill-2);
}
.ac-build-item.error {
  border-color: var(--border-2);
  color: var(--color-status-error);
}
.ac-build-item.active,
.ac-build-item.active.error {
  border-color: var(--color-primary);
}
.ac-build-name {
  color: var(--text-1);
  font-size: 14px;
  font-weight: var(--font-weight-bold);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ac-build-status {
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding-left: 22px;
  font-size: 11.5px;
  line-height: 1.4;
  font-weight: var(--font-weight-bold);
  color: var(--text-3);
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
}
.ac-build-item.published .ac-build-status {
  color: var(--color-status-success);
}
.ac-build-item.unpublished .ac-build-status {
  color: var(--color-status-warning);
}
.ac-build-item.error .ac-build-status {
  color: var(--color-status-error);
}
/* 预览框撑满清单以下的剩余区域 */
.ac-frame {
  flex: 1;
  min-height: 0;
  margin-top: 8px;
  border: 1px solid var(--border-2);
  border-radius: 16px;
  background: var(--fill-2);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ac-frame-empty {
  color: var(--text-1);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: 1.5;
}

/* 动效 */
.is-spin {
  animation: ac-spin 1s linear infinite;
}
@keyframes ac-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---------------- HeroUI 风格对话态覆盖（仅视觉，不改流程） ---------------- */
.ac-body.single .ac-chat:not(.hero),
.ac-body.two-col .ac-chat {
  border-color: #e5e9f2;
  border-radius: 20px;
  box-shadow: 0 8px 30px rgba(44, 56, 91, 0.06);
}
.ac-row {
  gap: 10px;
}
.ac-avatar {
  width: 30px;
  height: 30px;
  margin-top: 2px;
  border-radius: 10px;
  background: #eef1ff;
  color: #5b6cff;
}
.ac-bubble {
  padding: 11px 15px;
  border: 1px solid transparent;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.7;
}
.ac-row.user .ac-bubble {
  background: #eef1ff;
  border-color: #e0e5ff;
  color: #28325f;
}
.ac-card {
  border-color: #e5e9f2;
  border-radius: 18px;
  padding: 16px 18px;
  box-shadow: 0 2px 8px rgba(20, 27, 45, 0.03);
}
.ac-card-head {
  font-size: 14px;
}
.ac-card-text {
  font-size: 14px;
  line-height: 1.75;
}
.ac-card.skill {
  background: #f6f7ff;
  border-color: #dfe4ff;
}
.ac-card.ask {
  background: #fffdfa;
  border-color: #f0b35f;
}
.ac-card-actions .el-button {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
}
.ac-card-actions .el-button--primary {
  box-shadow: 0 5px 14px rgba(91, 108, 255, 0.18);
}
.ac-composer {
  padding: 14px 20px 18px;
  border-top-color: #edf0f5;
  background: rgba(255, 255, 255, 0.82);
}
.ac-composer-box {
  padding: 1px;
  border-radius: 20px;
  background: #dfe4ee;
  box-shadow: 0 6px 22px rgba(44, 56, 91, 0.06);
}
.ac-composer-inner {
  min-height: 82px;
  padding: 13px 14px 10px;
  border-radius: 19px;
}
.ac-composer-inner:focus-within {
  box-shadow: 0 0 0 4px rgba(91, 108, 255, 0.12);
}
.ac-send {
  width: 36px;
  height: 36px;
  background: #5b6cff;
  box-shadow: 0 6px 14px rgba(91, 108, 255, 0.2);
}
.ac-send:hover:not(:disabled) {
  background: #4c5be8;
}
.ac-tool-btn {
  height: 32px;
  border-radius: 10px;
}
.ac-tool-skill {
  border-color: #e3e7f0;
  background: #fff;
}

@media (max-width: 720px) {
  .ac-header {
    padding: 0 16px;
  }
  .ac-header-sub {
    display: none;
  }
  .ac-body.single {
    padding: 24px 16px 32px;
  }
  .ac-hero-title {
    font-size: 25px;
  }
  .ac-hero-cards {
    grid-template-columns: 1fr;
  }
  .ac-stream {
    padding: 18px 16px;
  }
  .ac-composer {
    padding: 10px 12px 12px;
  }
}

/* ---------------- 视觉系统强化：保留结构，统一 AI 工作台气质 ---------------- */
.ac-page {
  --ac-bg: #f4f6fb;
  --ac-surface: #ffffff;
  --ac-surface-soft: #fafbfe;
  --ac-ink: #1d2333;
  --ac-muted: #74809a;
  --ac-line: #e1e5ef;
  --ac-primary: var(--color-primary);
  --ac-primary-strong: var(--color-primary-active);
  --ac-primary-soft: var(--color-primary-light);
  --ac-warm: #f0a25a;
  --ac-shadow: 0 18px 48px rgba(40, 49, 88, 0.09);
  background: var(--ac-bg);
  color: var(--ac-ink);
}

.ac-header {
  height: 72px;
  padding: 0 30px;
  gap: 14px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid var(--ac-line);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);
}
.ac-back {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  border-color: var(--ac-line);
  color: var(--ac-ink) !important;
  box-shadow: 0 4px 12px rgba(40, 49, 88, 0.06);
}
.ac-back:hover {
  background: var(--ac-primary-soft);
  border-color: #c8cbff;
  color: var(--ac-primary) !important;
}
.ac-header-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ac-ink);
}
.ac-header-sub {
  position: relative;
  margin-left: 2px;
  padding-left: 15px;
  color: var(--ac-muted);
  font-size: 13px;
}
.ac-header-sub::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #b6bdd0;
  transform: translateY(-50%);
}

.ac-body.single {
  padding: 44px 28px 54px;
  background: var(--ac-bg);
}
.ac-body.single .ac-chat.hero {
  gap: 28px;
  padding: 0 12px;
}
.ac-hero-top {
  gap: 13px;
}
.ac-hero-logo {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  border: 1px solid #dfe3f3;
  background: var(--ac-primary-soft);
  box-shadow: 0 16px 34px rgba(91, 92, 226, 0.16);
}
.ac-hero-title {
  font-size: 36px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--ac-ink);
}
.ac-hero-subtitle {
  color: var(--ac-muted);
  font-size: 15px;
  line-height: 1.65;
}
.ac-chat.hero .ac-composer,
.ac-hero-cards {
  max-width: 880px;
}
.ac-composer-box {
  padding: 2px;
  border-radius: 24px;
  background: #dfe2f2;
  box-shadow: var(--ac-shadow);
}
.ac-composer-inner {
  min-height: 104px;
  padding: 16px 18px 12px;
  border-radius: 22px;
  background: var(--ac-surface);
}
.ac-composer-inner :deep(.el-textarea__inner) {
  padding: 0;
  color: var(--ac-ink);
  font-size: 15px;
  line-height: 1.65;
}
.ac-composer-inner :deep(.el-textarea__inner::placeholder) {
  color: #9aa3b7;
}
.ac-composer-inner:focus-within {
  box-shadow: 0 0 0 4px rgba(91, 92, 226, 0.13);
}
.ac-composer-bar {
  margin-top: 10px;
}
.ac-tool-btn {
  height: 34px;
  padding: 0 10px;
  border-radius: 11px;
  color: #66718a;
}
.ac-tool-btn:hover:not(:disabled) {
  background: var(--ac-primary-soft);
  color: var(--ac-primary-strong);
}
.ac-tool-skill {
  border-color: #e2e5f1;
  background: var(--ac-surface-soft);
}
.ac-send {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: var(--ac-primary);
  box-shadow: 0 8px 18px rgba(91, 92, 226, 0.24);
}
.ac-send:hover:not(:disabled) {
  background: var(--ac-primary-strong);
}
.ac-cancel {
  background: #20263a;
  box-shadow: 0 8px 18px rgba(32, 38, 58, 0.2);
}
.ac-cancel:hover:not(:disabled) {
  background: #111522;
}

.ac-hero-cards {
  gap: 16px;
}
.ac-hero-card {
  min-height: 124px;
  padding: 19px 20px;
  gap: 12px;
  border: 1px solid var(--ac-line);
  border-radius: 20px;
  background: var(--ac-surface);
  box-shadow: 0 8px 24px rgba(40, 49, 88, 0.055);
}
.ac-hero-card:hover {
  border-color: #bfc2ff;
  box-shadow: 0 16px 32px rgba(91, 92, 226, 0.13);
  transform: translateY(-3px);
}
.ac-hero-card-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
}
.ac-hero-card-icon.blue {
  background: var(--ac-primary-soft);
  color: var(--ac-primary);
}
.ac-hero-card-icon.orange {
  background: #fff3e6;
  color: var(--ac-warm);
}
.ac-hero-card-icon.purple {
  background: #f2edff;
  color: #7353d4;
}
.ac-hero-card-title {
  font-size: 15px;
  color: var(--ac-ink);
}
.ac-hero-card-desc {
  color: var(--ac-muted);
  font-size: 13.5px;
  line-height: 1.65;
}

.ac-body.single .ac-chat:not(.hero),
.ac-body.two-col .ac-chat {
  border-color: var(--ac-line);
  border-radius: 24px;
  background: var(--ac-surface);
  box-shadow: var(--ac-shadow);
}
.ac-stream {
  padding: 32px 34px;
  gap: 20px;
  background: var(--ac-surface-soft);
}
.ac-avatar {
  width: 32px;
  height: 32px;
  margin-top: 3px;
  border-radius: 12px;
  background: var(--ac-primary-soft);
  color: var(--ac-primary);
  font-size: 12px;
}
.ac-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.7;
}
.ac-row.user .ac-bubble {
  background: #ececff;
  border-color: #dedfff;
  color: #31336e;
}
.ac-card {
  padding: 19px 21px;
  border-color: var(--ac-line);
  border-radius: 20px;
  background: var(--ac-surface);
  box-shadow: 0 6px 18px rgba(40, 49, 88, 0.045);
}
.ac-card-head {
  gap: 8px;
  font-size: 15px;
}
.ac-card-text {
  margin-top: 10px;
  color: #4b556c;
  font-size: 14px;
  line-height: 1.8;
}
.ac-card.skill {
  background: #f7f7ff;
  border-color: #dfe1ff;
}
.ac-card.ask {
  background: #fffaf4;
  border-color: #f1c18e;
  box-shadow: 0 8px 22px rgba(240, 162, 90, 0.09);
}
.ac-card.confirm {
  background: #f8f9ff;
  border-color: #bfc3ff;
  box-shadow: 0 10px 26px rgba(91, 92, 226, 0.1);
}
.ac-card.confirm.confirmed {
  background: #f7fcf9;
  border-color: #a9dfbe;
}
.ac-card.done {
  background: #f7fcf9;
  border-color: #a9dfbe;
}
.ac-card-actions .el-button {
  min-height: 38px;
  padding: 0 16px;
  border-radius: 12px;
}
.ac-card-actions .el-button--primary {
  --el-button-bg-color: var(--ac-primary);
  --el-button-border-color: var(--ac-primary);
  --el-button-hover-bg-color: var(--ac-primary-strong);
  --el-button-hover-border-color: var(--ac-primary-strong);
  box-shadow: none;
}
.ac-composer {
  padding: 16px 24px 22px;
  border-top-color: #edf0f6;
  background: rgba(255, 255, 255, 0.94);
}
.ac-composer-input {
  display: block;
  width: 100%;
  min-height: 54px;
  padding: 0;
  border: 0;
  outline: none;
  resize: none;
  overflow: auto;
  color: var(--ac-ink);
  background: transparent;
  font: inherit;
  font-size: 15px;
  line-height: 1.65;
}
.ac-composer-input::placeholder {
  color: #9aa3b7;
}
.ac-composer-input:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

@media (max-width: 720px) {
  .ac-header {
    height: 64px;
    padding: 0 16px;
  }
  .ac-header-sub {
    display: none;
  }
  .ac-body.single {
    padding: 28px 16px 36px;
  }
  .ac-hero-title {
    font-size: 28px;
  }
  .ac-hero-logo {
    width: 68px;
    height: 68px;
    border-radius: 20px;
  }
  .ac-stream {
    padding: 22px 16px;
  }
  .ac-composer {
    padding: 12px 14px 16px;
  }
}
/* ---------------- HeroUI-inspired empty state ----------------
   Keep Element Plus for behavior; this layer owns the page's visual language. */
.ac-page {
  --ac-bg: var(--color-bg-page);
  --ac-surface: var(--color-bg-container);
  --ac-surface-raised: var(--color-bg-container-hover);
  --ac-ink: var(--color-text-primary);
  --ac-muted: var(--color-text-secondary);
  --ac-line: var(--color-border-subtle);
  --ac-primary: var(--color-primary);
  --ac-primary-strong: var(--color-primary-active);
  --ac-primary-soft: var(--color-bg-brand-light);
  --ac-coral: var(--color-status-error);
  --ac-teal: var(--color-status-success);
  --ac-shadow-soft: var(--shadow-3);
  background: var(--ac-bg);
  color: var(--ac-ink);
}

.ac-header {
  height: 68px;
  padding: 0 var(--spacing-xl);
  gap: 13px;
  background: rgba(255, 255, 255, 0.94);
  border-bottom-color: var(--ac-line);
  box-shadow: 0 1px 0 rgba(16, 17, 20, 0.03);
}

.ac-back {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border-color: var(--ac-line);
  background: var(--ac-surface);
  color: var(--ac-ink) !important;
  box-shadow: 0 6px 16px rgba(38, 43, 68, 0.07);
}

.ac-back:hover {
  border-color: var(--color-primary-focus);
  background: var(--ac-primary-soft);
  color: var(--ac-primary) !important;
}

.ac-header-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--ac-ink);
}

.ac-header-sub {
  color: var(--ac-muted);
}

.ac-body.single {
  align-items: center;
  padding: 56px 28px 72px;
  background: var(--ac-bg);
  overflow-y: auto;
}

.ac-body.single .ac-chat.hero {
  gap: 30px;
  padding: 0 12px;
}

.ac-hero-top {
  gap: 14px;
}

.ac-hero-logo {
  width: 76px;
  height: 76px;
  border-radius: 26px;
  border: 1px solid var(--color-primary-light);
  background: var(--ac-primary-soft);
  box-shadow: 0 18px 36px rgba(0, 87, 255, 0.16);
}

.ac-hero-title {
  max-width: 680px;
  font-size: clamp(30px, 4vw, 42px);
  line-height: 1.15;
  font-weight: 750;
  letter-spacing: 0;
  color: var(--ac-ink);
}

.ac-hero-subtitle {
  max-width: 520px;
  color: var(--ac-muted);
  font-size: 15px;
}

.ac-chat.hero .ac-composer,
.ac-hero-cards {
  max-width: 900px;
}

.ac-chat.hero .ac-composer {
  margin-top: 14px;
}

.ac-composer {
  padding: 0;
  background: transparent;
}

.ac-composer-box {
  padding: 2px;
  border-radius: 26px;
  border: 1px solid #cddcff;
  background: var(--ac-surface);
  box-shadow: 0 16px 34px rgba(0, 87, 255, 0.1);
}

.ac-composer-inner {
  min-height: 118px;
  padding: 17px 18px 12px;
  border-radius: 24px;
  background: var(--ac-surface);
}

.ac-composer-inner:focus-within {
  box-shadow:
    var(--shadow-focus),
    0 16px 34px rgba(0, 87, 255, 0.1);
}

.ac-composer-input {
  min-height: 58px;
  font-size: 16px;
}

.ac-composer-input::placeholder {
  color: #9aa1b3;
}

.ac-composer-bar {
  margin-top: 12px;
}

.ac-tool-btn {
  height: 36px;
  border-radius: 12px;
  color: var(--ac-muted);
}

.ac-tool-btn:hover:not(:disabled) {
  background: var(--ac-primary-soft);
  color: var(--ac-primary);
}

.ac-tool-skill {
  border-color: var(--ac-line);
  background: var(--ac-surface-raised);
}

.ac-send {
  width: 42px;
  height: 42px;
  border-radius: 15px;
  background: var(--ac-primary);
  box-shadow: 0 10px 22px rgba(0, 87, 255, 0.22);
}

.ac-send:hover:not(:disabled) {
  background: var(--ac-primary-strong);
  transform: translateY(-1px);
}

.ac-cancel {
  background: #202333;
  box-shadow: 0 10px 22px rgba(32, 35, 51, 0.22);
}

.ac-hero-cards {
  gap: 14px;
}

.ac-hero-card {
  position: relative;
  overflow: hidden;
  height: 116px;
  min-height: 116px;
  padding: 20px 20px 18px;
  gap: 13px;
  border: 1px solid var(--ac-line);
  border-radius: 22px;
  background: var(--ac-surface);
  box-shadow: var(--shadow-1);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease;
}

.ac-hero-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto;
  height: 3px;
  background: var(--ac-primary);
  opacity: 0;
  transition: opacity 180ms ease;
}

.ac-hero-card:hover {
  border-color: var(--color-primary-focus);
  box-shadow: 0 18px 36px rgba(0, 87, 255, 0.14);
  transform: translateY(-4px);
}

.ac-hero-card:hover::before {
  opacity: 1;
}

.ac-hero-card-icon {
  width: 38px;
  height: 38px;
  border-radius: 16px;
}

.ac-hero-card-icon.blue {
  background: var(--ac-primary-soft);
  color: var(--ac-primary);
}

.ac-hero-card-icon.orange {
  background: #fff1ed;
  color: var(--ac-coral);
}

.ac-hero-card-icon.purple {
  background: #e8f8f5;
  color: var(--ac-teal);
}

.ac-hero-card-title {
  color: var(--ac-ink);
  font-size: 15px;
  font-weight: 700;
}

.ac-hero-card-desc {
  color: var(--ac-muted);
  font-size: 13.5px;
  line-height: 1.65;
}

@media (max-width: 720px) {
  .ac-header {
    height: 64px;
    padding: 0 16px;
  }

  .ac-body.single {
    align-items: stretch;
    justify-content: flex-start;
    padding: 42px 16px 56px;
  }

  .ac-body.single .ac-chat.hero {
    gap: 24px;
    height: auto;
    max-height: none;
    justify-content: flex-start;
    padding: 0;
  }

  .ac-hero-logo {
    width: 68px;
    height: 68px;
    border-radius: 22px;
  }

  .ac-hero-title {
    max-width: 360px;
    font-size: 30px;
  }

  .ac-hero-subtitle {
    max-width: 320px;
    font-size: 14px;
  }

  .ac-composer-inner {
    min-height: 108px;
  }

  .ac-hero-cards {
    grid-template-columns: 1fr;
  }
}

/* ---------------- Empty-state visual direction ----------------
   Keep the existing creation flow, but give the first screen a lighter
   prompt-first surface: diffuse ambient color, white composer, black CTA. */
.ac-page {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: #f4f5f8;
}

.ac-page::before,
.ac-page::after {
  content: '';
  position: absolute;
  z-index: -1;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.52;
}

.ac-page::before {
  width: min(42vw, 680px);
  height: min(42vw, 680px);
  top: -22%;
  right: -8%;
  background: rgba(184, 170, 255, 0.3);
}

.ac-page::after {
  width: min(36vw, 560px);
  height: min(30vw, 460px);
  left: 12%;
  bottom: -24%;
  background: rgba(126, 214, 241, 0.22);
  box-shadow: 460px -40px 120px rgba(248, 173, 215, 0.16);
}

.ac-header,
.ac-body {
  position: relative;
  z-index: 1;
}

.ac-header {
  background: rgba(255, 255, 255, 0.74);
  border-bottom-color: rgba(224, 227, 235, 0.72);
  backdrop-filter: blur(18px);
}

.ac-body.single {
  background: transparent;
}

.ac-body.single .ac-chat.hero {
  gap: 24px;
}

.ac-hero-top {
  gap: 12px;
}

.ac-hero-logo {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 14px 36px rgba(76, 81, 126, 0.14);
  backdrop-filter: blur(12px);
}

.ac-hero-title {
  font-family: 'Source Han Sans CN', 'Source Han Sans SC', '思源黑体', sans-serif;
  font-size: clamp(30px, 3.2vw, 40px);
  font-weight: 900;
  font-synthesis: none;
  letter-spacing: -0.02em;
  background: none;
  color: #28282e;
  -webkit-text-fill-color: currentColor;
}

.ac-hero-subtitle {
  color: #727987;
}

.ac-chat.hero .ac-composer,
.ac-hero-cards {
  max-width: 900px;
}

.ac-composer-box {
  padding: 1px;
  max-height: none;
  overflow: hidden;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.92);
  box-shadow:
    0 20px 54px rgba(75, 82, 122, 0.13),
    0 0 34px rgba(143, 187, 255, 0.2);
}

.ac-composer-inner {
  min-height: 116px;
  max-height: none;
  overflow: hidden;
  padding: 8px;
  border-radius: 23px;
  background: rgba(255, 255, 255, 0.88);
}

/* Empty-state composer default height. */
.ac-chat.hero .ac-composer-inner {
  display: flex;
  flex-direction: column;
  min-height: 180px;
}

.ac-chat.hero .ac-composer-input {
  flex: 1 1 auto;
  min-height: 0;
}

.ac-chat.hero .ac-composer-bar {
  margin-top: 8px;
}

.ac-attach-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 12px 0;
}

/* 上传附件后，附件区与输入区统一为纯白底，不透出外层渐变。 */
.ac-composer-box.has-attachments,
.ac-composer-box.has-attachments .ac-composer-inner {
  background: #fff;
}
.ac-composer-box.has-attachments .ac-attach-list {
  background: #fff;
}

.ac-attach-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 1 200px;
  width: 200px;
  min-width: 0;
  max-width: 200px;
  height: 56px;
  padding: 8px 30px 8px 10px;
  overflow: hidden;
  border-radius: 14px;
  background: #f5f5f6;
  color: #292b31;
}

.ac-attach-icon {
  display: grid;
  flex: none;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
}

.ac-attach-card.is-markdown .ac-attach-icon {
  color: #4e7ef4;
  border-color: #b9ccff;
}

.ac-attach-card.is-pdf .ac-attach-icon {
  color: #f06e6e;
  border-color: #ffb9b9;
}

.ac-attach-card.is-word .ac-attach-icon {
  color: #4c82dc;
  border-color: #b7cefa;
}

.ac-attach-card.is-excel .ac-attach-icon {
  color: #48a276;
  border-color: #b4e2c8;
}

.ac-attach-card.is-text .ac-attach-icon,
.ac-attach-card.is-default .ac-attach-icon {
  color: #7b8492;
  border-color: #c9ced7;
}

.ac-attach-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.ac-attach-name,
.ac-attach-meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ac-attach-name {
  font-size: 14px;
  line-height: 1.25;
  color: #292b31;
}

.ac-attach-meta {
  font-size: 12px;
  line-height: 1.3;
  color: #a2a3a8;
}

.ac-attach-remove {
  position: absolute;
  top: 7px;
  right: 7px;
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #8d929c;
  cursor: pointer;
  opacity: 0.72;
}

.ac-attach-remove:hover {
  background: #e9eaed;
  color: #343840;
  opacity: 1;
}

@media (max-width: 720px) {
  .ac-attach-card {
    width: min(100%, 200px);
    max-width: 200px;
    height: 56px;
    padding-left: 14px;
  }

  .ac-attach-name {
    font-size: 14px;
  }

  .ac-attach-meta {
    font-size: 12px;
  }
}

.ac-composer-inner:focus-within {
  box-shadow: none;
}

.ac-composer-input {
  min-height: 58px;
  max-height: 200px;
  padding: 8px 8px 0;
  font-size: 14px;
  overflow-y: auto;
}

.ac-composer-input::placeholder {
  color: #969ca8;
}

.ac-tool-btn {
  color: #6f7683;
}

.ac-composer-bar {
  margin-top: 8px;
}

.ac-tool-btn:hover:not(:disabled) {
  background: #f1f2f4;
  color: #181a20;
}

.ac-tool-skill {
  border-color: #e1e3e8;
  background: rgba(255, 255, 255, 0.72);
}

.ac-chat.hero .ac-send {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #111214;
  color: #fff;
  box-shadow: 0 8px 18px rgba(17, 18, 20, 0.2);
}

.ac-chat.hero .ac-send:hover:not(:disabled) {
  background: #2d2f34;
}

.ac-upload-btn.el-button {
  width: 36px;
  height: 36px;
  padding: 0;
  border: none;
  border-radius: 50%;
  color: #6f7683;
}

.ac-upload-btn.el-button:hover:not(:disabled) {
  background: #f1f2f4;
  color: #181a20;
}

.ac-upload-btn.el-button.is-disabled {
  color: #b7bcc5;
}

.ac-hero-cards {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.ac-hero-card {
  min-height: 88px;
  padding: 14px 15px;
  gap: 8px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.56);
  border-color: rgba(255, 255, 255, 0.82);
  box-shadow: 0 8px 22px rgba(75, 82, 122, 0.06);
  backdrop-filter: blur(12px);
}

.ac-hero-card:hover {
  border-color: rgba(17, 18, 20, 0.16);
  box-shadow: 0 14px 28px rgba(75, 82, 122, 0.11);
  transform: translateY(-2px);
}

.ac-hero-card-icon {
  width: 28px;
  height: 28px;
  border-radius: 9px;
}

.ac-hero-card-icon.blue,
.ac-hero-card-icon.orange,
.ac-hero-card-icon.purple {
  background: #f1f2f4;
  color: #30343b;
}

.ac-hero-card-title {
  font-size: 13.5px;
}

.ac-hero-card-desc {
  font-size: 12px;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .ac-page::before {
    width: 420px;
    height: 420px;
    top: -12%;
    right: -28%;
  }

  .ac-page::after {
    width: 360px;
    height: 300px;
    left: -20%;
    bottom: -10%;
  }

  .ac-hero-title {
    max-width: 360px;
  }
}

/* Header stays visually integrated with the ambient canvas. */
.ac-header {
  background: transparent;
  border-bottom: none;
  box-shadow: none;
  backdrop-filter: none;
}

.ac-page {
  background-color: #f5f6f7;
  background-image: url('/ai-create-figma-background.png');
  background-position: top center;
  background-repeat: no-repeat;
  background-size: cover;
}

.ac-header-sub {
  color: #697180;
}

/* Figma node 9872:51137: a soft purple/blue/cyan wash that fades into the page surface. */
.ac-page,
.ac-body.single .ac-chat.hero {
  background-color: transparent;
}

.ac-page::before {
  display: none;
}

.ac-page::after {
  display: none;
}

/* The supplied WebGPU renderer replaces the hero image without changing the page background. */
.ac-hero-logo {
  border: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.ac-hero-logo iframe.ac-fluid-orb {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
  filter: drop-shadow(0 8px 16px rgba(67, 31, 104, 0.16));
  transform: translateY(-4px) scale(1.2);
}

/* 示例卡片：参考原型采用「图标 → 标题 → 说明」的纵向信息层级。 */
.ac-hero-card {
  align-items: flex-start;
  justify-content: flex-start;
  height: 116px;
  min-height: 116px;
  padding: 14px 16px 15px;
  gap: 0;
  border: 1px solid #dfe2e8;
  border-radius: 16px;
  padding-bottom: 0;
  background:
    radial-gradient(
      115% 115% at 84% -10%,
      rgba(220, 169, 248, 0.5) 0%,
      rgba(241, 211, 250, 0.3) 40%,
      rgba(255, 255, 255, 0) 76%
    ),
    linear-gradient(180deg, #fcf9ff 0%, #ffffff 78%);
  box-shadow: none;
  text-align: left;
}

.ac-hero-card-head {
  width: 100%;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  text-align: left;
}

.ac-hero-card-icon,
.ac-hero-card-icon.purple {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  background: linear-gradient(135deg, #f7c0dc 0%, #dc70cd 52%, #a850dc 100%);
  color: #ffffff !important;
  box-shadow: none;
}

.ac-hero-card.blue {
  background:
    radial-gradient(
      115% 115% at 84% -10%,
      rgba(145, 193, 255, 0.48) 0%,
      rgba(215, 235, 255, 0.3) 40%,
      rgba(255, 255, 255, 0) 76%
    ),
    linear-gradient(180deg, #f4f9ff 0%, #ffffff 78%);
}

.ac-hero-card.orange {
  background:
    radial-gradient(
      115% 115% at 84% -10%,
      rgba(190, 158, 255, 0.5) 0%,
      rgba(232, 220, 255, 0.32) 40%,
      rgba(255, 255, 255, 0) 76%
    ),
    linear-gradient(180deg, #faf7ff 0%, #ffffff 78%);
}

.ac-hero-card-icon.blue {
  background: linear-gradient(135deg, #d2e8ff 0%, #77aff5 52%, #4f73df 100%);
  color: #ffffff !important;
  box-shadow: none;
}

.ac-hero-card-icon.orange {
  background: linear-gradient(135deg, #e5ceff 0%, #aa72e5 52%, #7f55d5 100%);
  color: #ffffff !important;
  box-shadow: none;
}

.ac-hero-card-title {
  display: block;
  width: 100%;
  margin-top: 13px;
  color: #28282e;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  text-align: left;
}

.ac-hero-card-desc {
  display: block;
  width: 100%;
  margin-top: 4px;
  color: #a0a0aa;
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
}

.ac-hero-card:hover {
  border-color: rgba(183, 125, 226, 0.42);
  box-shadow: 0 12px 24px rgba(111, 76, 156, 0.12);
  transform: translateY(-2px);
}

/* Hover accents follow each card's blue, violet, and pink tone. */
.ac-hero-card.blue:hover {
  border-color: rgba(109, 169, 247, 0.62);
  box-shadow:
    0 12px 24px rgba(70, 116, 232, 0.16),
    0 0 0 1px rgba(145, 193, 255, 0.24);
}

.ac-hero-card.orange:hover {
  border-color: rgba(166, 109, 233, 0.58);
  box-shadow:
    0 12px 24px rgba(128, 80, 220, 0.16),
    0 0 0 1px rgba(190, 158, 255, 0.24);
}

.ac-hero-card.purple:hover {
  border-color: rgba(216, 102, 209, 0.56);
  box-shadow:
    0 12px 24px rgba(185, 82, 210, 0.15),
    0 0 0 1px rgba(242, 164, 201, 0.24);
}

.ac-hero-title-gradient {
  background: linear-gradient(100deg, #6d5be7 0%, #9859e7 46%, #e979bd 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}

.ac-hero-card::before {
  display: none;
}

/* 发送按钮保持静止，不使用投影。 */
.ac-send:not(.ac-cancel),
.ac-chat.hero .ac-send {
  box-shadow: none;
  transform: none;
}

.ac-send:not(.ac-cancel):hover:not(:disabled),
.ac-chat.hero .ac-send:hover:not(:disabled) {
  box-shadow: none;
  transform: none;
}

/* Hero hierarchy: title, subtitle, and examples form one block above the composer. */
.ac-chat.hero {
  gap: 64px;
}
.ac-body.single .ac-chat.hero {
  gap: 64px;
}
.ac-chat.hero .ac-hero-group {
  order: 1;
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
}
.ac-chat.hero .ac-composer {
  order: 2;
}
.ac-hero-group .ac-hero-cards {
  width: 900px;
  max-width: 100%;
}

@media (max-width: 720px) {
  .ac-chat.hero {
    gap: 40px;
  }
  .ac-chat.hero .ac-hero-group {
    gap: 22px;
  }
}

/* Default composer surface: neutral border and a soft gray shadow. */
.ac-chat.hero .ac-composer-box {
  border: 1px solid rgba(211, 215, 222, 0.9);
  background: linear-gradient(
    112deg,
    rgba(255, 255, 255, 0.62) 0%,
    rgba(236, 246, 255, 0.58) 52%,
    rgba(249, 240, 255, 0.62) 100%
  );
  box-shadow:
    0 12px 28px rgba(103, 109, 120, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(22px) saturate(130%);
}
.ac-chat.hero .ac-composer-inner {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.74);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px) saturate(125%);
}

/* Conversation stage: flatten the shell and keep the content column at 900px. */
.ac-body.single .ac-chat:not(.hero) {
  width: 900px;
  max-width: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.ac-body.single .ac-chat:not(.hero) .ac-composer {
  border-top: 0;
  background: transparent;
}

/* Restore the stronger three-color glow while the composer is hovered or focused. */
.ac-chat.hero .ac-composer-box:hover,
.ac-chat.hero .ac-composer-box:focus-within {
  box-shadow:
    -14px 25px 72px rgba(222, 190, 246, 0.2),
    0 27px 64px rgba(166, 168, 246, 0.18),
    14px 25px 72px rgba(163, 218, 240, 0.2),
    0 0 0 1px rgba(222, 229, 255, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
}

/* Keep the right preview panel's radius aligned with the left conversation panel. */
.ac-body.two-col .ac-preview {
  border-radius: 24px;
}

/* 顶部返回控件：复用 Element Plus 按钮，尺寸与原型一致。 */
.ac-back.el-button {
  flex: none;
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 9999px;
}

/* 对话态：把消息、状态卡片和输入区组织成持续对话工作区。 */
.ac-body.single .ac-chat:not(.hero) {
  width: 900px;
  max-width: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

.ac-chat:not(.hero) .ac-stream {
  margin: 0;
  padding: 0 0 32px;
  gap: 16px;
  background: transparent;
}

.ac-chat:not(.hero) .ac-row {
  align-items: flex-start;
  gap: 10px;
}

/* 当前轮 AI 回复占满输入区上方的剩余空间，历史消息保持内容高度。 */
.ac-chat:not(.hero) .ac-row.ai.is-latest-ai {
  flex: 1 1 auto;
  min-height: 0;
}
.ac-chat:not(.hero) .ac-row.ai.is-latest-ai > .ac-bubble,
.ac-chat:not(.hero) .ac-row.ai.is-latest-ai > .ac-card {
  align-self: stretch;
}

.ac-chat:not(.hero) .ac-row.ai.is-latest-ai > .ac-card.ask {
  align-self: flex-start;
  height: auto;
  flex: 0 0 auto;
}

.ac-chat:not(.hero) .ac-row.ai > .ac-bubble,
.ac-chat:not(.hero) .ac-row.ai > .ac-card {
  width: 100%;
  max-width: none;
}

.ac-chat:not(.hero) .ac-avatar {
  width: 30px;
  height: 30px;
  margin-top: 2px;
  border-radius: 10px;
  background: linear-gradient(135deg, #7669ea 0%, #bd70d9 100%);
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  box-shadow: 0 5px 12px rgba(118, 105, 234, 0.2);
}

.ac-chat:not(.hero) .ac-row.ai > .ac-bubble {
  padding: 12px 15px;
  border: 1px solid #e7e8f1;
  border-radius: 6px 16px 16px 16px;
  background: #ffffff;
  color: #303544;
  line-height: 1.7;
  box-shadow: 0 3px 10px rgba(47, 54, 86, 0.035);
}

.ac-chat:not(.hero) .ac-row.user > .ac-bubble {
  max-width: min(76%, 680px);
  padding: 12px 15px;
  border: 0;
  border-radius: 16px 16px 0 16px;
  background: #dbeafe;
  color: var(--text-1);
  line-height: 1.7;
}

.ac-chat:not(.hero) .ac-card {
  padding: 16px 18px;
  border: 1px solid #e5e7ef;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(47, 54, 86, 0.045);
}

.ac-chat:not(.hero) .ac-card.skill {
  border-color: #dfdcff;
  background: linear-gradient(135deg, #fbfaff 0%, #f4f2ff 100%);
}

.ac-chat:not(.hero) .ac-card.ask {
  border-color: #f0dfc5;
  background: #fffdf9;
}

.ac-chat:not(.hero) .ac-card-head .ac-fold {
  margin-left: auto;
}

.ac-typing-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ac-typing-bubble {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid #e7e8f1;
  border-radius: 6px 14px 14px 14px;
  background: #ffffff;
  color: var(--text-1);
  font-size: 12px;
  box-shadow: 0 3px 10px rgba(47, 54, 86, 0.035);
}

.ac-typing-bubble span {
  margin-right: 2px;
}

.ac-typing-bubble i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-1);
  animation: ac-typing-bounce 1.1s ease-in-out infinite;
}

.ac-typing-bubble i:nth-of-type(2) {
  animation-delay: 0.14s;
}

.ac-typing-bubble i:nth-of-type(3) {
  animation-delay: 0.28s;
}

@keyframes ac-typing-bounce {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.ac-chat:not(.hero) .ac-composer {
  padding: 12px 20px 18px;
  border-top-color: #e9ebf2;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -8px 20px rgba(47, 54, 86, 0.035);
}

.ac-chat:not(.hero) .ac-composer-box {
  border-radius: 18px;
  background: #dfe3ec;
  box-shadow: 0 5px 16px rgba(47, 54, 86, 0.06);
}

.ac-chat:not(.hero) .ac-composer-inner {
  display: flex;
  flex-direction: column;
  min-height: 180px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.74);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.ac-chat:not(.hero) .ac-composer,
.ac-chat.hero .ac-composer {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.ac-chat:not(.hero) .ac-composer-box {
  padding: 1px;
  border: 1px solid rgba(211, 215, 222, 0.9);
  border-radius: 26px;
  background: linear-gradient(
    112deg,
    rgba(255, 255, 255, 0.62) 0%,
    rgba(236, 246, 255, 0.58) 52%,
    rgba(249, 240, 255, 0.62) 100%
  );
  box-shadow:
    -14px 25px 72px rgba(222, 190, 246, 0.13),
    0 27px 64px rgba(166, 168, 246, 0.11),
    14px 25px 72px rgba(163, 218, 240, 0.13),
    0 0 0 1px rgba(222, 229, 255, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(22px) saturate(130%);
}

.ac-chat:not(.hero) .ac-composer-input {
  flex: 1 1 auto;
  min-height: 0;
}

/* 对话流：普通 AI 回复采用连续文本，只有需要用户回答的问题保留卡片容器。 */
.ac-chat:not(.hero) .ac-row.ai > .ac-bubble {
  width: 100%;
  max-width: none;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  color: #27272a;
  line-height: 1.8;
}

.ac-chat:not(.hero) .ac-card:not(.ask) {
  width: 100%;
  max-width: none;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.ac-chat:not(.hero) .ac-card:not(.ask) .ac-card-head .ok,
.ac-chat:not(.hero) .ac-card:not(.ask) .ac-card-head .warn,
.ac-chat:not(.hero) .ac-card:not(.ask) .ac-card-head .running,
.ac-chat:not(.hero) .ac-card:not(.ask) .ac-card-head .brand {
  color: #71717a;
}

.ac-chat:not(.hero) .ac-card.progress .ac-card-head .ok {
  color: var(--color-status-success);
}

/* 问题卡：HeroUI 风格的中性灰状态，不使用蓝、橙、绿等强调色。 */
.ac-chat:not(.hero) .ac-card.ask {
  width: 100%;
  max-width: none;
  padding: 0;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-lg);
  background: var(--fill-4);
  box-shadow: var(--shadow-2);
  overflow: hidden;
}

.ac-chat:not(.hero) .ac-card.ask :deep(.el-card__body) {
  padding: 16px;
}

.ac-chat:not(.hero) .ac-card.skill {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ac-chat:not(.hero) .ac-card.skill .ac-card-head {
  gap: 8px;
  line-height: 1.4;
}

.ac-chat:not(.hero) .ac-card.skill .ac-card-text {
  margin-top: 0;
}

.ac-chat:not(.hero) .ac-card.ask .ac-card-head {
  min-height: 28px;
  line-height: 1.4;
}

.ac-chat:not(.hero) .ac-ask-group-fields {
  display: flex;
  flex-direction: column;
  gap: 22px;
  margin-top: 18px;
}

.ac-chat:not(.hero) .ac-ask-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ac-chat:not(.hero) .ac-ask-item .ac-card-text,
.ac-chat:not(.hero) .ac-ask-item .ac-card-actions,
.ac-chat:not(.hero) .ac-ask-item .ac-checks {
  margin-top: 0;
}

.ac-chat:not(.hero) .ac-card.ask .ac-card-actions .el-button {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 10px;
}

.ac-chat:not(.hero) .ac-card.ask .ac-ask-submit {
  margin-top: 2px;
  padding-top: 16px;
  border-top: 1px solid var(--border-1);
}

.ac-chat:not(.hero) .ac-card.ask .ac-card-head .warn,
.ac-chat:not(.hero) .ac-card.ask .ac-fold,
.ac-chat:not(.hero) .ac-card.ask .ac-fold-icon {
  color: var(--icon-1);
}

.ac-chat:not(.hero) .ac-card.ask .ac-card-text,
.ac-chat:not(.hero) .ac-card.ask .ac-card-note {
  color: var(--text-2);
}

.ac-chat:not(.hero) .ac-card.ask .ac-card-actions .el-button {
  --el-button-text-color: var(--text-2);
  --el-button-bg-color: var(--fill-1);
  --el-button-border-color: var(--border-3);
  --el-button-hover-text-color: var(--text-1);
  --el-button-hover-bg-color: var(--fill-2);
  --el-button-hover-border-color: var(--border-4);
  box-shadow: none;
}

.ac-chat:not(.hero) .ac-card.ask .ac-card-actions .el-button--primary {
  --el-button-text-color: var(--fill-1);
  --el-button-bg-color: var(--brand-1);
  --el-button-border-color: var(--brand-1);
  --el-button-hover-text-color: var(--fill-1);
  --el-button-hover-bg-color: var(--brand-2);
  --el-button-hover-border-color: var(--brand-2);
}

.ac-chat:not(.hero) .ac-card.ask .el-input__wrapper {
  box-shadow: 0 0 0 1px var(--border-3) inset;
  background: var(--fill-1);
}

/* 双栏蓝图区紧贴页面头部，去掉容器顶部的额外留白。 */
.ac-body.two-col {
  padding-top: 0;
}

/* 双栏状态下，左侧对话面板使用与右侧蓝图面板相同的描边色。 */
.ac-body.two-col .ac-chat {
  border-color: var(--border-2);
}

@media (prefers-reduced-motion: reduce) {
  .ac-typing-bubble i {
    animation: none;
  }
}

/* Conversation composer: reuse the AI-create surface and pin it 24px above the viewport bottom. */
.ac-body.single .ac-chat.hero .ac-composer {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 20;
  width: 900px;
  transform: translateX(-50%);
}

/* 单栏对话态保持原布局，不增加额外留白。 */
.ac-body.single .ac-chat:not(.hero) .ac-composer {
  position: fixed;
  left: 50%;
  bottom: 24px;
  z-index: 20;
  width: 900px;
  transform: translateX(-50%);
}

.ac-body.single .ac-chat:not(.hero) .ac-stream {
  padding-bottom: 0;
  margin: 0;
}

/* The hero content keeps its natural rhythm while the fixed composer owns the bottom action area. */
.ac-body.single .ac-chat.hero {
  padding-bottom: 228px;
}

.ac-body.single .ac-chat.hero .ac-hero-group {
  transform: translateY(-48px);
}

.ac-body.single {
  padding-top: 0;
}

.ac-chat.hero .ac-composer-box,
.ac-chat:not(.hero) .ac-composer-box {
  border: 1px solid rgba(211, 215, 222, 0.9);
  border-radius: 24px;
  background: linear-gradient(
    112deg,
    rgba(255, 255, 255, 0.62) 0%,
    rgba(236, 246, 255, 0.58) 52%,
    rgba(249, 240, 255, 0.62) 100%
  );
  box-shadow:
    0 12px 28px rgba(103, 109, 120, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(22px) saturate(130%);
}

/* 蓝图态与单栏对话态沿用既有输入区内边距。 */
.ac-body.two-col.blueprint-open .ac-chat:not(.hero) .ac-composer,
.ac-body.single.conversation-state .ac-chat:not(.hero) .ac-composer {
  margin: 0;
  padding: 0 24px 24px;
}

/* 蓝图页对话流底部只保留滚动内容的 24px 内边距，不产生外部下边距。 */
.ac-body.two-col.blueprint-open .ac-chat:not(.hero) .ac-stream {
  flex: 0 1 auto;
  padding: 0;
  margin: 0;
}

/* 业务搭建态：消息流贴齐底部，输入区使用外边距与面板边缘分隔。 */
.ac-body.two-col.build-open .ac-chat:not(.hero) .ac-composer {
  margin: 0 24px 24px;
  padding: 0;
}

/* 业务搭建态消息内容不保留额外的容器间距。 */
.ac-body.two-col.build-open .ac-chat:not(.hero) .ac-stream {
  margin: 0;
  padding: 0;
}

/* Element Plus 自绘浮层滚动条：原生滚动条被隐藏，内容宽度不随滚动状态变化。 */
.ac-stream.el-scrollbar {
  padding: 0;
  gap: 0;
  overflow: hidden;
}
.ac-stream.el-scrollbar :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}
.ac-stream.el-scrollbar :deep(.el-scrollbar__wrap > .el-scrollbar__view) {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 24px;
  gap: 20px;
  background: transparent;
}
.ac-body.single .ac-stream.el-scrollbar :deep(.el-scrollbar__wrap > .el-scrollbar__view) {
  padding: 24px;
}
/* 单栏对话的内容滚动条贴近浏览器右侧，不受居中消息容器宽度限制。 */
.ac-body.single .ac-stream.el-scrollbar :deep(.el-scrollbar__bar.is-vertical) {
  position: fixed;
  top: calc(var(--builder-header-height, 64px) + 4px);
  right: 4px;
  bottom: 216px;
  width: 6px;
  z-index: 4;
}
.ac-body.two-col.blueprint-open .ac-stream.el-scrollbar :deep(.el-scrollbar__wrap > .el-scrollbar__view) {
  min-height: 0;
  padding: 24px;
}
.ac-body.two-col.build-open .ac-stream.el-scrollbar :deep(.el-scrollbar__wrap > .el-scrollbar__view) {
  padding: 24px;
}
.ac-body.two-col.blueprint-open .ac-stream :deep(.el-scrollbar__bar.is-vertical),
.ac-body.two-col.blueprint-open .ac-pane-blueprint :deep(.el-scrollbar__bar.is-vertical) {
  right: 4px;
  width: 6px;
}
.ac-body.two-col.blueprint-open .ac-stream :deep(.el-scrollbar__thumb),
.ac-body.two-col.blueprint-open .ac-pane-blueprint :deep(.el-scrollbar__thumb) {
  background: rgba(87, 88, 94, 0.35);
}

.ac-chat.hero .ac-composer-inner,
.ac-chat:not(.hero) .ac-composer-inner {
  display: flex;
  flex-direction: column;
  min-height: 180px;
  border-radius: 23px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.74);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(18px) saturate(125%);
}

/* 附件状态下，附件区与输入区之间不透出外层渐变。 */
.ac-chat.hero .ac-composer-box.has-attachments,
.ac-chat:not(.hero) .ac-composer-box.has-attachments,
.ac-chat.hero .ac-composer-box.has-attachments .ac-composer-inner,
.ac-chat:not(.hero) .ac-composer-box.has-attachments .ac-composer-inner {
  background: #ffffff;
  backdrop-filter: none;
}

.ac-chat.hero .ac-composer-input,
.ac-chat:not(.hero) .ac-composer-input {
  flex: 1 1 auto;
  min-height: 0;
}

/* 对话过程的输入框从单行开始，内容增长时由 resizeComposerInput 自动扩展。 */
.ac-chat:not(.hero) .ac-composer-inner {
  min-height: 0;
}
.ac-chat:not(.hero) .ac-composer-input {
  flex: 0 1 auto;
  min-height: calc(1.65em + 32px);
  height: calc(1.65em + 32px);
}

.ac-chat.hero .ac-composer-bar,
.ac-chat:not(.hero) .ac-composer-bar {
  margin-top: 8px;
}

.ac-chat.hero .ac-send,
.ac-chat:not(.hero) .ac-send {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #111214;
  color: #fff;
  box-shadow: none;
}

.ac-chat.hero .ac-upload-btn.el-button,
.ac-chat:not(.hero) .ac-upload-btn.el-button {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  color: var(--text-1);
}

/* 业务分析补充卡：复用 AI 创建页的浅色、低对比度层级。 */
.ac-chat:not(.hero) .ac-card.ask {
  border-color: var(--border-2);
  border-radius: var(--builder-card-radius);
  background: var(--fill-1);
  box-shadow: none;
}

.ac-chat:not(.hero) .ac-card.ask.is-answered {
  background: var(--fill-2);
}

/* Element 折叠面板承载展开状态，视觉沿用 HeroUI 的轻边框与紧凑层级。 */
.ac-chat:not(.hero) .ac-collapse {
  overflow: hidden;
  padding: 0;
  border-top: 0;
  border-bottom: 0;
}

.ac-collapse :deep(.el-collapse-item__header) {
  min-height: 0;
  height: auto;
  padding: 16px;
  border-bottom: 0;
  background: transparent;
  color: inherit;
  line-height: normal;
}

.ac-collapse-icon {
  width: 16px;
  height: 16px;
  font-size: 16px;
  color: var(--icon-1);
  transform: rotate(-90deg);
  transition: transform var(--motion-hover);
}

.ac-collapse.is-open .ac-collapse-icon {
  transform: rotate(0);
}

.ac-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: 0;
  background: transparent;
}

.ac-collapse :deep(.el-collapse-item__content) {
  padding: 0 16px;
  color: inherit;
}
.ac-collapse.is-answered :deep(.el-collapse-item__content) {
  padding-bottom: 16px;
}

.ac-collapse .ac-card-head {
  width: 100%;
}

.ac-chat:not(.hero) .ac-card.ask :deep(.el-card__body) {
  padding: 24px;
}

.ac-chat:not(.hero) .ac-card.ask .ac-card-head {
  align-items: center;
  gap: 8px;
}

.ac-ask-head-icon {
  flex: none;
  width: 20px;
  height: 20px;
  color: var(--brand-1);
}

.ac-ask-heading {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.ac-ask-title {
  color: var(--text-1);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.45;
}

.ac-chat:not(.hero) .ac-card.ask .ac-fold,
.ac-chat:not(.hero) .ac-card.ask .ac-fold-icon {
  margin-top: 0;
  color: var(--icon-1);
}

.ac-chat:not(.hero) .ac-ask-group-fields {
  gap: 0;
  margin-top: 0;
}

.ac-chat:not(.hero) .ac-ask-item {
  position: relative;
  gap: 8px;
  padding: 16px 0;
}

.ac-chat:not(.hero) .ac-ask-item:first-child {
  padding-top: 0;
}

.ac-chat:not(.hero) .ac-ask-item:last-of-type {
  padding-bottom: 0;
}

.ac-chat:not(.hero) .ac-ask-item:not(:last-of-type)::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 30px;
  height: 1px;
  background: var(--border-1);
  content: '';
}

.ac-ask-question-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ac-ask-index {
  flex: none;
  width: 21px;
  color: var(--text-4);
  font-size: 11px;
  font-weight: 600;
  line-height: 1.55;
  text-align: center;
}

.ac-ask-question-title,
.ac-ask-question-help {
  margin: 0;
}

.ac-ask-question-title {
  color: var(--text-1);
  font-size: 14px;
  font-weight: var(--font-weight-bold);
  line-height: 1.55;
}

.ac-ask-question-help {
  margin-top: 3px;
  color: var(--text-4);
  font-size: 12px;
  line-height: 1.5;
}

.ac-ask-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 30px;
}

.ac-ask-radio-group :deep(.el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--border-3) !important;
  border-width: 1px !important;
  outline: none !important;
  border-radius: 8px !important;
  background: var(--fill-1);
  box-shadow: none !important;
  color: var(--text-2);
  font-size: 14px;
}

.ac-ask-radio-group :deep(.el-radio-button:hover .el-radio-button__inner) {
  border-color: var(--brand-4) !important;
  background: var(--brand-8);
  color: var(--brand-1);
}

.ac-ask-radio-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  border-color: var(--brand-1) !important;
  background: var(--brand-7);
  color: var(--brand-2);
}

.ac-ask-radio-group
  :deep(.el-radio-button__original-radio:focus-visible + .el-radio-button__inner) {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-1) 12%, transparent) !important;
}

.ac-ask-check-group {
  gap: 8px 20px;
  padding-left: 30px;
}

.ac-ask-check-group :deep(.el-checkbox) {
  margin-right: 0;
  color: var(--text-2);
}

.ac-ask-check-group :deep(.el-checkbox__label),
.ac-chat:not(.hero) .ac-card.ask .ac-ask-item :deep(.el-input__inner) {
  font-size: 14px;
}

.ac-ask-check-group :deep(.el-checkbox:hover .el-checkbox__inner) {
  border-color: var(--brand-1);
}

.ac-ask-check-group :deep(.el-checkbox:hover .el-checkbox__label) {
  color: var(--brand-1);
}

.ac-ask-check-group :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--brand-1);
  border-color: var(--brand-1);
}

.ac-chat:not(.hero) .ac-card.ask .ac-ask-item :deep(.el-input) {
  margin-left: 30px;
  width: calc(100% - 30px);
}

.ac-chat:not(.hero) .ac-card.ask .ac-ask-item :deep(.el-input__wrapper) {
  min-height: 38px;
  padding: 1px 11px;
  box-shadow: 0 0 0 1px var(--border-3) inset;
  background: var(--fill-1);
  transition:
    background-color 0.16s ease,
    box-shadow 0.16s ease;
}

.ac-chat:not(.hero) .ac-card.ask .ac-ask-item :deep(.el-input__wrapper:hover:not(.is-focus)) {
  box-shadow: 0 0 0 1px var(--color-border-brand) inset;
}

.ac-chat:not(.hero) .ac-card.ask .ac-ask-item :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--brand-1) inset;
}

.ac-chat:not(.hero) .ac-card.ask .ac-ask-submit {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 0;
  padding: 16px 0;
  border-top: 1px solid var(--border-1);
}

.ac-chat:not(.hero) .ac-card.ask .ac-ask-submit .el-button--primary {
  min-width: 116px;
  min-height: 36px;
  border: 0;
  border-radius: 8px;
}

/* 需求接收卡的展开和收起控件始终紧随标题，避免继承通用卡片的右对齐。 */
.ac-chat:not(.hero) .ac-card.intake .ac-fold {
  margin-left: 0;
}

.ac-ask-group-answered {
  display: flex;
  align-items: stretch;
  flex-direction: column;
  margin-top: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.ac-ask-answer-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ac-ask-answer-list li {
  display: grid;
  grid-template-columns: 21px minmax(0, 1fr);
  align-items: center;
  column-gap: 8px;
  row-gap: 0;
}

.ac-ask-answer-index {
  color: var(--text-4);
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  line-height: 1.55;
  text-align: center;
}

.ac-ask-answer-title,
.ac-ask-answer-value {
  margin: 0;
}

.ac-ask-answer-title {
  color: var(--text-1);
  font-size: 14px;
  font-weight: var(--font-weight-bold);
  line-height: 1.55;
}

.ac-ask-answer-value {
  grid-column: 2;
  margin-top: 4px;
  color: var(--text-2);
  font-size: 14px;
  line-height: 1.55;
}

/* 对话阅读层级：正文优先，状态信息收敛，操作只在需要决策时突出。 */
.ac-chat:not(.hero) .ac-stream {
  gap: 20px;
}

.ac-chat:not(.hero) .ac-row {
  gap: 12px;
}

/* 用户的新输入是下一轮对话的起点，与上一轮结果拉开明确间隔。 */
.ac-chat:not(.hero) .ac-row.user:not(:first-child) {
  /* 与消息流的 20px gap 合计为 40px。 */
  margin-top: 20px;
}

/* 同一轮中的连续 AI 消息沿用消息流的 20px 间距。 */
.ac-chat:not(.hero) .ac-row.ai + .ac-row.ai {
  margin-top: 0;
}

.ac-chat:not(.hero) .ac-row.ai > .ac-bubble {
  width: min(100%, 760px);
  max-width: 760px;
  padding: 0;
  color: var(--text-1);
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
}

.ac-chat:not(.hero) .ac-row.ai.is-latest-ai > .ac-bubble {
  align-self: flex-start;
}

/* 收起问题卡仍可能是最新一条 AI 消息，不能被最新消息的撑满规则拉成空白大卡。 */
.ac-chat:not(.hero) .ac-row.ai.is-latest-ai > .ac-card.ask:not(.is-open) {
  align-self: flex-start;
  height: fit-content;
}

/* 提交操作与最后一题用留白分组，不额外增加一条横向描边。 */
.ac-chat:not(.hero) .ac-card.ask .ac-ask-submit {
  border-top: 0;
}

.ac-chat:not(.hero) .ac-row.user > .ac-bubble {
  max-width: min(80%, 680px);
  padding: 10px 14px;
  border-radius: 16px 16px 4px 16px;
  background: var(--brand-7);
  color: var(--text-1);
  font-size: 14px;
  line-height: 1.7;
}

.ac-chat:not(.hero) .ac-card.intake,
.ac-chat:not(.hero) .ac-card.skill {
  width: min(100%, 760px);
  max-width: 760px;
  color: var(--text-2);
}

.ac-chat:not(.hero) .ac-card.intake .ac-card-head,
.ac-chat:not(.hero) .ac-card.skill .ac-card-head {
  color: var(--text-1);
  font-size: 16px;
  font-weight: var(--font-weight-bold);
  line-height: 1.5;
}

.ac-chat:not(.hero) .ac-card.intake .ac-card-text,
.ac-chat:not(.hero) .ac-card.skill .ac-card-text {
  margin-top: 4px;
  color: var(--text-3);
  font-size: 13px;
  line-height: 1.65;
}

.ac-chat:not(.hero) .ac-card.skill {
  gap: 4px;
}

.ac-chat:not(.hero) .ac-card.ask,
.ac-chat:not(.hero) .ac-card.confirm {
  width: min(100%, 760px);
  max-width: 760px;
}

.ac-chat:not(.hero) .ac-card:not(.ask):not(.intake):not(.skill) .ac-card-head {
  color: var(--text-1);
  font-size: 16px;
  font-weight: var(--font-weight-bold);
  line-height: 1.5;
}

/* 蓝图确认卡：标题层级提升，折叠按钮紧随确认状态标签。 */
.ac-chat:not(.hero) .ac-card.confirm .ac-confirm-title {
  font-size: 16px;
}

/* 待确认与已取代沿用同一标签规格，仅以状态语义色区分。 */
.ac-chat:not(.hero) .ac-card.confirm .ac-confirm-status {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  line-height: 20px;
}

.ac-chat:not(.hero) .ac-card.confirm .ac-confirm-status--info {
  --el-tag-text-color: var(--el-color-info);
  --el-tag-bg-color: color-mix(in srgb, var(--el-color-info) 10%, transparent);
  --el-tag-border-color: color-mix(in srgb, var(--el-color-info) 10%, transparent);
}

.ac-chat:not(.hero) .ac-card.confirm .ac-confirm-status--warning {
  --el-tag-text-color: var(--el-color-warning);
  --el-tag-bg-color: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
  --el-tag-border-color: color-mix(in srgb, var(--el-color-warning) 10%, transparent);
}

.ac-chat:not(.hero) .ac-card.confirm .ac-fold {
  margin-left: 0;
}

/* 生成进度与完成卡片的折叠按钮紧跟标题与计数，避免被通用卡片规则推到最右侧。 */
.ac-chat:not(.hero) .ac-card.progress .ac-fold,
.ac-chat:not(.hero) .ac-card.done .ac-fold {
  flex: none;
  margin-left: 0;
}

.ac-chat:not(.hero) .ac-card:not(.ask) .ac-card-text {
  margin-top: 6px;
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.65;
}

/* 需求摘要与 skill 调用说明紧随标题，避免被通用卡片正文间距覆盖。 */
.ac-chat:not(.hero) .ac-card.intake .ac-card-text,
.ac-chat:not(.hero) .ac-card.skill .ac-card-text {
  margin-top: 4px;
}

.ac-chat:not(.hero) .ac-card-facts {
  gap: 8px 14px;
  margin-top: 6px;
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.6;
}

.ac-chat:not(.hero) .ac-blueprint-summary {
  display: block;
}

.ac-chat:not(.hero) .ac-blueprint-feature-count {
  display: inline;
  margin-left: 0;
  color: inherit;
  font-size: inherit;
  white-space: nowrap;
}

.ac-chat:not(.hero) .ac-card-actions {
  gap: 8px;
  margin-top: 16px;
}

.ac-chat:not(.hero) .ac-card-foot {
  margin-top: 10px;
  color: var(--text-3);
  font-size: 12px;
  line-height: 1.6;
}

.ac-chat:not(.hero) .ac-uncertain ul,
.ac-chat:not(.hero) .ac-todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ac-chat:not(.hero) .ac-uncertain ul {
  margin-top: 8px;
}

/* 不确定事项与「已收集的信息」保持同一套卡片密度与阅读层级。 */
.ac-chat:not(.hero) .ac-uncertain {
  margin-top: 10px;
  padding: 16px;
  border: 1px solid var(--warning-7);
  border-radius: var(--radius-lg);
  background: var(--warning-8);
}
.ac-chat:not(.hero) .ac-todo {
  margin-top: 10px;
  padding: 16px 20px;
  border: 1px solid var(--brand-6);
  border-radius: var(--radius-lg);
  background: var(--brand-8);
}
.ac-chat:not(.hero) .ac-uncertain-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-1);
  font-size: 15px;
  font-weight: var(--font-weight-bold);
  line-height: 1.45;
}
.ac-chat:not(.hero) .ac-uncertain-icon,
.ac-chat:not(.hero) .ac-ask-head-icon {
  color: var(--text-1);
}
.ac-chat:not(.hero) .ac-card.done .ac-done-icon {
  color: var(--color-status-success);
}
.ac-chat:not(.hero) .ac-uncertain ul {
  margin: 8px 0 0;
  padding-left: 36px;
  color: var(--text-2);
  font-size: 14px;
  line-height: 1.55;
}

.ac-chat:not(.hero) .ac-todo-list {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.55;
}

.ac-chat:not(.hero) .ac-todo-more {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-3);
}

.ac-chat:not(.hero) .ac-todo-tag {
  --el-tag-bg-color: color-mix(in srgb, var(--el-tag-text-color) 10%, transparent);
  --el-tag-border-color: color-mix(in srgb, var(--el-tag-text-color) 10%, transparent);
  border-radius: var(--radius-full);
}

.ac-chat:not(.hero) .ac-progress {
  gap: 8px;
}

/* 仅清除生成结果表格 body 内部滚动视图继承的消息流内边距。 */
.ac-stream.el-scrollbar :deep(
    .ac-progress-table .el-table__body-wrapper .el-scrollbar__wrap > .el-scrollbar__view
  ) {
  padding: 0 !important;
}

/* 单栏进行中对话：内容视图贴齐左右与顶部，并填满消息区高度。 */
.ac-body.single .ac-chat:not(.hero) .ac-stream.el-scrollbar {
  /* 底部留白归入消息内容层，避免消息流容器产生额外的外部间距。 */
  padding: 0;
  min-height: 0;
}

.ac-body.single .ac-chat:not(.hero) .ac-stream.el-scrollbar :deep(.el-scrollbar__wrap > .el-scrollbar__view) {
  min-height: 100%;
  /* 当前 AI 创建对话流贴齐横向与顶部，仅保留内容的下内边距。 */
  padding: 0 0 24px;
  gap: 20px;
}

/* 单栏进行中对话：外层主体、对话面板和消息流共同撑满可用高度。 */
.ac-body.single.conversation-state {
  align-items: stretch;
  padding-bottom: 0;
  overflow: hidden;
}

.ac-body.single.conversation-state .ac-chat:not(.hero) {
  height: 100%;
  max-height: none;
  min-height: 0;
}

.ac-body.single.conversation-state .ac-chat:not(.hero) .ac-stream.el-scrollbar {
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
}

.ac-body.single.conversation-state .ac-stream.el-scrollbar :deep(.el-scrollbar__wrap) {
  overflow-y: auto;
}

/* 复用单栏页面的滚动条方案：固定在浏览器右侧 4px。 */
.ac-body.single.conversation-state .ac-stream.el-scrollbar :deep(.el-scrollbar__bar.is-vertical) {
  position: fixed;
  top: calc(var(--builder-header-height, 64px) + 4px);
  right: 4px;
  bottom: 216px;
  width: 6px;
  z-index: 4;
}

.ac-body.single.conversation-state .ac-stream.el-scrollbar :deep(.el-scrollbar__thumb) {
  background: var(--text-3);
  opacity: 0.55;
}

/* 输入区参与单栏对话的纵向布局，消息流因此只占据输入区上方的剩余空间。 */
.ac-body.single.conversation-state .ac-chat:not(.hero) .ac-composer {
  position: static;
  left: auto;
  bottom: auto;
  transform: none;
}

/* 蓝图尚未生成时仍是单栏，输入区与对话内容等宽，不保留左右外部间距。 */
.ac-body.single.intake-state .ac-chat:not(.hero) .ac-composer,
.ac-body.single.analysis-state .ac-chat:not(.hero) .ac-composer,
.ac-body.single.blueprint-open .ac-chat:not(.hero) .ac-composer {
  padding-left: 0;
  padding-right: 0;
}

/* 蓝图调整中的处理态同样使用全宽输入区，正常蓝图态不受影响。 */
.ac-body.two-col.blueprint-open.processing-state .ac-chat:not(.hero) .ac-composer {
  padding-left: 0;
  padding-right: 0;
}

@media (max-width: 720px) {
  .ac-body.two-col {
    flex-direction: column;
    gap: 8px;
    padding: 0 8px 8px;
  }

  .ac-body.two-col .ac-chat {
    flex: 0 1 48%;
    width: 100%;
    min-height: 0;
  }

  .ac-body.two-col .ac-preview {
    flex: 1 1 52%;
    width: 100% !important;
    min-height: 0;
  }

  .ac-body.two-col .ac-splitter {
    display: none;
  }
}

@media (max-width: 640px) {
  .ac-chat:not(.hero) .ac-stream {
    gap: 16px;
  }

  .ac-chat:not(.hero) .ac-row {
    gap: 8px;
  }

  .ac-chat:not(.hero) .ac-row.ai > .ac-bubble,
  .ac-chat:not(.hero) .ac-card.intake,
  .ac-chat:not(.hero) .ac-card.skill,
  .ac-chat:not(.hero) .ac-card.ask,
  .ac-chat:not(.hero) .ac-card.confirm {
    width: 100%;
    max-width: none;
  }

  .ac-chat:not(.hero) .ac-row.user > .ac-bubble {
    max-width: calc(100% - 20px);
  }

  .ac-body.single .ac-chat:not(.hero) .ac-composer {
    position: static;
    left: auto;
    bottom: auto;
    z-index: auto;
    width: auto;
    padding: 16px 0 0;
    transform: none;
  }

  .ac-body.single .ac-chat:not(.hero) .ac-stream {
    padding-bottom: 0;
    margin-bottom: 0;
  }

  .ac-chat:not(.hero) .ac-card.ask :deep(.el-card__body) {
    padding: 16px;
  }

  .ac-ask-radio-group,
  .ac-ask-check-group {
    padding-left: 0;
  }

  .ac-chat:not(.hero) .ac-card.ask .ac-ask-item :deep(.el-input) {
    width: 100%;
    margin-left: 0;
  }

  .ac-chat:not(.hero) .ac-card.ask .ac-ask-submit {
    align-items: stretch;
    flex-direction: column;
  }

  .ac-chat:not(.hero) .ac-card.ask .ac-ask-submit .el-button--primary {
    width: 100%;
  }
}
</style>
