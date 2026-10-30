// 轻量 Markdown 解析（只覆盖本项目所需子集）
//
// 用途：AI 创建对话页右栏「蓝图」Tab 渲染蓝图 MD。
// 之所以自写而不引 marked / markdown-it：本页只需要渲染一份自产的固定结构文档
// （标题 / 表格 / 围栏代码块里的 ASCII 图 / 引用 / 分隔线 / 列表 / 段落 + 行内加粗），
// 且同一份 MD 字符串还要供「下载文档」直接落盘——保持单一真源，避免渲染与下载两处漂移。
//
// 输出结构（blocks 数组）：
//   { type: 'heading', level: 1..6, inline: Part[] }
//   { type: 'code', lang: string, text: string }
//   { type: 'table', head: Part[][], rows: Part[][][] }
//   { type: 'quote', lines: Part[][] }
//   { type: 'hr' }
//   { type: 'list', ordered: boolean, items: Part[][] }
//   { type: 'paragraph', inline: Part[] }
// Part：{ text: string, bold: boolean }

const RE_FENCE = /^\s*```/
const RE_HEADING = /^(#{1,6})\s+(.*)$/
const RE_HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/
const RE_QUOTE = /^\s*>\s?/
const RE_LIST = /^\s*(?:([-*+])|(\d+)\.)\s+(.*)$/
// 表格分隔行：| --- | :--: | 之类；首尾管道可省，横线数量不限
const RE_TABLE_SEP = /^\s*\|?\s*:?-{1,}:?\s*(?:\|\s*:?-{1,}:?\s*)*\|?\s*$/

/** 行内解析：只处理 **加粗**（本项目的 MD 由我们自己产出，不做转义与嵌套） */
export function parseInline(text = '') {
  return String(text)
    .split(/(\*\*[^*]+\*\*)/)
    .filter((t) => t !== '')
    .map((t) =>
      t.startsWith('**') && t.endsWith('**') && t.length > 4
        ? { text: t.slice(2, -2), bold: true }
        : { text: t, bold: false }
    )
}

/** 把一行表格拆成单元格（首尾管道可省；不做 \| 转义支持） */
function splitRow(line = '') {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((s) => s.trim())
}

const isEmpty = (line) => line == null || line.trim() === ''

/** 块级解析：按固定优先级判定，围栏代码块必须最先——否则 ASCII 图里的 | 会被表格规则吃掉 */
export function parseBlocks(md = '') {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 1) 围栏代码块（ASCII 图）
    if (RE_FENCE.test(line)) {
      const lang = line.trim().replace(/^```/, '').trim()
      const body = []
      i++
      while (i < lines.length && !RE_FENCE.test(lines[i])) {
        body.push(lines[i])
        i++
      }
      i++ // 跳过收尾围栏（未闭合时 i 越界，循环自然结束）
      blocks.push({ type: 'code', lang, text: body.join('\n') })
      continue
    }

    // 2) 标题
    const h = line.match(RE_HEADING)
    if (h) {
      blocks.push({ type: 'heading', level: h[1].length, inline: parseInline(h[2].trim()) })
      i++
      continue
    }

    // 3) 分隔线
    if (RE_HR.test(line)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // 4) 引用（连续多行合并为一个块、逐行渲染）
    if (RE_QUOTE.test(line)) {
      const parts = []
      while (i < lines.length && RE_QUOTE.test(lines[i])) {
        parts.push(parseInline(lines[i].replace(RE_QUOTE, '').trim()))
        i++
      }
      blocks.push({ type: 'quote', lines: parts })
      continue
    }

    // 5) 表格（本行含 | 且下一行是分隔行）
    if (line.includes('|') && RE_TABLE_SEP.test(lines[i + 1] || '')) {
      const head = splitRow(line).map(parseInline)
      i += 2 // 跳过表头与分隔行
      const rows = []
      while (i < lines.length && lines[i].includes('|') && !isEmpty(lines[i])) {
        rows.push(splitRow(lines[i]).map(parseInline))
        i++
      }
      blocks.push({ type: 'table', head, rows })
      continue
    }

    // 6) 列表
    const li = line.match(RE_LIST)
    if (li) {
      const ordered = !!li[2]
      const items = []
      while (i < lines.length) {
        const m = lines[i].match(RE_LIST)
        if (!m) break
        items.push(parseInline(m[3].trim()))
        i++
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    // 7) 空行
    if (isEmpty(line)) {
      i++
      continue
    }

    // 8) 段落：连续的普通行合并（本项目 MD 为中文单行段落，跨行拼接不加空格）
    const para = []
    while (
      i < lines.length &&
      !isEmpty(lines[i]) &&
      !RE_FENCE.test(lines[i]) &&
      !RE_HEADING.test(lines[i]) &&
      !RE_HR.test(lines[i]) &&
      !RE_QUOTE.test(lines[i]) &&
      !RE_LIST.test(lines[i]) &&
      !(lines[i].includes('|') && RE_TABLE_SEP.test(lines[i + 1] || ''))
    ) {
      para.push(lines[i].trim())
      i++
    }
    blocks.push({ type: 'paragraph', inline: parseInline(para.join('')) })
  }

  return blocks
}
