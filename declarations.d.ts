/// <reference lib='dom' />

declare interface TPair {
  fst(): any;
  snd(): any;
}

declare interface TNotifier {
  error(message: string): any;
  info(message: string): any;
  success(message: string): any;
  warning(message: string): any;
}

declare module '@eluvio/elv-js-helpers/Functional/clone' {
  function clone<Type>(x: Type): Type

  export = clone
}

declare module '@eluvio/elv-js-helpers/Functional/filterKV' {
  function filterKV<Type>(fn: Function, x: Type): Type

  export = filterKV
}

declare module '@eluvio/elv-js-helpers/Functional/getPath' {
  function getPath(pathArray: (string | number)[], object: object): object

  export = getPath
}

declare module '@eluvio/elv-js-helpers/Boolean/isArray' {
  function isArray(x: any): Boolean

  export = isArray
}

declare module '@eluvio/elv-js-helpers/Boolean/isEmpty' {
  function isEmpty(x: any): Boolean

  export = isEmpty
}

declare module '@eluvio/elv-js-helpers/Boolean/isFunction' {
  function isFunction(x: any): Boolean

  export = isFunction
}

declare module '@eluvio/elv-js-helpers/Boolean/isObject' {
  function isObject(x: any): Boolean

  export = isObject
}

declare module '@eluvio/elv-js-helpers/Boolean/isUndefined' {
  function isUndefined(x: any): Boolean

  export = isUndefined
}

declare module '@eluvio/elv-js-helpers/Functional/mapObjKeys' {
  // uncurried
  function mapObjKeys<TFnInput, TFnOutput>(fn:(f: TFnInput)=>TFnOutput, o: Record<string, TFnInput>): Record<string, TFnOutput>
  // curried: pass 1 arg, then 1
  function mapObjKeys<TFnInput, TFnOutput>(fn:(f: TFnInput)=>TFnOutput): (o: Record<string, TFnInput>) => Record<string, TFnOutput>

  export = mapObjKeys
}

declare module '@eluvio/elv-js-helpers/Functional/mapObjValues' {
  // uncurried
  function mapObjValues<TFnInput, TFnOutput>(fn:(f: TFnInput)=>TFnOutput, o: Record<string, TFnInput>): Record<string, TFnOutput>
  // curried: pass 1 arg, then 1
  function mapObjValues<TFnInput, TFnOutput>(fn:(f: TFnInput)=>TFnOutput): (o: Record<string, TFnInput>) => Record<string, TFnOutput>

  export = mapObjValues
}

declare module '@eluvio/elv-js-helpers/Functional/mergeDeepRight' {
  function mergeDeepRight(originalObj: object, updates: object): object
  function mergeDeepRight(originalObj: object): (updates: object) => object

  export = mergeDeepRight
}

declare module '@eluvio/elv-js-helpers/Functional/mergeRight' {
  function mergeRight<Type1, Type2>(a: Type1, b: Type2): Type1 | Type2

  export = mergeRight
}

declare module '@eluvio/elv-js-helpers/Boolean/objHasKey' {
  // uncurried
  function objHasKey(key:string, x: any): Boolean
  // curried: pass 1 arg, then 1
  function objHasKey(key:string): (x: any) => Boolean

  export = objHasKey
}

declare module '@eluvio/elv-js-helpers/Functional/setPath' {
  // uncurried
  function setPath(pathArray: (string | number)[], value: any, obj: object): object
  // curry: pass 1 arg, then 2
  function setPath(pathArray: (string | number)[]): (value: any, obj: object) => object
  // curry: pass 2 args, then 1
  function setPath(pathArray: (string | number)[], value: any): (obj: object) => object
  // curry: pass 1 arg, then 1, then 1
  function setPath(pathArray: (string | number)[]): (value: any) => (obj: object) => object

  export = setPath
}

declare module '@eluvio/elv-js-helpers/Functional/T' {
  function T(): true

  export = T
}

declare module '@eluvio/elv-js-helpers/Misc/uuid' {
  function uuid(): string

  export = uuid
}
