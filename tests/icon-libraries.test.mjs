import { test } from 'node:test'
import assert from 'node:assert/strict'
import { APP_ICON_PRESETS } from '../src/components/icons/appIconPresets.js'
import { PACKAGE_ICON_PRESETS } from '../src/components/icons/packageIconPresets.js'
import { getAppIconPreset } from '../src/utils/appIconPreset.js'
import { RiFileTextFill, RiFileExcel2Fill, RiFolderFill, RiRocket2Fill, RiFileTextLine, RiFileExcelLine } from '@remixicon/vue'

test('package icons keep the original filled glyphs and package-only folder', () => {
  assert.equal(PACKAGE_ICON_PRESETS.length, 52)
  assert.equal(PACKAGE_ICON_PRESETS.find(p => p.id === 'ic-files').icon, RiFileTextFill)
  assert.equal(PACKAGE_ICON_PRESETS.find(p => p.id === 'ic-excel').icon, RiFileExcel2Fill)
  assert.equal(PACKAGE_ICON_PRESETS.find(p => p.id === 'ic-folder').icon, RiFolderFill)
  assert.equal(PACKAGE_ICON_PRESETS.find(p => p.id === 'ic-rocket').icon, RiRocket2Fill)
  assert.ok(!APP_ICON_PRESETS.some(p => p.id === 'ic-folder'))
})

test('identical saved IDs resolve within their own catalogue', () => {
  assert.equal(getAppIconPreset({ iconPresetId: 'ic-files' }).icon, RiFileTextLine)
  assert.equal(getAppIconPreset({ iconPresetId: 'ic-excel' }).icon, RiFileExcelLine)
  assert.notEqual(getAppIconPreset({ iconPresetId: 'ic-files' }).icon, PACKAGE_ICON_PRESETS.find(p => p.id === 'ic-files').icon)
})

test('catalogue entries do not share mutable icon metadata', () => {
  assert.notEqual(APP_ICON_PRESETS, PACKAGE_ICON_PRESETS)
  for (const appIcon of APP_ICON_PRESETS) {
    const packageIcon = PACKAGE_ICON_PRESETS.find(p => p.id === appIcon.id)
    if (packageIcon) assert.notEqual(appIcon, packageIcon)
  }
})
