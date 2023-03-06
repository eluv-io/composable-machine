import {ComposableMachine, IComposableMachineClass} from '../../src/ComposableMachine';
import {CreateContentObject} from './CreateContentObject';
import {FinalizeDraft} from './FinalizeDraft';
import {TContextFieldDef, TMachineDefOrStateDef} from '../../src/types';

export class CreateMaster extends ComposableMachine {

  act_BuildMetadata(): Function {
    const self = this
    return this.localAssign({
      masterMetadata: (context: object) => ({
        public: {name: self.localContext(context, 'name')}
      })
    })
  }

  defActions(): Record<string, Function> {
    return {
      act_BuildMetadata: this.act_BuildMetadata()
    }
  }

  defContext(): Record<string, TContextFieldDef> {
    return {
      commitMessage: {
        default: 'Create master',
        desc: 'Function to return initialized ElvClient or FrameClient instance',
        input: true,
        type: String
      },
      elvClient: {
        desc: 'Function to return initialized ElvClient or FrameClient instance',
        input: true,
        required: true,
        type: Function,
        unserializable: true
      },
      masterLib: {
        desc: 'Library ID for new object',
        input: true,
        required: true,
        type: String
      },
      masterObjectId: {
        desc: 'New master\'s Object ID',
        type: String
      },
      masterVersionHash: {
        desc: 'New master\'s Version Hash',
        type: String
      },
      masterType: {
        desc: 'Content type to use for master',
        input: true,
        type: String
      },
      masterWriteToken: {
        desc: 'Write token of in-progress master',
        type: String
      },
      masterMetadata: {
        default: {public:{name: 'Production Master'}},
        desc: 'Metadata to feed to master',
        type: Object
      },
      name: {
        desc: 'Metadata for new object',
        input: true,
        required: true,
        type: String
      }
    }
  }

  defImportedMachines(): Record<string, IComposableMachineClass> {
    return {
      CreateContentObject,
      FinalizeDraft
    }
  }

  defMachine(): TMachineDefOrStateDef {
    return {
      entry: 'act_BuildMetadata',
      states: {
        CreatingMaster: {
          meta: {
            map: {
              context: {
                inputs: {
                  contentType: 'masterType',
                  elvClient: 'elvClient',
                  libraryId: 'masterLib',
                  metadata: 'masterMetadata'
                },
                outputs: {
                  masterObjectId: 'objectId'
                }
              }
            },
            submachine: 'CreateContentObject'
          },
          onDone: {
            target: 'FinalizingMaster'
          }
        },

        FinalizingMaster: {
          meta: {
            map: {
              context: {
                inputs: {
                  commitMessage: 'commitMessage',
                  elvClient: 'elvClient',
                  libraryId: 'masterLib',
                  objectId: 'masterObjectId',
                  writeToken: 'masterWriteToken'
                },
                outputs: {
                  masterVersionHash: 'versionHash'
                }
              }
            },
            submachine: 'FinalizeDraft'
          },
          onDone: {
            target: 'MasterCreated'
          }
        },

        MasterCreated: {
          type: 'final',
          entry: '_act_LogArgs'
        },

        ReadyToCreateMaster: {
          on: {
            START: {target: 'CreatingMaster'}
          }
        }
      },

      initial: 'ReadyToCreateMaster'
    }
  }

  defSuccessMessage(): string {
    return 'Master created and finalized.'
  }

}
