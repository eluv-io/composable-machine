import isArray from '@eluvio/elv-js-helpers/Boolean/isArray'
import isFunction from '@eluvio/elv-js-helpers/Boolean/isFunction'
import isString from '@eluvio/elv-js-helpers/Boolean/isString'
import isUndefined from '@eluvio/elv-js-helpers/Boolean/isUndefined'
import objHasKey from '@eluvio/elv-js-helpers/Boolean/objHasKey'
import { ActionMeta, AnyEventObject, InvokeMeta, SingleOrArray } from "xstate";

// Define type that is narrower than corresponding xstate type
// Actions must be strings, no inline functions
export type CMAction = string
export type CMActions = SingleOrArray<CMAction>

export type CMActionFunction = (context: CMGenericContext, event: AnyEventObject, meta: ActionMeta<CMGenericContext, AnyEventObject>) => void
export type CMServiceFunction = (
  context: CMGenericContext,
  event: AnyEventObject,
  meta: InvokeMeta
) => PromiseLike<any>

export type CMConf = {
  actions: Record<string, CMActionFunction>
  services: Record<string, CMServiceFunction>
}

export type CMContextFieldDef = {
  default?: any
  desc: string
  input?: boolean
  initial?: any
  required?: boolean
  type: Object
  unserializable?: boolean
}

export type CMContextFieldDefWithDefault = Omit<
  CMContextFieldDef,
  'default'
> & {
  default: any
}

export type CMContextFieldDefWithInitial = Omit<
  CMContextFieldDef,
  'initial'
> & {
  initial: any
}

export type CMFieldMap = Record<string, string>

export type CMFoundSubmachine = {
  path: string[]
  submachine: string
  map?: CMSubmachineMap
}

// Define type that is wider than corresponding xstate type
// Create a generic context type
export type CMGenericContext = Record<string, any>

export type CMInvokeConfig = {
  src: string
  onDone?: CMInvokeTransition
  onError?: CMInvokeTransition
}

export type CMInvokeTransition = string | SingleOrArray<CMTransitionConfig>


// MachineConfig
export type CMMachineDefOrStateDef = {
  after?: Record<string, CMTransition>
  context?: CMGenericContext
  description?: string
  entry?: CMActions
  exit?: CMActions
  id?: string
  initial?: string
  invoke?: CMInvokeConfig
  meta?: CMStateMeta
  on?: Record<string, CMTransition>
  onDone?: CMTransition
  predictableActionArguments?: boolean
  states?: Record<string, CMMachineDefOrStateDef>
  type?: 'final' | 'atomic' | 'compound' | 'parallel' | 'history' | undefined
}

export type CMMachineDefOrStateDefWithContext = Omit<
  CMMachineDefOrStateDef,
  'context'
> & { context: CMGenericContext }

export type CMStateMeta = {
  submachine?: string
  map?: CMSubmachineMap
}

export type CMSubmachineMap = {
  actions?: Record<string, string>
  context?: {
    inputs?: CMFieldMap
    outputs?: CMFieldMap
  }
}

export type CMSubmachineMapWithInputs = {
  actions?: Record<string, string>
  context: {
    inputs: CMFieldMap
    outputs?: CMFieldMap
  }
}

export type CMTransition =
  | CMTransitionTarget
  | SingleOrArray<CMTransitionConfig>


export type CMTransitionConfig = {
  actions?: CMActions
  target?: CMTransitionTarget
}

export type CMTransitionElement = string | CMTransitionConfig

// Define type that is narrower than corresponding xstate type
// Targets must be strings, no inline machine definitions
export type CMTransitionTarget = string

export type StringOrStrArray = string | string[]

export type XstateEvent = {
  data?: Record<string, any>
}

// ======================================================
// Type guards
// ======================================================

// basic types
export const tgIsArray = (val: any): val is Array<any> => Boolean(isArray(val))
export const tgIsFunction = (val: any): val is Function =>
  Boolean(isFunction(val))
export const tgIsString = (val: any): val is String => Boolean(isString(val))
export const tgIsUndefined = (val: any): val is undefined =>
  Boolean(isUndefined(val))

// machine schema types

export const tgFieldHasDefault = (
  val: CMContextFieldDef
): val is CMContextFieldDefWithDefault => Boolean(objHasKey('default', val))
export const tgFieldHasInitial = (
  val: CMContextFieldDef
): val is CMContextFieldDefWithInitial => Boolean(objHasKey('initial', val))

export const tgMapHasInputs = (
  val: CMSubmachineMap
): val is CMSubmachineMapWithInputs =>
  Boolean(objHasKey('context', val) && objHasKey('inputs', val.context))

export const tgStateHasAfter = (
  val: CMMachineDefOrStateDef
): val is { after: Record<string, CMTransition> } =>
  Boolean(objHasKey('after', val))
export const tgStateHasContext = (
  val: CMMachineDefOrStateDef
): val is CMMachineDefOrStateDefWithContext =>
  Boolean(objHasKey('context', val))
export const tgStateHasEntry = (
  val: CMMachineDefOrStateDef
): val is { entry: CMActions } => Boolean(objHasKey('entry', val))
export const tgStateHasExit = (
  val: CMMachineDefOrStateDef
): val is { exit: CMActions } => Boolean(objHasKey('exit', val))
export const tgStateHasInvoke = (
  val: CMMachineDefOrStateDef
): val is { invoke: CMInvokeConfig } => Boolean(objHasKey('invoke', val))
export const tgStateHasOn = (
  val: CMMachineDefOrStateDef
): val is { on: Record<string, CMTransition> } => Boolean(objHasKey('on', val))
export const tgStateHasOnDone = (
  val: CMMachineDefOrStateDef
): val is { onDone: CMTransition } => Boolean(objHasKey('onDone', val))
export const tgStateHasStates = (
  val: CMMachineDefOrStateDef
): val is { states: Record<string, CMMachineDefOrStateDef> } =>
  Boolean(objHasKey('states', val))

export const tgTransHasActions = (
  val: CMTransitionElement
): val is { actions: CMActions } => Boolean(objHasKey('actions', val))
