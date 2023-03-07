// TODO: getNode/setNode()
// TODO: localAssign: protect against output destinations
// TODO: _act_ValidateInputs
// TODO: runtime validators
// TODO: abbreviated namespaces

import { ActionMeta, AnyEventObject, assign } from "xstate";

import filterKV from '@eluvio/elv-js-helpers/Functional/filterKV'
import mergeRight from '@eluvio/elv-js-helpers/Functional/mergeRight'
import mapObjKeys from '@eluvio/elv-js-helpers/Functional/mapObjKeys'
import mapObjValues from '@eluvio/elv-js-helpers/Functional/mapObjValues'
import uuid from '@eluvio/elv-js-helpers/Misc/uuid'

import {
  alertNotifier,
  consoleLogger,
  namespaceKeys,
  pathInParent2ObjectPath,
  submachines
} from './utils'

import {
  CMAction, CMActionFunction,
  CMActions,
  CMConf,
  CMContextFieldDef,
  CMFieldMap,
  CMFoundSubmachine, CMGenericContext,
  CMInvokeConfig, CMInvokeTransition,
  CMMachineDefOrStateDef, CMServiceFunction,
  CMSubmachineMap,
  CMTransition,
  CMTransitionConfig,
  CMTransitionElement,
  StringOrStrArray,
  tgFieldHasDefault,
  tgFieldHasInitial,
  tgIsArray,
  tgIsFunction,
  tgIsString,
  tgIsUndefined,
  tgMapHasInputs,
  tgStateHasAfter,
  tgStateHasContext,
  tgStateHasEntry,
  tgStateHasExit,
  tgStateHasInvoke,
  tgStateHasOn,
  tgStateHasOnDone,
  tgStateHasStates,
  XstateEvent
} from "./types";

import getPath from '@eluvio/elv-js-helpers/Functional/getPath'
import setPath from '@eluvio/elv-js-helpers/Functional/setPath'

export interface IComposableMachineClass {
  new (pathInParent: string[], map: CMSubmachineMap): ComposableMachine
}

export class ComposableMachine {
  map: CMSubmachineMap // Defines input/output connections to parent machine (empty map for outermost machine).
  pathInParent: string[] // Location in state hierarchy (empty array for outermost machine).

  constructor(pathInParent: string[] = [], map: CMSubmachineMap = {}) {
    this.pathInParent = pathInParent
    this.map = map
    const localFieldnames = this.mergedContextFieldnames()
    const self = this
    if (tgMapHasInputs(map)) {
      mapObjKeys((childFieldName: string) => {
        if (!localFieldnames.includes(childFieldName)) {
          throw Error(
            `Input map error: field '${childFieldName}' not defined in context of child machine (state: ${self.name()}, submachine: ${self.className()})`
          )
        }
      }, map.context.inputs)
    }
  }

  // Built-in action - log params to console
  _act_LogArgs(
    context: CMGenericContext,
    event: AnyEventObject,
    meta: ActionMeta<CMGenericContext, AnyEventObject>
  ): void {
    console.debug(this.notificationPrefix())
    console.debug(context)
    console.debug(event)
    console.debug(meta)
  }

  _act_NotifyError(    context: CMGenericContext,
                       event: AnyEventObject
  ): void {
    this.localContext(context, '_notifier').error(
      this.notificationPrefix() + (event.data?.message || JSON.stringify(event))
    )
  }

  _act_NotifySuccess(    context: CMGenericContext
  ): void {
    this.localContext(context, '_notifier').success(
      this.notificationPrefix() + this.defSuccessMessage()
    )
  }

  // Built-in action - record activation of machine/submachine to context
  _act_SaveEntryToContext(): CMActionFunction {
    const self = this
    return this.localAssign({
      _firstEnteredAt: (context: object) =>
        self.localContext(context, '_firstEntredAt') || new Date(),
      _lastEnteredAt: () => new Date()
    })
  }

  // Built-in action - save error to context
  _act_SaveErrorToContext(): CMActionFunction {
    return this.localAssign({
      _error: (_: object, event: XstateEvent) => event.data,
      _errorString: (_: object, event: XstateEvent) =>
        event.data?.message || `${event.data}`,
      _lastFailedAt: () => new Date()
    })
  }

  // Built-in action - save success to context
  _act_SaveSuccessToContext(): CMActionFunction {
    return this.localAssign({
      _lastSucceededAt: () => new Date(),
      _result: (_: object, event: XstateEvent) => event.data
    })
  }

