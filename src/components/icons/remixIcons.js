import {
  RiAddLine,
  RiAlertLine,
  RiAppsLine,
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiBarChart2Line,
  RiCheckboxCircleLine,
  RiCheckLine,
  RiCloseLine,
  RiCloudLine,
  RiDatabase2Line,
  RiExchangeLine,
  RiExternalLinkLine,
  RiFile3Line,
  RiFileChartLine,
  RiFileCopyLine,
  RiFileList3Line,
  RiFileTextLine,
  RiFileUploadLine,
  RiFlagLine,
  RiHeadphoneLine,
  RiHomeLine,
  RiLayoutLeftLine,
  RiLayoutRightLine,
  RiLogoutBoxRLine,
  RiMenuLine,
  RiMoreLine,
  RiPieChartLine,
  RiSearchLine,
  RiSettings3Line,
  RiShieldUserLine,
  RiSubtractLine,
  RiTaskLine,
  RiUpload2Line,
  RiUserLine
} from '@remixicon/vue'

// Legacy semantic names are kept as aliases so existing templates and mock data
// can migrate incrementally without reintroducing Element Plus icons.
export const REMIX_ICON_ALIASES = {
  Add: RiAddLine,
  ArrowDown: RiArrowDownSLine,
  ArrowLeft: RiArrowLeftLine,
  ArrowRight: RiArrowRightLine,
  Right: RiArrowRightSLine,
  Box: RiAppsLine,
  Check: RiCheckLine,
  Checkbox: RiCheckboxCircleLine,
  Close: RiCloseLine,
  DataAnalysis: RiDatabase2Line,
  Document: RiFileTextLine,
  DocumentCopy: RiFileCopyLine,
  Expand: RiLayoutRightLine,
  ExternalLink: RiExternalLinkLine,
  Finished: RiCheckboxCircleLine,
  Cloudy: RiCloudLine,
  Files: RiFileList3Line,
  FileUpload: RiFileUploadLine,
  Flag: RiFlagLine,
  Fold: RiLayoutLeftLine,
  Headset: RiHeadphoneLine,
  HomeFilled: RiHomeLine,
  Histogram: RiBarChart2Line,
  Memo: RiFile3Line,
  Menu: RiMenuLine,
  More: RiMoreLine,
  PieChart: RiPieChartLine,
  Search: RiSearchLine,
  Select: RiCheckLine,
  SetUp: RiSettings3Line,
  Setting: RiSettings3Line,
  Shield: RiShieldUserLine,
  School: RiHomeLine,
  Switch: RiExchangeLine,
  SwitchButton: RiLogoutBoxRLine,
  Task: RiTaskLine,
  Tickets: RiFileChartLine,
  TopRight: RiExternalLinkLine,
  TrendCharts: RiBarChart2Line,
  Upload: RiUpload2Line,
  UserFilled: RiUserLine,
  Warning: RiAlertLine,
  Minus: RiSubtractLine
}

export function registerRemixIcons(app) {
  for (const [name, component] of Object.entries(REMIX_ICON_ALIASES)) {
    app.component(name, component)
  }
}

export function resolveRemixIcon(name) {
  return REMIX_ICON_ALIASES[name] || RiMenuLine
}
