import isArray from "@eluvio/elv-js-helpers/Boolean/isArray";
import isFunction from "@eluvio/elv-js-helpers/Boolean/isFunction";
import isUndefined from "@eluvio/elv-js-helpers/Boolean/isUndefined";
import objHasKey from "@eluvio/elv-js-helpers/Boolean/objHasKey";

export type TConf = {
  actions: Record<string, Function>,
  services: Record<string, Function>
}

export type TContextFieldDef = {
  default?: any,
  desc: string,
  input?: boolean,
  initial?: any,
  required?: boolean,
  type: Object,
  unserializable?: boolean
}

export type TContextFieldDefWithDefault = Omit<TContextFieldDef, 'default'> & {default: any}

export type TContextFieldDefWithInitial = Omit<TContextFieldDef, 'initial'> & {initial: any}

export type TFieldMap = Record<string, string>

export type TFoundSubmachine = {
  path: string[],
  submachine: string,
  map?: TSubmachineMap
}

export type TInvokeDef = {
  src: string,
  onDone: TTransitionSpecOrArray,
  onError: TTransitionSpecOrArray
}

export type TMachineDefOrStateDef = {
  after?: Record<string, TTransitionSpecOrArray>
  context?: Record<string, any>
  description?: string,
  devTools?: boolean,
  entry?: TStringOrStrArray,
  exit?: TStringOrStrArray,
  id?: string,
  initial?: string,
  invoke?: TInvokeDef,
  meta?: TStateMeta,
  on?: Record<string, TTransitionSpecOrArray>
  onDone?: TTransitionSpecOrArray,
  predictableActionArguments?: boolean,
  states?: Record<string, TMachineDefOrStateDef>,
  type?: "final" | "atomic" | "compound" | "parallel" | "history" | undefined
}

export type TMachineDefOrStateDefWithContext = Omit<TMachineDefOrStateDef, 'context'> & {context: Record<string, any>}

export type TStateMeta = {
  submachine?: string,
  map?: TSubmachineMap
}

export type TSubmachineMap = {
  actions?: Record<string, string>,
  context?: {
    inputs?: TFieldMap,
    outputs?: TFieldMap
  }
}

export type TSubmachineMapWithInputs = {
  actions?: Record<string, string>,
  context: {
    inputs: TFieldMap,
    outputs?: TFieldMap
  }
}

export type TTransitionSpec = {
  actions?: TStringOrStrArray,
  cond?: Function,
  target?: string
}

export type TTransitionSpecOrArray = TTransitionSpec | TTransitionSpec[]


// ======================================================
// Type guards
// ======================================================

// basic types
export const tgIsArray = (val: any): val is Array<any> => Boolean(isArray(val))
export const tgIsFunction = (val: any): val is Function => Boolean(isFunction(val))
export const tgIsUndefined = (val: any): val is undefined => Boolean(isUndefined(val))

// machine schema types

export const tgFieldHasDefault = (val: TContextFieldDef): val is TContextFieldDefWithInitial => Boolean(objHasKey('default', val))
export const tgFieldHasInitial = (val: TContextFieldDef): val is TContextFieldDefWithInitial => Boolean(objHasKey('initial', val))

export const tgMapHasInputs = (val: TSubmachineMap): val is TSubmachineMapWithInputs => Boolean(objHasKey('context', val) && objHasKey('inputs', val.context))

export const tgStateHasAfter = (val: TMachineDefOrStateDef): val is { after: Record<string, TTransitionSpecOrArray> } => Boolean(objHasKey('after', val))
export const tgStateHasContext = (val: TMachineDefOrStateDef): val is TMachineDefOrStateDefWithContext => Boolean(objHasKey('context', val))
export const tgStateHasEntry = (val: TMachineDefOrStateDef): val is { entry: TStringOrStrArray } => Boolean(objHasKey('entry', val))
export const tgStateHasExit = (val: TMachineDefOrStateDef): val is { exit: TStringOrStrArray } => Boolean(objHasKey('exit', val))
export const tgStateHasInvoke = (val: TMachineDefOrStateDef): val is { invoke: TInvokeDef } => Boolean(objHasKey('invoke', val))
export const tgStateHasOn = (val: TMachineDefOrStateDef): val is { on: Record<string, TTransitionSpecOrArray> } => Boolean(objHasKey('on', val))
export const tgStateHasOnDone = (val: TMachineDefOrStateDef): val is { onDone: TTransitionSpecOrArray } => Boolean(objHasKey('onDone', val))
export const tgStateHasStates = (val: TMachineDefOrStateDef): val is { states: Record<string, TMachineDefOrStateDef> } => Boolean(objHasKey('states', val))

export const tgTransHasActions = (val: TTransitionSpec): val is { actions: TStringOrStrArray } => Boolean(objHasKey('actions', val))

