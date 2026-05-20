import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"

let aiSDKIntegration: IntrospectionAISDKIntegration | undefined

export function introspectionAISDKIntegrations() {
  if (!process.env.INTROSPECTION_TOKEN) return []
  if (!aiSDKIntegration) {
    aiSDKIntegration = new IntrospectionAISDKIntegration({
      serviceName: "opencode",
    })
  }
  return [aiSDKIntegration]
}
