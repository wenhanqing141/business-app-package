/**
 * 搭建工作台左栏菜单树的缩进（设计稿实测，页面1 画板）
 *
 * 设计稿各层级「行内文字」左边缘相对画板：一级 64、二级 80、三级 100、四级 120、五级 140，
 * 即第 1→2 级递进 16px、之后每级递进 20px；分组行与其组内应用行的文字左边缘对齐。
 *
 * 行本身左边缘固定在 16px（左栏 240px、树区左右各留 16px、行宽 208px），
 * 故「文字左边缘 - 16」即为该层级的额外缩进。
 */

/** 层级额外缩进：level 0 = 顶级分组 / 未分组应用 */
export function indentExtra(level) {
  const lv = Math.max(0, Number(level) || 0)
  return lv === 0 ? 0 : 16 + (lv - 1) * 20
}

/**
 * 分组展开箭头的层级缩进。
 * Element Plus 的箭头在标题插槽之前渲染；分组行自身从箭头之后开始，
 * 因此让箭头承担缩进可同时保持文件夹和文字的既有对齐关系。
 */
export function groupRowPadding(level) {
  return indentExtra(level)
}

/**
 * 应用行内容左内边距（应用行没有展开箭头）。
 * 应用菜单项补偿分组行的展开箭头占位，使应用图标与所属分组的文件夹图标左边缘对齐。
 */
export function appRowPadding(level) {
  return groupRowPadding(level) + 30
}
