import { createMachine } from 'xstate'

const { ComposableMachine } = require('../../../src/ComposableMachine')
const { CreateContentObject } = require('../../fixtures/CreateContentObject')
const { CreateMaster } = require('../../fixtures/CreateMaster')

test('new ComposableMachine()', () => {
  expect(() => new ComposableMachine()).not.toThrow()
})

test('Create machine from ComposableMachine def()', () => {
  const instance = new CreateContentObject()
  const def = instance.def()
  const conf = instance.conf()
  expect(() => createMachine(def, conf)).not.toThrow()
})

test('Create nested machine from ComposableMachine def()', () => {
  const instance = new CreateMaster()
  const def = instance.def()
  const conf = instance.conf()
  expect(() => createMachine(def, conf)).not.toThrow()
})
