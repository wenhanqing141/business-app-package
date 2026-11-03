<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M21 14H15L14 10.4641A4 4 0 1 0 10 10.4641L9 14H3V18H21V14Z" />
    <path d="M3 21H21" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [String, Number], default: '1em' }
})
</script>