  _act_ValidateInputs(): void {}

  // Base class built-in actions
  baseActions(): Record<string, CMActionFunction> {
    return {
      _act_LogArgs: this._act_LogArgs,
      _act_NotifyError: this._act_NotifyError,
      _act_NotifySuccess: this._act_NotifySuccess,
      _act_SaveEntryToContext: this._act_SaveEntryToContext(),
      _act_SaveErrorToContext: this._act_SaveErrorToContext(),
      _act_SaveSuccessToContext: this._act_SaveSuccessToContext(),
      _act_ValidateInputs: this._act_ValidateInputs
    }
  }

  baseContext(): Record<string, CMContextFieldDef> {
    const self = this
    return {
      _createdAt: {
        desc: 'Date/time that machine (or submachine) context was first instantiated',
        initial: () => new Date(),
        type: Date
      },
      _data: {
        desc: 'General purpose field for storing result of a service invocation',
        type: Object
      },
      _error: {
        desc: 'General purpose field for storing last error thrown.',
        type: Error
      },
      _errorString: {
        desc: 'General purpose field for storing string representation of last error thrown.',
        type: String
      },
      _firstEnteredAt: {
        desc: 'First date/time that machine (or submachine) initial state was entered',
        type: Date
      },
      _lastAttemptedAt: {
        desc: 'General purpose field for storing last date/time that a potentially failing operation was tried/retried',
        type: Date
      },
      _lastEnteredAt: {
        desc: 'Most recent date/time that machine (or submachine) initial state was entered',
        type: Date
      },
      _lastFailedAt: {
        desc: 'General purpose field for storing last date/time that the machine (or submachine) failed at an operation',
        type: Date
      },
      _lastSucceededAt: {
        desc: 'General purpose field for storing last date/time that the machine (or submachine) finished successfully',
        type: Date
      },
      _logger: {
        default: consoleLogger,
        desc: 'Logger object providing debug(), error(), info(), log() and warning() functions',
        input: true,
        required: true,
        type: Object,
        unserializable: true
      },
      _map: {
        default: {},
        desc: 'Copy of the input/output map that was used to generate submachine definition (empty object for outermost machine).',
        initial: () => self.map,
        required: true,
        type: Object
      },
      _name: {
        desc: 'Name of the machine or submachine',
        initial: () => self.name(),
        type: String
      },
      _notifier: {
        default: alertNotifier,
        desc: 'Notifier object providing error(), info(), success() and warning() functions',
        input: true,
        required: true,
        type: Object,
        unserializable: true
      },
      _pathInParent: {
        default: [],
        desc: 'Array of strings listing identifying the machine location within state hierarchy. Empty array if this machine is outermost.',
        initial: () => self.pathInParent,
        required: true,
        type: Array
      },
      _result: {
        desc: 'General purpose field for storing final result of machine (or submachine) finishing successfully',
        type: Object
      },
      _uuid: {
        desc: 'Unique ID in Date/time that machine (or submachine) context was first instantiated',
        initial: uuid,
        type: String
      }
    }
  }

  // Base class default input/output map
  // Default is to accept _logger and _notifier from parent
  baseMap(): CMSubmachineMap {
    return {
      actions: {},
      context: {
        inputs: {
          _logger: '_logger',
          _notifier: '_notifier'
        },
        outputs: {}
      }
    }
  }

  baseServices(): Record<string, CMServiceFunction> {
    return {}
  }

  // Class name is automatically used for machine description,
  // and if this is not a submachine, will also be used as machine id
  className(): string {
    return this.constructor.name
  }

  // Returns config (actions and services) to use as second argument for createMachine()
  conf(): CMConf {
    let result: CMConf = {
      actions: this.namespaceObjKeys(this.mergedActions()),
      services: this.namespaceObjKeys(this.mergedServices())
    }

    for (const foundSubmachineNode of this.submachineStates()) {
      const childPathInParent = this.pathInParent.concat(
        foundSubmachineNode.path
      )
      const submachineClass =
        this.defImportedMachines()[foundSubmachineNode.submachine]
      const submachineObj = new submachineClass(
        childPathInParent,
        foundSubmachineNode.map || {}
      )
      const submachineConf = submachineObj.conf()
      result = {
        actions: mergeRight(result.actions, submachineConf.actions),
        services: mergeRight(result.services, submachineConf.services)
      }
    }

    return result
  }

