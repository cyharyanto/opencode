import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"

let integration: IntrospectionAISDKIntegration | undefined
let initialized = false

export function getIntrospectionIntegration() {
  if (!process.env.INTROSPECTION_TOKEN) return undefined
  if (!initialized) {
    integration = new IntrospectionAISDKIntegration({ serviceName: "opencode" })
    initialized = true
  }
  return integration
}

export function telemetryConfig(input: {
  conversationId: string
  agentName: string
  enabled?: boolean
  tracer?: unknown
  metadata?: Record<string, unknown>
}) {
  const introspection = getIntrospectionIntegration()
  const integrations = introspection ? [introspection] : undefined

  return {
    isEnabled: Boolean(input.enabled || introspection),
    functionId: input.agentName,
    tracer: input.tracer,
    metadata: {
      ...input.metadata,
      "gen_ai.conversation.id": input.conversationId,
    },
    ...(integrations ? { integrations } : {}),
  }
}
