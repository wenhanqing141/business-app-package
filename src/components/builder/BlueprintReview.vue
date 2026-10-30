<template>
  <div ref="reviewRoot" class="blueprint-review" @click="closeComment">
    <template v-for="(block, index) in blocks" :key="index">
      <section
        class="review-module"
        :class="{ 'is-selected': selectedIndex === index }"
        tabindex="0"
        @click.stop="selectModule(index, $event)"
        @keydown.enter.prevent="selectModule(index)"
        @keydown.space.prevent="selectModule(index)"
      >
        <component :is="`h${block.level}`" v-if="block.type === 'heading'" class="review-heading">
          <MdInline :parts="block.inline" />
        </component>

        <pre v-else-if="block.type === 'code'" class="review-code">{{ block.text }}</pre>

        <blockquote v-else-if="block.type === 'quote'" class="review-quote">
          <p v-for="(line, lineIndex) in block.lines" :key="lineIndex">
            <MdInline :parts="line" />
          </p>
        </blockquote>

        <div v-else-if="block.type === 'table'" class="review-table-wrap">
          <table class="review-table">
            <thead>
              <tr>
                <th v-for="(cell, cellIndex) in block.head" :key="cellIndex">
                  <MdInline :parts="cell" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in block.rows" :key="rowIndex">
                <td v-for="(cell, cellIndex) in row" :key="cellIndex">
                  <MdInline :parts="cell" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul v-else-if="block.type === 'list' && !block.ordered" class="review-list">
          <li v-for="(item, itemIndex) in block.items" :key="itemIndex"><MdInline :parts="item" /></li>
        </ul>

        <ol v-else-if="block.type === 'list'" class="review-list">
          <li v-for="(item, itemIndex) in block.items" :key="itemIndex"><MdInline :parts="item" /></li>
        </ol>

        <hr v-else-if="block.type === 'hr'" class="review-hr" />

        <p v-else class="review-para"><MdInline :parts="block.inline" /></p>

        <div
          v-if="selectedIndex === index"
          class="review-comment"
          :style="{
            left: `${commentPosition.left}px`,
            top: `${commentPosition.top}px`,
            width: `${commentPosition.width}px`
          }"
          @click.stop
        >
          <el-input
            ref="commentInputRef"
            v-model="commentDraft"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 6 }"
            class="review-comment-input"
            placeholder="请输入修改意见"
            @keydown.enter.exact.prevent="submitComment"
            @keyup.esc.stop="closeComment"
          />
          <el-button
            class="review-comment-submit"
            type="primary"
            circle
            :disabled="!commentDraft.trim()"
            aria-label="提交蓝图评论"
            @click="submitComment"
          >
            <RiCheckLine class="review-comment-submit-icon" size="24px" />
          </el-button>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RiCheckLine } from '@remixicon/vue'
import { parseBlocks } from '@/utils/markdown'

const props = defineProps({
  content: { type: String, default: '' }
})

const emit = defineEmits(['comment'])
const blocks = computed(() => parseBlocks(props.content))
const selectedIndex = ref(null)
const commentDraft = ref('')
const commentInputRef = ref(null)
const reviewRoot = ref(null)
const commentPosition = ref({ left: 8, top: 8, width: 320 })

function inlineText(parts = []) {
  return parts.map((part) => part.text).join('')
}

function moduleLabel(block) {
  if (block.type === 'heading' || block.type === 'paragraph') return inlineText(block.inline)
  if (block.type === 'table') return inlineText(block.head?.[0]) || '表格'
  if (block.type === 'list') return inlineText(block.items?.[0]) || '列表'
  if (block.type === 'quote') return inlineText(block.lines?.[0]) || '说明'
  if (block.type === 'code') return '业务流程图'
  return '蓝图模块'
}

function selectModule(index, event) {
  selectedIndex.value = index
  commentDraft.value = ''

  const module = event?.currentTarget?.closest?.('.review-module')
  const rect = module?.getBoundingClientRect?.()
  if (rect && event?.clientX != null && event?.clientY != null) {
    const width = Math.min(440, Math.max(260, rect.width - 16))
    const left = Math.min(
      Math.max(event.clientX - rect.left + 8, 8),
      Math.max(8, rect.width - width - 8)
    )
    const top = Math.max(8, event.clientY - rect.top + 8)
    commentPosition.value = { left, top, width }
  } else {
    commentPosition.value = { left: 8, top: 8, width: Math.min(440, Math.max(260, rect?.width - 16 || 320)) }
  }

  nextTick(() => {
    const input = Array.isArray(commentInputRef.value)
      ? commentInputRef.value.at(-1)
      : commentInputRef.value
    input?.focus?.()
  })
}

function closeComment() {
  selectedIndex.value = null
  commentDraft.value = ''
}

function handleDocumentPointerdown(event) {
  if (selectedIndex.value !== null && !reviewRoot.value?.contains(event.target)) {
    closeComment()
  }
}

