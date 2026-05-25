import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"

let integration: IntrospectionAISDKIntegration | undefined

function introspectionIntegration() {
  if (!process.env.INTROSPECTION_TOKEN) return undefined
  integration ??= new IntrospectionAISDKIntegration({ serviceName: "opencode" })
  return integration
}

export function telemetryConfig(input: {
  enabled: boolean | undefined
  agentName: string
  conversationId: string
  tracer: unknown
  metadata: Record<string, unknown>
  providerName?: string
}) {
  const introspection = introspectionIntegration()
  return {
    isEnabled: input.enabled || Boolean(introspection),
    functionId: input.agentName,
    tracer: input.tracer,
    metadata: {
      ...input.metadata,
      "gen_ai.conversation.id": input.conversationId,
      ...(input.providerName ? { "gen_ai.provider.name": input.providerName } : {}),
    },
    ...(introspection ? { integrations: [introspection] } : {}),
  }
}
