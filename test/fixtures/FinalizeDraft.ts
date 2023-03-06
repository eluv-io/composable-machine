import {ComposableMachine} from '../../src/ComposableMachine'
import {TContextFieldDef, TMachineDefOrStateDef, TxstateEvent} from '../../src/types'

export class FinalizeDraft extends ComposableMachine {

  act_SaveVersionInfo(): Function {
    return this.localAssign({
      versionHash: (_: object, event: TxstateEvent) => event.data?.hash
    })
  }

  defActions(): Record<string, Function> {
    return {
      act_SaveVersionInfo: this.act_SaveVersionInfo()
    }
  }

  defContext(): Record<string, TContextFieldDef> {
    return {
      commitMessage: {
        default: 'Finalize draft',
        desc: 'Commit message',
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
      libraryId: {
        desc: 'Library ID for object',
        input: true,
        required: true,
        type: String
      },
      nodeUrl: {
        desc: 'URL for node that generated write token',
        input: true,
        type: String
      },
      objectId: {
        desc: 'Object ID for write token',
        input: true,
        required: true,
        type: String
      },
      versionHash: {
        desc: 'Version hash after finalization',
        type: String
      },
      writeToken: {
        desc: 'Write token of draft to finalize',
        input: true,
        required: true,
        type: String
      }
    }
  }

  defMachine(): TMachineDefOrStateDef {
    return {
      states: {
        FinalizingDraft: {
          invoke: {
            src: 'svc_FinalizeContentObject',
            onDone: [
              {
                target: 'DraftFinalized',
                actions: ['act_SaveVersionInfo', '_act_SaveSuccessToContext', '_act_NotifySuccess']
              }
            ],
            onError: [
              {
                target: 'DraftFinalizeErrored',
                actions: ['_act_SaveErrorToContext', '_act_NotifyError']
              }
            ]
          }
        },

        DraftFinalized: {
          type: 'final',
          entry: '_act_LogArgs'
        },

        DraftFinalizeErrored: {
          on: {
            RETRY: {target: 'FinalizingDraft'}
          }
        },

        ReadyToFinalizeDraft: {
          on: {
            START: {target: 'FinalizingDraft'}
          }
        }
      },

      initial: 'ReadyToFinalizeDraft'
    }
  }

  defServices(): Record<string, Function> {
    return {
      svc_FinalizeContentObject: this.svc_FinalizeContentObject
    }
  }

  defSuccessMessage(): string {
    return 'Draft finalized.'
  }

  async svc_FinalizeContentObject(context: Record<string, any>) {
    const elvClient = this.localContext(context, 'elvClient')
    const libraryId = this.localContext(context, 'libraryId')
    const objectId = this.localContext(context, 'objectId')
    const writeToken = this.localContext(context, 'writeToken')
    const commitMessage = this.localContext(context, 'commitMessage')

    if (elvClient === undefined) throw Error('ElvClient not supplied')
    if (libraryId === undefined || libraryId === '') throw Error('Library ID is required')
    if (objectId === undefined || objectId === '') throw Error('Object ID is required')
    if (writeToken === undefined || writeToken === '') throw Error('Write token is required')

    return await elvClient.FinalizeContentObject({
      libraryId,
      objectId,
      writeToken,
      commitMessage
    })
  }
}
