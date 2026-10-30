<template>
  <!-- 表单 · 前台填写页（线框 3） -->
  <div class="form-front">
    <!-- 蓝顶栏 + 右上外链图标 -->
    <div class="ff-topbar">
      <span class="ff-top-title">{{ app.name }}</span>
      <AppTooltip content="新窗口打开" placement="left">
        <el-icon class="ff-link"><TopRight /></el-icon>
      </AppTooltip>
    </div>

    <div class="ff-body">
      <h2 class="ff-title">{{ app.name }}</h2>

      <!-- 基础字段（绿色分组标题） -->
      <div class="ff-section-title"><span class="bar" />基础字段</div>

      <el-form label-position="top" class="ff-form">
        <el-form-item required>
          <template #label><span class="lbl">单行输入</span></template>
          <el-input v-model="form.text" placeholder="请输入" />
        </el-form-item>

        <el-form-item>
          <template #label>
            <span class="lbl">多行输入<em class="hint">（限定字符个数1-3）</em></span>
          </template>
          <el-input
            v-model="form.textarea"
            type="textarea"
            :rows="3"
            maxlength="3"
            show-word-limit
            placeholder="请输入"
          />
        </el-form-item>

        <el-form-item>
          <template #label><span class="lbl">数字输入框</span></template>
          <el-input-number v-model="form.num" :min="0" controls-position="right" class="full" />
        </el-form-item>

        <el-form-item>
          <template #label><span class="lbl">滑动条</span></template>
          <div class="slider-wrap">
            <span class="end">0 不满意</span>
            <el-slider v-model="form.slider" :max="100" class="slider" />
            <span class="end">满意</span>
          </div>
        </el-form-item>

        <el-form-item>
          <template #label><span class="lbl">计算公式</span></template>
          <el-input v-model="form.formula" readonly class="formula" />
        </el-form-item>

        <el-form-item>
          <template #label><span class="lbl">单选框</span></template>
          <el-radio-group v-model="form.radio">
            <el-radio value="良辰好景">良辰好景</el-radio>
            <el-radio value="此去经年">此去经年</el-radio>
            <el-radio value="阳春白雪">阳春白雪</el-radio>
            <el-radio value="其他">
              其他
              <el-input
                v-if="form.radio === '其他'"
                v-model="form.radioOther"
                size="small"
                class="other-input"
              />
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item>
          <template #label>
            <span class="lbl">多选框<em class="hint">（限选2个选项）</em></span>
          </template>
          <el-checkbox-group v-model="form.checks" @change="onChecksChange">
            <el-checkbox value="白云苍狗">白云苍狗</el-checkbox>
            <el-checkbox value="风云变幻">风云变幻</el-checkbox>
            <el-checkbox value="物是人非">物是人非</el-checkbox>
            <el-checkbox value="似水流年">似水流年</el-checkbox>
            <el-checkbox value="其他">
              其他
              <el-input
                v-if="form.checks.includes('其他')"
                v-model="form.checkOther"
                size="small"
                class="other-input"
              />
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item>
          <template #label><span class="lbl">下拉框</span></template>
          <el-select v-model="form.select" placeholder="请选择" class="full" fit-input-width>
            <el-option label="选项一" value="1" />
            <el-option label="选项二" value="2" />
            <el-option label="选项三" value="3" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <template #label><span class="lbl">下拉复选框</span></template>
          <el-select
            v-model="form.multiSelect"
            multiple
            collapse-tags
            placeholder="请选择"
            class="full"
            fit-input-width
          >
            <el-option label="选项一" value="1" />
            <el-option label="选项二" value="2" />
            <el-option label="选项三" value="3" />
            <el-option label="选项四" value="4" />
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <!-- 左下：提交记录；右下：提交 -->
    <div class="ff-footer">
      <el-button text class="records-btn" @click="showRecords = true">
        提交记录<el-icon class="el-icon--right"><ArrowRight /></el-icon>
      </el-button>
      <el-button type="primary" class="submit-btn" @click="onSubmit">提交</el-button>
    </div>

    <!-- 提交记录抽屉（演示） -->
    <el-drawer v-model="showRecords" title="提交记录" size="380px">
      <el-empty v-if="!records.length" description="暂无提交记录" :image-size="80" />
      <el-timeline v-else>
        <el-timeline-item v-for="r in records" :key="r.time" :timestamp="r.time" placement="top">
          {{ r.text || '未命名记录' }}
        </el-timeline-item>
      </el-timeline>
    </el-drawer>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  app: { type: Object, required: true }
})

const form = reactive({
  text: '',
  textarea: '',
  num: 0,
  slider: 0,
  formula: '0.000000',
  radio: '良辰好景',
  radioOther: '',
  checks: [],
  checkOther: '',
  select: '',
  multiSelect: []
})

const showRecords = ref(false)
const records = ref([])

function onChecksChange(val) {
  // 多选限选 2 个（线框 3：限选2个选项）
  if (val.length > 2) {
    ElMessage.warning('最多选择 2 个选项')
    form.checks = val.slice(0, 2)
  }
}

function onSubmit() {
  records.value.unshift({
    text: form.text || `滑动条 ${form.slider} / 单选 ${form.radio}`,
    time: new Date().toLocaleString('zh-CN')
  })
  ElMessage.success('提交成功（演示）')
}
</script>

<style scoped>
.form-front {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f8ff;
  min-height: 0;
}
.ff-topbar {
  height: 44px;
  flex-shrink: 0;
  background: var(--brand-1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}
.ff-top-title {
  font-size: 14px;
  font-weight: 600;
}
.ff-link {
  font-size: 17px;
  cursor: pointer;
}
.ff-body {
  flex: 1;
  overflow: auto;
  padding: 20px 28px 8px;
}
.ff-title {
  font-size: 18px;
  margin: 0 0 16px;
  color: #12141a;
}
.ff-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #4dd655;
  margin: 4px 0 18px;
}
.ff-section-title .bar {
  width: 4px;
  height: 15px;
  background: #4dd655;
  border-radius: 2px;
}
.lbl {
  font-size: 13px;
  color: #12141a;
}
.hint {
  font-style: normal;
  color: #57585e;
  font-size: 12px;
  font-weight: 400;
  margin-left: 4px;
}
.full {
  width: 100%;
}
.formula :deep(.el-input__inner) {
  background: #f5f8ff;
}
.other-input {
  width: 120px;
  margin-left: 8px;
}
.slider-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.slider {
  flex: 1;
}
.end {
  font-size: 12px;
  color: #57585e;
  white-space: nowrap;
}
.ff-footer {
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid #eaeaeb;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.records-btn {
  font-size: 13px;
  color: #57585e;
}
.submit-btn {
  min-width: 96px;
}
</style>
