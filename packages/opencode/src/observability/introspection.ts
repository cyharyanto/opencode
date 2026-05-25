import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"

let integration: IntrospectionAISDKIntegration | undefined

function introspectionIntegration() {
  if (!process.env.INTROSPECTION_TOKEN) return undefined
  // The Introspection AI SDK exporter reads INTROSPECTION_BASE_URL (or an
  // explicit SDK baseUrl), not OTEL_EXPORTER_OTLP_ENDPOINT. Fake-OTLP and
  // non-default deployments must route this integration through that env var.
  integration ??= new IntrospectionAISDKIntegration({ serviceName: "opencode" })
  return integration
}

export async function forceFlushIntrospectionTelemetry() {
  await integration?.forceFlush()
}

export async function shutdownIntrospectionTelemetry() {
  await integration?.shutdown()
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