  // Returns definition to use as first argument for createMachine()
  // Do not override in subclasses - override template() and extend initialContext()
  def(): CMMachineDefOrStateDef {
    const self = this
    const parentFieldnames = this.mergedContextFieldnames()
    let result = this.defMachine()
    result.id = this.className() // this will get removed by parent if this is a submachine
    result.description = this.className()
    result.predictableActionArguments = true // this will get removed by parent if this is a submachine

    result.context = this.namespaceObjKeys(this.mergedInitialContext())

    // Namespace action / service references
    result = this.namespaceRefs(result)

    // inject submachines
    for (const foundSubmachineNode of this.submachineStates()) {
      const childPathInParent = this.pathInParent.concat(
        foundSubmachineNode.path
      )
      // intersperses 'states' before each state name, e.g. ['foo', 'bar'] => ['states, 'foo', 'states', 'bar']
      const pathIncludingStates = pathInParent2ObjectPath(childPathInParent)
      const originalState = getPath(pathIncludingStates, result)
      const submachineClass =
        this.defImportedMachines()[foundSubmachineNode.submachine]
      // double-check that any input map refers to fields that actually exist in parent
      if (
        !tgIsUndefined(foundSubmachineNode.map) &&
        tgMapHasInputs(foundSubmachineNode.map)
      ) {
        mapObjValues((parentFieldName: string) => {
          if (!parentFieldnames.includes(parentFieldName)) {
            throw Error(
              `Input map error: field '${parentFieldName}' does not exist in parent machine (state: ${self.name()}, machine: ${self.className()})`
            )
          }
        }, foundSubmachineNode.map.context.inputs)
      }
      const submachineObj = new submachineClass(
        childPathInParent,
        foundSubmachineNode.map || {}
      )

      const submachineDef = submachineObj.def()
      delete submachineDef.id
      delete submachineDef.predictableActionArguments

      // extra type guarding to make TypeScript happy
      result.context = result.context || {}
      if (tgStateHasContext(submachineDef)) {
        // merge (initial) subcontext into parent
        result.context = mergeRight(result.context, submachineDef.context)
      }
      delete submachineDef.context

      // Copy onDone from original state
      if (tgStateHasOnDone(originalState)) {
        submachineDef.onDone = originalState.onDone
      }

      result = setPath(pathIncludingStates, submachineDef, result)
    }

    return result
  }

  // Override in child classes
  defActions(): Record<string, CMActionFunction> {
    return {}
  }

  // Override in child classes
  defContext(): Record<string, CMContextFieldDef> {
    return {}
  }

  // Override in child classes
  defEntry(): string[] {
    return []
  }

  // Override in child classes
  defImportedMachines(): Record<string, IComposableMachineClass> {
    return {}
  }

  // Overridden by child classes
  // Machine definition without initial context and auto-created fields.
  // States to be replaced by submachines are marked by setting metadata
  defMachine(): CMMachineDefOrStateDef {
    return {}
  }

  // Extend to define additional output fields
  defOutputs(): Record<string, any> {
    return {
      _error: 'Last error object or message',
      _lastAttemptedAt: 'Last execution (including retries)',
      _lastFailedAt: 'Last error date/time',
      _lastSucceededAt:
        'Last success date/time (should always be either null or later than lastFailedAt)'
    }
  }

  // Override in child classes
  defServices(): Record<string, CMServiceFunction> {
    return {}
  }

  // Override in child classes
  defSuccessMessage(): string {
    return 'Operation succeeded'
  }

  isSubmachine(): boolean {
    return this.pathInParent.length !== 0
  }

  localAssign(assignments: object): CMActionFunction {
    const definedInputs = this.mergedInputFieldnames()
    for (const fieldName of Object.keys(assignments)) {
      if (definedInputs.includes(fieldName))
        throw Error(
          `${this.notificationPrefix()}Attempt to assign to input field '${fieldName}' (state: ${this.name()}, submachine: ${this.className()})`
        )
    }
    return assign(this.remapAssignments(assignments))
  }

  // Retrieve field from local context (possibly remapped to parent context)
  localContext(context: Record<string, any>, fieldname: string): any {
    console.log(`Get fieldname '${fieldname}' from local context`)
    return this.resolveIndirection(context, this.namespaceStr(fieldname))
  }

  localContextGetFn(fieldname: string): Function {
    const self = this
    return (context: Record<string, any>): any => {
      return self.localContext(context, fieldname)
    }
  }

