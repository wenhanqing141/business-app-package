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
    <circle cx="12" cy="7" r="3.5" />
    <path d="M12 10.5v2.5" />
    <path d="M7 13h10v4H7z" />
    <path d="M5 17h14v3H5z" />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [String, Number], default: '1em' }
})
</script>
