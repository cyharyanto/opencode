import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"

let aiSDKIntegration: IntrospectionAISDKIntegration | undefined

export function introspectionAIEnabled() {
  return !!process.env.INTROSPECTION_TOKEN
}

export function introspectionAISDKIntegrations() {
  if (!introspectionAIEnabled()) return []
  aiSDKIntegration ??= new IntrospectionAISDKIntegration({
    serviceName: "opencode",
  })
  return [aiSDKIntegration]
}

// SDK gap: @introspection-sdk/introspection-node@0.4.2 emits the provider as
// the legacy `gen_ai.system` attribute from inside its private exporter setup.
// Keep the workaround isolated here: once the SDK emits `gen_ai.provider.name`,
// the session and agent call sites do not need to change.
export const INTROSPECTION_PROVIDER_ATTRIBUTE_FOLLOWUP = {
  legacy: "gen_ai.system",
  preferred: "gen_ai.provider.name",
} as const