  // Returns merged actions - base class + subclass
  mergedActions(): Record<string, CMActionFunction> {
    return mergeRight(this.baseActions(), this.defActions())
  }

  // Returns merged context definitions - base class + subclass
  mergedContextDef(): Record<string, CMContextFieldDef> {
    return mergeRight(this.baseContext(), this.defContext())
  }

  mergedContextFieldnames(): string[] {
    return Object.keys(this.mergedContextDef())
  }

  mergedInitialFieldDefs(): Record<string, CMContextFieldDef> {
    return filterKV(
      (pair: TPair) => pair.snd().initial,
      this.mergedContextDef()
    )
  }

  mergedInitialContext(): Record<string, any> {
    // get context def, filter by those that have
    // initial or default property and those that have been remapped
    const result: Record<string, any> = {}
    const contextDef = this.mergedContextDef()
    const contextFieldNames = Object.keys(contextDef)
    const inputFieldnames = this.mergedInputFieldnames()
    const inputMap = this.mergedInputMap()
    const mappedFieldnames = Object.keys(inputMap)

    // review all fields in context def, see which ones
    // should be part of initial context
    for (const contextFieldname of contextFieldNames) {
      const fieldDef = contextDef[contextFieldname]
      // check for inputs mapped from parent
      if (mappedFieldnames.includes(contextFieldname)) {
        if (!inputFieldnames.includes(contextFieldname))
          throw Error(
            `${contextFieldname} is not an input field (state: ${this.name()}, submachine: ${this.className()})`
          )
        result[contextFieldname] = this.parentContextGetFn(
          inputMap[contextFieldname]
        )
      } else if (tgFieldHasInitial(fieldDef)) {
        // Not mapped from parent
        // Has initial value defined
        result[contextFieldname] = fieldDef.initial
      } else if (tgFieldHasDefault(fieldDef)) {
        result[contextFieldname] = fieldDef.default
      }
    }
    return result
  }

  // Returns entries from merged context definition that are marked input: true
  mergedInputFieldDefs(): Record<string, CMContextFieldDef> {
    return filterKV((pair: TPair) => pair.snd().input, this.mergedContextDef())
  }

  // Returns names of fields in local context that are marked input: true
  mergedInputFieldnames(): string[] {
    return Object.keys(this.mergedInputFieldDefs())
  }

  // Returns map.context.inputs from merged map (if this is a submachine - otherwise empty object)
  mergedInputMap(): CMFieldMap {
    return this.mergedMap().context?.inputs || {}
  }

  // If this is a submachine and an input map was specified, and input map has
  // an entry for submachine context field, returns the substitution (either a string or function).
  // Returns undefined otherwise
  mergedInputMapEntry(fieldname: string): string | Function | undefined {
    return this.mergedInputMap()[fieldname]
  }

  // Returns merged map - base class + subclass
  // (but only if submachine, otherwise empty map)
  mergedMap(): CMSubmachineMap {
    return this.isSubmachine()
      ? {
          actions: mergeRight(
            this.baseMap().actions || {},
            this.map.actions || {}
          ),
          context: {
            inputs: mergeRight(
              this.baseMap().context?.inputs || {},
              this.map.context?.inputs || {}
            ),
            outputs: mergeRight(
              this.baseMap().context?.outputs || {},
              this.map.context?.outputs || {}
            )
          }
        }
      : {
          actions: {},
          context: {
            inputs: {},
            outputs: {}
          }
        }
  }

  // Returns merged services - base class + subclass
  // (currently the base class has no built-in services)
  mergedServices(): Record<string, CMServiceFunction> {
    return mergeRight(this.baseServices(), this.defServices())
  }

  // Machine (or state) name.
  // If we are a submachine, return last element of pathInParent
  // If we are top level machine, use class name
  name(): string {
    return this.isSubmachine()
      ? this.pathInParent[this.pathInParent.length - 1]
      : this.className()
  }

  // Return namespace in dot notation (empty string for outermost machine)
  namespace(): string {
    return this.pathInParent.join('.')
  }

  namespaceAction(a: CMAction): CMAction {
    return this.namespaceStr(a)
  }

  namespaceActions(a: CMActions): CMActions {
    return tgIsArray(a)
      ? a.map(this.namespaceAction.bind(this))
      : this.namespaceAction(a)
  }

