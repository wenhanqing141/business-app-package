<template>
  <div class="md-doc">
    <template v-for="(b, i) in blocks" :key="i">
      <component :is="`h${b.level}`" v-if="b.type === 'heading'" class="md-heading">
        <MdInline :parts="b.inline" />
      </component>

      <pre v-else-if="b.type === 'code'" class="md-code">{{ b.text }}</pre>

      <blockquote v-else-if="b.type === 'quote'" class="md-quote">
        <p v-for="(line, li) in b.lines" :key="li"><MdInline :parts="line" /></p>
      </blockquote>

      <div v-else-if="b.type === 'table'" class="md-table-wrap">
        <table class="md-table">
          <thead>
            <tr>
              <th v-for="(cell, ci) in b.head" :key="ci"><MdInline :parts="cell" /></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in b.rows" :key="ri">
              <td v-for="(cell, ci) in row" :key="ci"><MdInline :parts="cell" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      <ul v-else-if="b.type === 'list' && !b.ordered" class="md-list">
        <li v-for="(item, ii) in b.items" :key="ii"><MdInline :parts="item" /></li>
      </ul>

      <ol v-else-if="b.type === 'list'" class="md-list">
        <li v-for="(item, ii) in b.items" :key="ii"><MdInline :parts="item" /></li>
      </ol>

      <hr v-else-if="b.type === 'hr'" class="md-hr" />

      <p v-else class="md-para"><MdInline :parts="b.inline" /></p>
    </template>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { parseBlocks } from '@/utils/markdown'

const props = defineProps({
  content: { type: String, default: '' }
})

const blocks = computed(() => parseBlocks(props.content))

/**
 * 行内片段渲染：**加粗** → <strong>。
 * 用函数式组件返回 vnode 数组（fragment），避免为一段行内文本再包一层元素。
 * 全程不使用 v-html——MD 内容一律以文本插值渲染。
 */
const MdInline = (p) =>
  p.parts.map((t, i) => (t.bold ? h('strong', { key: i }, t.text) : t.text))
MdInline.props = { parts: { type: Array, default: () => [] } }
</script>

<style scoped>
.md-doc {
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-2);
  word-break: break-word;
}

.md-heading {
  margin: 0;
  font-weight: var(--font-weight-bold);
  color: var(--text-1);
  line-height: 1.4;
}
h1.md-heading {
  margin: 0 0 var(--spacing-xl);
  font-size: 24px;
  color: var(--text-1);
  letter-spacing: 0;
}
h2.md-heading {
  margin-top: var(--spacing-2xl);
  margin-bottom: var(--spacing-md);
  font-size: 20px;
  color: var(--text-1);
}
h3.md-heading {
  margin-top: var(--spacing-xl);
  margin-bottom: var(--spacing-sm);
  font-size: 16px;
  color: var(--text-1);
}
h4.md-heading,
h5.md-heading,
h6.md-heading {
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-xs);
  font-size: 13px;
  color: var(--text-2);
}

.md-para {
  margin: var(--spacing-sm) 0 var(--spacing-md);
}

.md-list {
  margin: var(--spacing-sm) 0 var(--spacing-lg);
  padding-left: 20px;
}
.md-list li {
  margin: var(--spacing-xs) 0;
}

.md-hr {
  display: none;
}

.md-quote {
  margin: var(--spacing-xl) 0;
  padding: var(--spacing-md) var(--spacing-lg);
  border-left: 3px solid var(--brand-6);
  background: var(--fill-4);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  color: var(--text-2);
}
.md-quote p {
  margin: var(--spacing-xs) 0;
}

/* 表格：横向可滚，避免窄栏时撑破右栏 */
.md-table-wrap {
  margin: var(--spacing-md) 0 var(--spacing-xl);
  overflow-x: auto;
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  background: var(--fill-1);
}
.md-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}
.md-table th,
.md-table td {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 0;
  border-bottom: 1px solid var(--border-1);
  text-align: left;
  vertical-align: top;
  line-height: 1.65;
}
.md-table th {
  background: var(--fill-2);
  color: var(--text-1);
  font-weight: var(--font-weight-bold);
  white-space: nowrap;
}
.md-table tr:last-child td {
  border-bottom: 0;
}

/* ASCII 内嵌图：等宽字体 + 原样换行，横向可滚 */
.md-code {
  margin: var(--spacing-lg) 0 var(--spacing-xl);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--fill-4);
  border: 1px solid var(--border-2);
  border-radius: var(--radius-md);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre;
  overflow-x: auto;
  color: var(--text-2);
}
</style>
