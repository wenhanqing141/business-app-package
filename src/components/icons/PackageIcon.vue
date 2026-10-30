<template>
  <span
    class="package-icon"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      '--package-icon-color': preset.color,
      background: icon?.custom
        ? 'var(--fill-1)'
        : `linear-gradient(135deg, ${preset.color}, color-mix(in srgb, ${preset.color} 62%, #fff))`
    }"
  >
    <img v-if="icon?.custom" :src="icon.custom" alt="" />
    <component v-else :is="preset.icon" :size="glyphSize" color="#fff" aria-hidden="true" />
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { PRESET_ICONS } from '@/mock/pkgSeed'

const props = defineProps({
  icon: { type: Object, default: () => ({}) },
  size: { type: Number, default: 36 }
})

const preset = computed(
  () => PRESET_ICONS.find((candidate) => candidate.id === props.icon?.presetId) || PRESET_ICONS[0]
)
const glyphSize = computed(() => Math.round(props.size * 0.58))
</script>

<style scoped>
.package-icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: inherit;
  color: #fff;
}

.package-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}
</style>
