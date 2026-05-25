import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"
import type { IntrospectionAISDKIntegrationOptions } from "@introspection-sdk/introspection-node"

class OpenCodeIntrospectionAISDKIntegration extends IntrospectionAISDKIntegration {
  constructor(options: IntrospectionAISDKIntegrationOptions) {
    super(options)

    const baseOnStart = this.onStart
    const baseOnStepStart = this.onStepStart
    const baseOnStepFinish = this.onStepFinish

    this.onStart = (event: unknown): void => {
      baseOnStart(event)
      this.setProviderName(event)
    }

    this.onStepStart = (event: unknown): void => {
      baseOnStepStart(event)
      this.setProviderName(event)
    }

    this.onStepFinish = (event: unknown): void => {
      this.setProviderName(event)
      baseOnStepFinish(event)
    }
  }

  private setProviderName(event: unknown) {
    const provider = ((event as Record<string, unknown>)?.model as { provider?: string } | undefined)?.provider
    if (!provider) return

    const generation = (this as any)._generation
    generation?.rootSpan?.setAttribute("gen_ai.provider.name", provider)

    const stepNumber = ((event as Record<string, unknown>)?.stepNumber as number | undefined) ?? 0
    generation?.stepSpans?.get(stepNumber)?.setAttribute("gen_ai.provider.name", provider)
  }
}

let integration: IntrospectionAISDKIntegration | undefined
let testAdvancedOptions: IntrospectionAISDKIntegrationOptions["advanced"] | undefined

export function setIntrospectionTestExporter(advanced: IntrospectionAISDKIntegrationOptions["advanced"] | undefined) {
  testAdvancedOptions = advanced
  integration = undefined
}

export function getIntrospectionAISDKIntegration(): IntrospectionAISDKIntegration | undefined {
  if (integration) return integration
  if (!process.env.INTROSPECTION_TOKEN && !testAdvancedOptions?.spanExporter) return undefined

  try {
    integration = new OpenCodeIntrospectionAISDKIntegration({
      serviceName: process.env.INTROSPECTION_SERVICE_NAME ?? "opencode",
      advanced: testAdvancedOptions,
    })
    return integration
  } catch {
    return undefined
  }
}
