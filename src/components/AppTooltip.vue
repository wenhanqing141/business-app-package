<script>
import { cloneVNode, computed, h, nextTick, onBeforeUnmount, onMounted, onUpdated, ref } from 'vue'
import { ElTooltip } from 'element-plus'

export default {
  name: 'AppTooltip',
  inheritAttrs: false,
  props: {
    popperClass: { type: String, default: '' },
    showAfter: { type: Number, default: 300 },
    onlyWhenOverflow: { type: Boolean, default: false }
  },
  setup(props, { attrs, slots }) {
    const trigger = ref(null)
    const isOverflowing = ref(false)
    let resizeObserver

    const mergedPopperClass = computed(() =>
      ['app-tooltip', props.popperClass].filter(Boolean).join(' ')
    )

    function getTriggerElement() {
      const value = trigger.value
      if (value instanceof HTMLElement) return value
      return value?.$el instanceof HTMLElement ? value.$el : null
    }

    function updateOverflow() {
      const element = getTriggerElement()
      isOverflowing.value = Boolean(
        element &&
        (element.scrollWidth > element.clientWidth + 1 ||
          element.scrollHeight > element.clientHeight + 1)
      )
    }

    function observeTrigger() {
      resizeObserver?.disconnect()
      const element = getTriggerElement()
      if (!element) return

      updateOverflow()
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(updateOverflow)
        resizeObserver.observe(element)
      }
    }

    onMounted(() => nextTick(observeTrigger))
    onUpdated(() => nextTick(observeTrigger))
    onBeforeUnmount(() => resizeObserver?.disconnect())

    function setTrigger(value) {
      trigger.value = value
    }

    return () => {
      const child = slots.default?.()[0]
      return h(
        ElTooltip,
        {
          ...attrs,
          popperClass: mergedPopperClass.value,
          showAfter: props.showAfter,
          disabled: Boolean(attrs.disabled) || (props.onlyWhenOverflow && !isOverflowing.value)
        },
        {
          default: () => (child ? cloneVNode(child, { ref: setTrigger }) : null)
        }
      )
    }
  }
}
</script>
