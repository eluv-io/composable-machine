import {CreateMaster} from './CreateMaster';
import {tgStateHasContext} from "../../src/types";

const m = new CreateMaster()
const def = m.def()
// const conf = m.conf()
// console.log(JSON.stringify(def,null,2))
if (tgStateHasContext(def)) {
  console.log(def.context['CreatingMaster.metadata'](def.context))
}
