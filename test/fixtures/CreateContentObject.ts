import { ComposableMachine } from '../../src/ComposableMachine'
import {
  CMActionFunction,
  CMContextFieldDef,
  CMMachineDefOrStateDef, CMServiceFunction,
  XstateEvent
} from "../../src/types"

export class CreateContentObject extends ComposableMachine {
  act_SaveDraftInfo(): CMActionFunction {
    return this.localAssign({
      writeToken: (_: object, event: XstateEvent) => event.data?.writeToken,
      objectId: (_: object, event: XstateEvent) => event.data?.objectId,
      nodeUrl: (_: object, event: XstateEvent) => event.data?.nodeUrl
    })
  }

  defActions(): Record<string, CMActionFunction> {
    return {
      act_saveDraftInfo: this.act_SaveDraftInfo()
    }
  }

  defContext(): Record<string, CMContextFieldDef> {
    return {
      contentType: {
        desc: 'Content type to use for new object',
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
        desc: 'Library ID for new object',
        input: true,
        required: true,
        type: String
      },
      metadata: {
        default: {},
        desc: 'Metadata for new object',
        input: true,
        required: false,
        type: Object
      },
      nodeUrl: {
        desc: 'URL for node that generated write token',
        type: String
      },
      objectId: {
        desc: 'Object ID returned by server',
        type: String
      },
      writeToken: {
        desc: 'Write token returned by server',
        type: String
      }
    }
  }

  defMachine(): CMMachineDefOrStateDef {
    // createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOgGEAnMdAFwKgHkAjAKzExoGIIB7QkggDceAazAlMVWmGZsOAbQAMAXUSgADj1i46fNSAAeiAOwBmEqYBsAJmuWAjJYCsigCwBOU08sAaEAE9EAFpXSwtXe3dLKIAOay8nd3cnAF8UvzQsPEJSSmo6fEZWdi4wCgoeChJ1ABtaADNK1AkpGhlihRV9TW1dfH0jBFNFaxJ3Y2jTeydp40UY+z9AhBDFEg8na1dXKbtjGJivNIyMHAJiElkSvOkAUXLKyE4AJVuAFWeATSVVJBAenS4PR-QYzUbuew7ewxGwxdx2RYBYLuVwkBb2WzOeZOBY7Y4gTJnHIkZ7UCD+N48G5tK4cTgAZTeAEFnm8ft0tIDgaBBkkSIp3HDFJZjDjTO55ktgvF3BZLPK5qLTGYRml0iB8DwIHB9ITssQOb0gf0QYhrE45ZjHC4PF5nFKVuLzJYRpZlVE3Iopvi9edcq16LSaIauSaeYgoiQZklIt5bBE3Q6go5ZS7oS7kpYhZYfad9aQg9TICG+gNEDFUa5hW7jKFXE4pvZjA7zWNtpE7BWhaFjLmsn7Lh0aEX7hUqBAS8ay0NlSRrBjFBNYvsvc2kQgtnPbPZ7FNXKL516c+rfcTSehyZSi0HJ9zDIh7IoLdEPTZIQ2d2vlkFhmFH3YnCrYwtjiZI1RSIA */
    return {
      states: {
        CreatingObject: {
          invoke: {
            src: 'svc_CreateContentObject',
            onDone: [
              {
                target: 'ObjectCreated',
                actions: [
                  'act_SaveDraftInfo',
                  '_act_SaveSuccessToContext',
                  '_act_NotifySuccess'
                ]
              }
            ],
            onError: [
              {
                target: 'ObjectCreateErrored',
                actions: ['_act_SaveErrorToContext', '_act_NotifyError']
              }
            ]
          }
        },

        ObjectCreated: {
          type: 'final',
          entry: '_act_LogArgs'
        },

        ObjectCreateErrored: {
          on: {
            RETRY: { target: 'CreatingObject' }
          }
        },

        ReadyToCreateObject: {
          on: {
            START: { target: 'CreatingObject' }
          }
        }
      },

      initial: 'ReadyToCreateObject'
    }
    // )
  }

  defServices(): Record<string, CMServiceFunction> {
    return {
      svc_CreateContentObject: this.svc_CreateContentObject
    }
  }

  defSuccessMessage(): string {
    return 'Draft created.'
  }

  async svc_CreateContentObject(context: Record<string, any>) {
    const elvClient = this.localContext(context, 'elvClient')
    const libraryId = this.localContext(context, 'libraryId')
    const type = this.localContext(context, 'contentType')
    const metadata = this.localContext(context, 'metadata')
    if (libraryId === undefined || libraryId === '')
      throw Error(`${this.notificationPrefix()}Library ID is required`)
    if (elvClient === undefined)
      throw Error(`${this.notificationPrefix()}ElvClient not supplied`)
    return await elvClient.CreateContentObject({
      libraryId,
      options: {
        type,
        meta: metadata
      }
    })
  }
}
