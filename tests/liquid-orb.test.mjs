import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

const html = await readFile(new URL('../public/liquid-orb.html', import.meta.url), 'utf8')
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1]
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
const flush = () => new Promise(resolve => setImmediate(resolve))

function environment({ supported = true, pendingDevice = false } = {}) {
  const submitted = deferred(), lost = deferred(), requested = deferred()
  const events = new Map(), messages = [], frames = []
  let destroyed = 0, pipelines = 0
  const canvas = { dataset: {}, clientWidth: 64, clientHeight: 64, width: 0, height: 0,
    getContext: () => ({ configure() {}, getCurrentTexture: () => ({ createView() {} }) }) }
  const status = { hidden: true, textContent: '' }
  const device = {
    createShaderModule: () => ({ getCompilationInfo: async () => ({ messages: [] }) }),
    createRenderPipelineAsync: async () => { pipelines++; return { getBindGroupLayout() {} } },
    createBuffer() {}, createBindGroup() {}, addEventListener() {},
    createCommandEncoder: () => ({ beginRenderPass: () => ({ setPipeline() {}, setBindGroup() {}, draw() {}, end() {} }), finish() {} }),
    queue: { writeBuffer() {}, submit() {}, onSubmittedWorkDone: () => submitted.promise },
    lost: lost.promise, destroy: () => destroyed++,
  }
  const window = { devicePixelRatio: 2, location: { origin: 'http://localhost' },
    parent: { postMessage: message => messages.push(message) },
    addEventListener: (type, callback) => events.set(type, callback) }
  const context = vm.createContext({ window, document: { querySelector: selector => selector === '#orb' ? canvas : status },
    navigator: supported ? { gpu: { requestAdapter: async () => ({ requestDevice: () => pendingDevice ? requested.promise : Promise.resolve(device) }), getPreferredCanvasFormat: () => 'bgra8unorm' } } : {},
    requestAnimationFrame: callback => { frames.push(callback); return frames.length }, cancelAnimationFrame() {},
    performance, GPUBufferUsage: { UNIFORM: 1, COPY_DST: 2 }, console: { error() {} } })
  vm.runInContext(script, context)
  return { canvas, status, events, messages, frames, submitted, requested, device, lost,
    get destroyed() { return destroyed }, get pipelines() { return pipelines } }
}

test('reveal waits for the completed GPU frame; device loss restores the poster', async () => {
  const env = environment(); await flush()
  assert.equal(env.pipelines, 1)
  assert.equal(env.messages.length, 0)
  env.frames.shift()(0)
  assert.equal(env.canvas.width, 128)
  assert.equal(env.messages.length, 0)
  env.submitted.resolve(); await flush()
  assert.equal(env.messages[0].type, 'liquid-orb-ready')
  env.lost.resolve({ reason: 'unknown', message: 'test device loss' }); await flush()
  assert.equal(env.messages.at(-1).type, 'liquid-orb-error')
  assert.equal(env.destroyed, 1)
})

test('unsupported WebGPU signals the host to retain its static first frame', async () => {
  const env = environment({ supported: false }); await flush()
  assert.equal(env.messages[0].type, 'liquid-orb-error')
  assert.equal(env.pipelines, 0)
  assert.match(env.status.textContent, /not supported/)
})

test('leaving during asynchronous device creation releases the late device', async () => {
  const env = environment({ pendingDevice: true }); await flush()
  env.events.get('pagehide')()
  env.requested.resolve(env.device); await flush()
  assert.equal(env.destroyed, 1)
  assert.equal(env.pipelines, 0)
  assert.equal(env.frames.length, 0)
  assert.equal(env.messages.length, 0)
})
