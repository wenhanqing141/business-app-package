/**
 * 搭建编辑页左侧树的缩进。
 *
 * 顶级分组标题有 8px 起始内边距；每层分组箭头占 14px，箭头与内容之间留 8px。
 * 子分组的箭头须和同一容器内的应用图标左对齐，分组图标再顺延一个箭头占位。
 */
const ROOT_TITLE_PADDING = 8
const GROUP_ARROW_WIDTH = 14
const GROUP_ARROW_GAP = 8
const GROUP_ARROW_SLOT = GROUP_ARROW_WIDTH + GROUP_ARROW_GAP
const ROOT_CONTENT_START = ROOT_TITLE_PADDING + GROUP_ARROW_SLOT

/** 分组展开箭头的左侧偏移，level 0 由标题的 8px 内边距承担。 */
export function builderGroupArrowIndent(level) {
  const lv = Math.max(0, Number(level) || 0)
  return lv === 0 ? 0 : ROOT_CONTENT_START + (lv - 1) * GROUP_ARROW_SLOT
}

/** 应用图标与所属分组图标左对齐。 */
export function builderAppRowPadding(level) {
  const lv = Math.max(0, Number(level) || 0)
  return lv === 0 ? ROOT_CONTENT_START : builderGroupArrowIndent(lv) + GROUP_ARROW_SLOT
}
