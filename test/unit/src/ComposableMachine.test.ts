import { createMachine } from 'xstate'

const { ComposableMachine } = require('../../../src/ComposableMachine')
const { CreateContentObject } = require('../../fixtures/CreateContentObject')
const { CreateMaster } = require('../../fixtures/CreateMaster')

test('new ComposableMachine()', () => {
  expect(() => new ComposableMachine()).not.toThrow()
})

test('Create machine from ComposableMachine def()/conf()', () => {
  const instance = new CreateContentObject()
  const def = instance.def()
  const conf = instance.conf()
  expect(() => createMachine(def, conf)).not.toThrow()
})

test('Create nested machine from ComposableMachine def()/conf()', () => {
  const instance = new CreateMaster()
  const def = instance.def()
  const conf = instance.conf()
  expect(() => createMachine(def, conf)).not.toThrow()
})

test('Service error handling', () => {
  const instance = new CreateMaster()
  const def = instance.def()
  const conf = instance.conf()
  const M = createMachine(def, conf)
  const { initialState } = M
  let nextState = M.transition(initialState, 'START');
  console.log(nextState.value);
  nextState = M.transition(nextState, { type: 'START' }); // event object
  console.log(nextState.value);
  nextState = M.transition(nextState, { type: 'RETRY' }); // event object
  console.log(nextState.value);

})