function submitComment() {
  const text = commentDraft.value.trim()
  const block = blocks.value[selectedIndex.value]
  if (!text || !block) return
  emit('comment', { section: moduleLabel(block), text })
  closeComment()
}

const MdInline = (props) =>
  props.parts.map((part, index) =>
    part.bold ? h('strong', { key: index }, part.text) : part.text
  )
MdInline.props = { parts: { type: Array, default: () => [] } }

onMounted(() => document.addEventListener('pointerdown', handleDocumentPointerdown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', handleDocumentPointerdown))
</script>

<style scoped>
.blueprint-review {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-2);
  word-break: break-word;
}
.review-module {
  position: relative;
  outline: 1px solid transparent;
  outline-offset: 4px;
  border-radius: var(--radius-sm);
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath fill='%234075ff' d='M7.29117 20.8242L2 22L3.17581 16.7088C2.42544 15.3056 2 13.7025 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C10.2975 22 8.6944 21.5746 7.29117 20.8242ZM7.58075 18.711L8.23428 19.0605C9.38248 19.6745 10.6655 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4C7.58172 4 4 7.58172 4 12C4 13.3345 4.32549 14.6175 4.93949 15.7657L5.28896 16.4192L4.63416 19.3658L7.58075 18.711Z'/%3E%3C/svg%3E") 3 3, pointer;
  transition: outline-color var(--motion-hover);
}
.review-module:hover,
.review-module:focus-visible,
.review-module.is-selected {
  outline-color: var(--color-border-brand);
}
.review-module:focus-visible {
  outline-width: 2px;
  outline-offset: 3px;
}
.review-module.is-selected {
  z-index: 1;
}
.review-comment {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  min-height: 48px;
  padding: 6px 8px 6px 14px;
  border: 1px solid var(--border-2);
  border-radius: 16px;
  background: var(--fill-1);
  box-shadow: var(--shadow-2);
  cursor: default;
}
.review-comment-input {
  flex: 1;
  min-width: 0;
  cursor: text;
}
.review-comment-input :deep(.el-textarea__inner) {
  min-height: 36px;
  padding: 7px 0;
  border: 0;
  border-radius: 16px;
  background: transparent;
  color: var(--text-1);
  line-height: 22px;
  resize: none;
  box-shadow: none !important;
  cursor: text;
}
.review-comment-input :deep(.el-textarea__inner:focus) {
  box-shadow: none !important;
}
.review-comment-input :deep(.el-input__wrapper) {
  padding: 0;
  background: transparent;
  box-shadow: none !important;
}
.review-comment-input :deep(.el-textarea__inner::placeholder) {
  color: var(--text-3);
}
.review-comment-submit {
  flex: 0 0 auto;
  width: 36px;
  min-width: 36px;
  height: 36px;
  margin-left: 8px;
  padding: 0;
  --el-button-bg-color: var(--color-primary);
  --el-button-border-color: transparent;
  --el-button-hover-bg-color: var(--color-primary-hover);
  --el-button-hover-border-color: transparent;
  border: 0 !important;
  box-shadow: none !important;
  cursor: pointer;
}
.review-comment-submit-icon {
  display: block;
  width: 24px;
  height: 24px;
}
.review-heading {
  margin: 0;
  font-weight: var(--font-weight-bold);
  color: var(--text-1);
  line-height: 1.4;
}
h1.review-heading {
  margin: 0 0 var(--spacing-xl);
  font-size: 24px;
}
h2.review-heading {
  margin-top: var(--spacing-2xl);
  margin-bottom: var(--spacing-md);
  font-size: 20px;
}
h3.review-heading {
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-sm);
  font-size: 16px;
}
h4.review-heading,
h5.review-heading,
h6.review-heading {
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-xs);
  font-size: 13px;
  color: var(--text-2);
}
.review-para {
  margin: var(--spacing-sm) 0 var(--spacing-md);
}
.review-list {
  margin: var(--spacing-sm) 0 var(--spacing-lg);
  padding-left: 20px;
}
.review-list li {
  margin: var(--spacing-xs) 0;
}
.review-hr {
  display: none;
}
.review-quote {
  margin: var(--spacing-xl) 0;
  padding: var(--spacing-md) var(--spacing-lg);
  border-left: 3px solid var(--brand-6);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  background: var(--fill-4);
  color: var(--text-2);
}
.review-quote p {
  margin: var(--spacing-xs) 0;
}
.review-table-wrap {
  margin: var(--spacing-md) 0 var(--spacing-xl);
  overflow-x: auto;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  background: var(--fill-1);
}
.review-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}
.review-table th,
.review-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 0;
  border-bottom: 1px solid var(--border-1);
  text-align: left;
  vertical-align: top;
  line-height: 1.65;
}
.review-table th {
  background: var(--fill-2);
  color: var(--text-1);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}
.review-table tr:last-child td {
  border-bottom: 0;
}
.review-code {
  margin: var(--spacing-lg) 0 var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  overflow-x: auto;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  background: var(--fill-4);
  color: var(--text-2);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre;
}
</style>