  namespaceInvokeDef(i: CMInvokeConfig): CMInvokeConfig {
    const result: CMInvokeConfig = {src: this.namespaceStr(i.src)}
    if ("onDone" in i && i.onDone !== undefined) result.onDone = this.namespaceInvokeTransition(i.onDone)
    if ("onError" in i && i.onError !== undefined) result.onError = this.namespaceInvokeTransition(i.onError)
    return result
  }

  // Prepend namespace to action name(s) if present
  // Similar to namespaceTransition except transition cannot be a string array
  namespaceInvokeTransition(t: CMInvokeTransition): CMInvokeTransition {
    if (tgIsArray(t)) {
      return t.map(this.namespaceInvokeTransitionElementNonString.bind(this))
    } else {
      return this.namespaceInvokeTransitionElement(t)
    }
  }

  namespaceInvokeTransitionElement(e: CMTransitionConfig | string): CMTransitionConfig | string {
    if (typeof e === "string") {
      return this.namespaceStr(e)
    } else {
      return this.namespaceInvokeTransitionElementNonString(e)
    }
  }

  namespaceInvokeTransitionElementNonString(e: CMTransitionConfig): CMTransitionConfig {
    const result: CMTransitionConfig = {}
    if ('actions' in e && e.actions !== undefined) result.actions = this.namespaceActions(e.actions)
    if ('target' in e && e.target !== undefined) result.target = e.target
    return result
  }


  namespaceObjKeys<T>(obj: Record<string, T>): Record<string, T> {
    return namespaceKeys(this.namespace(), obj)
  }

  namespaceRefs(d: CMMachineDefOrStateDef): CMMachineDefOrStateDef {
    if (tgStateHasAfter(d))
      d.after = mapObjValues(this.namespaceTransition.bind(this), d.after)
    if (tgStateHasEntry(d)) d.entry = this.namespaceStrOrArray(d.entry)
    if (tgStateHasExit(d)) d.exit = this.namespaceStrOrArray(d.exit)
    if (tgStateHasInvoke(d)) d.invoke = this.namespaceInvokeDef(d.invoke)
    if (tgStateHasOn(d))
      d.on = mapObjValues(this.namespaceTransition.bind(this), d.on)
    if (tgStateHasOnDone(d)) d.onDone = this.namespaceTransition(d.onDone)
    if (tgStateHasStates(d))
      d.states = mapObjValues(this.namespaceRefs.bind(this), d.states)
    return d
  }

  // Prepend namespace to string using dot notation
  namespaceStr(x: string): string {
    return this.pathInParent.concat(x).join('.')
  }

  // Prepend namespace to string or each string in an array using dot notation
  namespaceStrOrArray(x: StringOrStrArray): StringOrStrArray {
    if (tgIsArray(x)) {
      return x.map(this.namespaceStr.bind(this))
    } else {
      return this.namespaceStr(x)
    }
  }



  // Prepend namespace to action name(s) if present
  // CMTransition could be singular or array
  // Elements could be strings or CMTransitionConfig
  namespaceTransition(t: CMTransition): CMTransition {
    if (tgIsArray(t)) {
      return t.map(this.namespaceTransitionElementNonString.bind(this))
    } else {
      return this.namespaceTransitionElement(t)
    }
  }

  namespaceTransitionConfig(t: CMTransitionConfig): CMTransitionConfig {
    if (t.actions !== undefined) {
      t.actions = this.namespaceActions(t.actions)
    }
    return t
  }

  // Prepend namespace to action name(s) if present
  // CMTransitionElement could be a string or CMTransitionConfig
  namespaceTransitionElement(t: CMTransitionElement): CMTransitionElement {
    return tgIsString(t)
      ? this.namespaceStr(t)
      : this.namespaceTransitionConfig(t)
  }

  namespaceTransitionElementNonString(t: CMTransitionConfig): CMTransitionConfig {
    return this.namespaceTransitionConfig(t)
  }

  // Prepend namespace to action name(s) if present
  // namespaceTransitionSpec(t: TransitionSpec): TransitionSpec {
  //   if (tgTransHasActions(t)) {
  //     t.actions = this.namespaceStrOrArray(t.actions)
  //   }
  //   return t
  // }

  // Prepend namespace to action name(s) if present for 1 spec or for each spec in an array
  // namespaceTransitionSpecOrArray(t: CMTransition): CMTransition {
  //   if (tgIsArray(t)) {
  //     return t.map(this.namespaceTransition.bind(this))
  //   } else {
  //     return this.namespaceTransition(t)
  //   }
  // }

