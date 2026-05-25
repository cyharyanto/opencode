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
