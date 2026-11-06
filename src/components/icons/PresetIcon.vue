<template>
  <AppIcon v-if="preset.design" :name="preset.design" :size="size" />
  <component v-else :is="preset.icon" :size="size" aria-hidden="true" />
</template>

<script setup>
import AppIcon from './AppIcon.vue'

defineProps({
  preset: { type: Object, required: true },
  size: { type: [String, Number], default: 20 }
})
</script>
