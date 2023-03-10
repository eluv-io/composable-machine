const mapObjKeys = require('@eluvio/elv-js-helpers/Functional/mapObjKeys')

import { CMFoundSubmachine, CMMachineDefOrStateDef } from './types'

// Default notifier (context._notifier)
export const alertNotifier: Record<string, Function> = {
  error: (message: string) => console.log(`❌ ${message}`),
  info: (message: string) => console.log(`ℹ️ ${message}`),
  success: (message: string) => console.log(`️✅ℹ ${message}`),
  warning: (message: string) => console.log(`⚠️ ${message}`)
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
  machineDef: CMMachineDefOrStateDef,
  parentPath: string[] = []
): CMFoundSubmachine[] => {
  let result: CMFoundSubmachine[] = []
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
