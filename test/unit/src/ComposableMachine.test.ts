const { ComposableMachine } = require( '../../../src/ComposableMachine')



test('ComposableMachine', () => {
  expect(() => new ComposableMachine()).not.toThrow()
});
