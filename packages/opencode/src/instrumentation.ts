import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"

let aiSDKIntegration: IntrospectionAISDKIntegration | undefined

let failed = false

export function introspectionAISDKIntegrations() {
  if (!process.env.INTROSPECTION_TOKEN || failed) return []
  if (!aiSDKIntegration) {
    try {
      aiSDKIntegration = new IntrospectionAISDKIntegration({ serviceName: "opencode" })
    } catch {
      failed = true
      return []
    }
  }
  return [aiSDKIntegration]
}
