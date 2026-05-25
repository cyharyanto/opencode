import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"
import type { IntrospectionAISDKIntegrationOptions } from "@introspection-sdk/introspection-node"

let integration: IntrospectionAISDKIntegration | undefined
let configured: IntrospectionAISDKIntegrationOptions = {}
let shutdownPromise: Promise<void> | undefined

type TelemetryOptions = {
  agentName: string
  conversationID: string
  metadata?: Record<string, unknown>
  tracer?: unknown
}

const hasCredentials = (options: IntrospectionAISDKIntegrationOptions = {}) =>
  !!options.token || !!process.env.INTROSPECTION_TOKEN || !!options.advanced?.spanExporter

const integrationOptions = (options: IntrospectionAISDKIntegrationOptions = {}): IntrospectionAISDKIntegrationOptions => ({
  serviceName: "opencode",
  baseUrl: process.env.INTROSPECTION_BASE_URL,
  ...configured,
  ...options,
  advanced: {
    ...configured.advanced,
    ...options.advanced,
  },
})

export const IntrospectionInstrumentation = {
  configure(options: IntrospectionAISDKIntegrationOptions = {}) {
    if (integration) throw new Error("Introspection instrumentation must be configured before first use")
    configured = options
  },

  isEnabled(options: IntrospectionAISDKIntegrationOptions = {}) {
    return hasCredentials(integrationOptions(options))
  },

  integrations(options: IntrospectionAISDKIntegrationOptions = {}) {
    const resolved = integrationOptions(options)
    if (!this.isEnabled(resolved)) return []
    integration ??= new IntrospectionAISDKIntegration(resolved)
    return [integration]
  },

  telemetry(options: TelemetryOptions) {
    const integrations = this.integrations()
    if (integrations.length === 0 && !options.tracer) return undefined

    return {
      isEnabled: true,
      functionId: options.agentName,
      tracer: options.tracer,
      integrations,
      metadata: {
        ...options.metadata,
        "gen_ai.conversation.id": options.conversationID,
        "gen_ai.agent.name": options.agentName,
      },
    }
  },

  async forceFlush() {
    await integration?.forceFlush()
  },

  async shutdown() {
    if (!integration) return
    shutdownPromise ??= integration.shutdown().finally(() => {
      integration = undefined
      shutdownPromise = undefined
    })
    await shutdownPromise
  },
}