  // If submachine, return path to machine in dot notation, plus ': '
  // If we are top level machine, return class name plus ': '
  notificationPrefix(): string {
    return `${
      this.isSubmachine()
        ? this.pathInParent.join('.') // prefix notification with full path
        : this.name()
    }: `
  }

  // Retrieve field from parent context (possibly remapped to grandparent context)
  parentContext(context: Record<string, any>, fieldname: string): any {
    console.log(`Get fieldname '${fieldname}' from parent`)
    return this.resolveIndirection(context, this.parentNamespaceStr(fieldname))
  }

  parentContextGetFn(fieldname: string): Function {
    const self = this
    return (context: Record<string, any>): any => {
      return self.parentContext(context, fieldname)
    }
  }

  // Return parent's namespace in dot notation (empty string for outermost machine and for first level submachines)
  parentNamespaceStr(x: string): string {
    return this.pathInParent.slice(0, -1).concat(x).join('.')
  }

  // Prepend parent's namespace to string or each string in an array using dot notation
  parentNamespaceStrOrArray(x: StringOrStrArray): StringOrStrArray {
    if (tgIsArray(x)) {
      return x.map(this.parentNamespaceStr.bind(this))
    } else {
      return this.parentNamespaceStr(x)
    }
  }

  // Prepend parent's namespace to action name(s) if present
  // parentNamespaceTransitionSpec(t: TransitionSpec): TransitionSpec {
  //   if (tgTransHasActions(t)) {
  //     t.actions = this.parentNamespaceStrOrArray(t.actions)
  //   }
  //   return t
  // }

  // Prepend parent's namespace to action name(s) if present for 1 spec or for each spec in an array
  // parentNamespaceTransitionSpecOrArray(
  //   t: TransitionSpecOrArray
  // ): TransitionSpecOrArray {
  //   if (tgIsArray(t)) {
  //     return t.map(this.parentNamespaceTransitionSpec.bind(this))
  //   } else {
  //     return this.parentNamespaceTransitionSpec(t)
  //   }
  // }

  // Process the argument to the assign() function to make relative to local context
  remapAssignments(assignments: Record<string, any>): Record<string, any> {
    const contextFieldnames = this.mergedContextFieldnames()
    const inputFieldnames = this.mergedInputFieldnames()

    for (const key of Object.keys(assignments)) {
      // check that field assigned is defined in context
      if (!contextFieldnames.includes(key))
        throw Error(
          `Assign(): field '${key}' not defined in local machine context (state: ${this.name()}, submachine: ${this.className()})`
        )
      // check that field is not an input (context fields that have been redirected to pull from parent context)
      if (inputFieldnames.includes(key))
        throw Error(
          `Assign(): field '${key}' is an input field in local machine context (state: ${this.name()}, submachine: ${this.className()})`
        )
    }

    // check that mapped outputs (context fields that have been redirected to pull from child context) are not being assigned to

    // namespace assignment keys
    return this.namespaceObjKeys(assignments)
  }

  remapInitialContext(): Record<string, any> {
    const result = this.mergedInitialContext()

    // Process input map substitutions
    const definedInputs = this.mergedInputFieldnames()
    for (const fieldName of this.remappedInputFieldNames()) {
      if (!definedInputs.includes(fieldName))
        throw Error(
          `Field '${fieldName}' not found in submachine's defined inputs (state: ${this.name()}, submachine: ${this.className()})`
        )
      result[fieldName] = this.mergedInputMapEntry(fieldName)
    }

    // If we are a submachine, rename all our context keys by prepending
    // our path within parent using dot notation
    return this.namespaceObjKeys(result)
  }

  remappedInputFieldNames(): string[] {
    return Object.keys(this.mergedInputMap())
  }

  resolveIndirection(
    context: Record<string, any>,
    namespacedFieldname: string
  ): any {
    console.log(`resolving field '${namespacedFieldname}'`)
    let val = context[namespacedFieldname]
    // If value is a function that returns a function, call it to unwrap one layer.
    // Repeat until it is a function that does not return a function
    // (trying to preserve Vue reactivity)
    while (tgIsFunction(val) && tgIsFunction(val(context))) {
      console.log('unwrap function')
      val = val(context)
    }
    // Don't return val, it has been through a variable assignment and may
    // have lost reactivity. Instead, return original ref
    return tgIsFunction(val) ? val(context) : context[namespacedFieldname]
  }

  submachineStates(): CMFoundSubmachine[] {
    return submachines(this.defMachine())
  }
}
