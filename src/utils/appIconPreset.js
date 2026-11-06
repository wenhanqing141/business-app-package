import { ENGINE_MAP } from '../mock/pkgSeed.js'
import { APP_ICON_PRESETS } from '../components/icons/appIconPresets.js'

export function getAppIconPreset(app = {}) {
  const saved = APP_ICON_PRESETS.find((preset) => preset.id === app.iconPresetId)
  if (saved) return saved

  // A menu override is what users currently see, even if its engine differs.
  const menuIcon = app.menuIcon || ENGINE_MAP[app.engine]?.design
  const semantic = menuIcon && APP_ICON_PRESETS.find((preset) => preset.menuIcon === menuIcon)
  if (semantic) return semantic

  return APP_ICON_PRESETS.find((preset) => app.engine && preset.engine === app.engine) || APP_ICON_PRESETS[0]
}
