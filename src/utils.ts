const mapObjKeys = require('@eluvio/elv-js-helpers/Functional/mapObjKeys')

import { TFoundSubmachine, TMachineDefOrStateDef } from './types'

// Default notifier (context._notifier)
export const alertNotifier: Record<string, Function> = {
  error: (message: string) => alert(`❌ ${message}`),
  info: (message: string) => alert(`ℹ️ ${message}`),
  success: (message: string) => alert(`️✅ℹ ${message}`),
  warning: (message: string) => alert(`⚠️ ${message}`)
}

// Default logger (context._logger)
export const consoleLogger: Record<string, Function> = {
  debug: (...args: any) => console.debug(...args),
  error: (...args: any) => console.error(...args),
  info: (...args: any) => console.info(...args),
  log: (...args: any) => console.log(...args),
  warn: (...args: any) => console.warn(...args)
}

export const namespaceKeys = (
  namespace: string,
  obj: Record<string, any>
): Record<string, any> => {
  return namespace === ''
    ? obj
    : mapObjKeys((key: String) => `${namespace}.${key}`, obj)
}

export const pathInParent2ObjectPath = (pathInParent: string[]): string[] =>
  pathInParent.map((k) => ['states', k]).flat()

export const submachines = (
  machineDef: TMachineDefOrStateDef,
  parentPath: string[] = []
): TFoundSubmachine[] => {
  let result: TFoundSubmachine[] = []
  if (machineDef.states) {
    for (const [stateKey, stateDef] of Object.entries(machineDef.states)) {
      if (stateDef.states) {
        result = result.concat(
          submachines(stateDef, parentPath.concat([stateKey]))
        )
      } else if (stateDef.meta?.submachine) {
        result.push({
          path: parentPath.concat([stateKey]),
          submachine: stateDef.meta.submachine,
          map: stateDef.meta.map
        })
      }
    }
  }
  return result
}
