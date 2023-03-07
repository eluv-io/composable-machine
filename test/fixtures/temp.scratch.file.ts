import { createMachine } from 'xstate'

import { CreateMaster } from './CreateMaster'
import { tgStateHasContext } from '../../src/types'

const m = new CreateMaster()
const def = m.def()
const conf = m.conf()

if (tgStateHasContext(def)) {
  console.log(def.context['CreatingMaster.metadata'](def.context))
}

const M = createMachine(def, conf)
console.log(M)
