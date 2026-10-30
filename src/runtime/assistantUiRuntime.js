import { AssistantRuntimeImpl, ExternalStoreRuntimeCore } from '@assistant-ui/core/internal'

function textFromMessage(message) {
  return (message?.content || [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

function toThreadMessage(message) {
  const text =
    message.type === 'user'
      ? message.text || ''
      : message.type === 'text'
        ? message.text || ''
        : message.summary || message.sub || message.q?.title || message.text || ''

  return {
    id: String(message.id),
    role: message.role === 'user' ? 'user' : 'assistant',
    content: [{ type: 'text', text }],
    metadata: { domainType: message.type }
  }
}

/**
 * Small external-store bridge for the existing AI creation demo.
 * assistant-ui owns composer state and submit semantics; the page owns the
 * domain workflow and its staged mock responses.
 */
export function createAssistantComposerRuntime({ onNew, getState, suggestions = [] }) {
  let messages = []
  let isRunning = false
  let sync = () => {}

  const makeAdapter = () => ({
    messages,
    suggestions,
    isRunning,
    isDisabled: getState().isDisabled,
    isSendDisabled: getState().isSendDisabled,
    convertMessage: (message) => ({
      id: message.id,
      role: message.role,
      content: [{ type: 'text', text: message.text }]
    }),
    setMessages(next) {
      messages = next
      sync()
    },
    onNew: async (message) => {
      const text = textFromMessage(message).trim()
      if (!text) return

      messages = [
        ...messages,
        { id: `assistant-ui-${Date.now()}`, role: 'user', text }
      ]
      isRunning = true
      sync()
      try {
        await onNew(text)
      } finally {
        isRunning = false
        sync()
      }
    },
    onEdit: async () => {},
    onReload: async () => {},
    onCancel: async () => {
      isRunning = false
      sync()
    }
  })

  const core = new ExternalStoreRuntimeCore(makeAdapter())
  sync = () => core.setAdapter(makeAdapter())

  return {
    runtime: new AssistantRuntimeImpl(core),
    sync,
    setExternalMessages(domainMessages) {
      messages = domainMessages.map(toThreadMessage)
      sync()
    }
  }
}
