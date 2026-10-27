// Copyright 2019-2026 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const test = require('node:test')
const { runInNewContext } = require('node:vm')

const source = readFileSync(join(__dirname, '../src/lib.rs'), 'utf8')
const script = source.match(/const APP_MODE_SCRIPT: &str = r#"([\s\S]*?)"#;/)[1]

function appMode(debug = false) {
  const listeners = []
  const window = {
    addEventListener(type, handler, capture = false) {
      listeners.push({ type, handler, capture })
    }
  }
  runInNewContext(script.replace('DEBUG_BUILD', String(debug)), { window })
  return function dispatch(type, properties, targetHandler = () => {}) {
    const event = {
      target: { tagName: 'DIV', isContentEditable: false },
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true
      },
      ...properties
    }
    const matching = listeners.filter((listener) => listener.type === type)
    for (const listener of matching.filter((listener) => listener.capture)) {
      listener.handler(event)
    }
    targetHandler(event)
    for (const listener of matching.filter((listener) => !listener.capture)) {
      listener.handler(event)
    }
    return event
  }
}

for (const modifier of ['ctrlKey', 'metaKey']) {
  for (const key of ['f', 'g', 'p']) {
    test(`${modifier}+${key} reaches the focused editor before browser defaults are cancelled`, () => {
      const dispatch = appMode()
      let handled = false
      const event = dispatch(
        'keydown',
        {
          key,
          [modifier]: true,
          target: { tagName: 'DIV', isContentEditable: true }
        },
        (event) => {
          // CodeMirror refuses a key event already cancelled during capture.
          if (!event.defaultPrevented) {
            handled = true
            event.preventDefault()
          }
        }
      )
      assert.equal(handled, true)
      assert.equal(event.defaultPrevented, true)
    })
  }
}

test('browser shortcuts remain cancelled when no control handles them', () => {
  const dispatch = appMode()
  for (const properties of [
    { key: 'F5' },
    { key: 'r', ctrlKey: true },
    { key: 'f', metaKey: true },
    { key: 'ArrowLeft', altKey: true },
    { key: 'Backspace' }
  ]) {
    assert.equal(dispatch('keydown', properties).defaultPrevented, true)
  }
})

test('Backspace still belongs to editable controls', () => {
  const dispatch = appMode()
  for (const target of [
    { tagName: 'INPUT' },
    { tagName: 'TEXTAREA' },
    { tagName: 'DIV', isContentEditable: true }
  ]) {
    assert.equal(dispatch('keydown', { key: 'Backspace', target }).defaultPrevented, false)
  }
})

test('developer tools retain the debug/release distinction', () => {
  assert.equal(appMode(false)('keydown', { key: 'F12' }).defaultPrevented, true)
  assert.equal(appMode(true)('keydown', { key: 'F12' }).defaultPrevented, false)
})
