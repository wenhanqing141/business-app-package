import { test } from 'node:test'
import assert from 'node:assert/strict'
import { APP_ICON_PRESETS } from '../src/components/icons/appIconPresets.js'
import { getAppIconPreset } from '../src/utils/appIconPreset.js'
import { RiFileList3Line, RiPieChartLine, RiFileSearchLine, RiFileExcelLine, RiFileTextLine } from '@remixicon/vue'

test('the picker keeps 52 distinct slots and does not offer a folder', () => {
  assert.equal(APP_ICON_PRESETS.length, 52)
  assert.equal(new Set(APP_ICON_PRESETS.map(p => p.id)).size, 52)
  assert.ok(APP_ICON_PRESETS.every(p => p.id !== 'ic-folder' && p.label !== '文件夹'))
})

test('default engine glyphs match the existing navigation glyphs', () => {
  for (const [engine, component] of [['form', RiFileList3Line], ['chart', RiPieChartLine], ['query', RiFileSearchLine], ['report', RiFileExcelLine], ['paper', RiFileTextLine]]) {
    assert.equal(getAppIconPreset({ engine }).icon, component, engine)
  }
  assert.equal(getAppIconPreset({ engine: 'approval' }).design, '审批')
  assert.equal(getAppIconPreset({ engine: 'approval-helper' }).id, 'ic-headset')
})

test('each menu override takes priority over an unrelated engine default', () => {
  for (const [menuIcon, id] of [['审批', 'ic-approval'], ['仪表盘', 'ic-dashboard'], ['信息查询', 'ic-query'], ['报表', 'ic-excel'], ['报告', 'ic-files']]) {
    assert.equal(getAppIconPreset({ engine: 'form', menuIcon }).id, id)
  }
})

test('saved custom icons are also the icons used when reopening the picker', () => {
  assert.equal(getAppIconPreset({ engine: 'form', menuIcon: '审批', iconPresetId: 'ic-briefcase' }).id, 'ic-briefcase')
})

test('unavailable saved icons fall back to the visible menu semantic', () => {
  assert.equal(getAppIconPreset({ engine: 'chart', menuIcon: '报表', iconPresetId: 'ic-folder' }).id, 'ic-excel')
  assert.equal(getAppIconPreset({ engine: 'form', iconPresetId: 'missing' }).id, 'ic-form')
})

test('the catalogue also includes backend navigation glyphs', () => {
  for (const menuIcon of ['应用后台', 'info', '权限设置', '聚合表', '应用关联图谱', '数据工厂']) {
    assert.ok(APP_ICON_PRESETS.some(p => p.menuIcon === menuIcon), menuIcon)
  }
})
