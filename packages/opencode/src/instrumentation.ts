import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"

let aiSDKIntegration: IntrospectionAISDKIntegration | undefined

export function introspectionAISDKIntegration() {
  if (!process.env.INTROSPECTION_TOKEN) return undefined
  aiSDKIntegration ??= new IntrospectionAISDKIntegration({
    serviceName: process.env.INTROSPECTION_SERVICE_NAME ?? "opencode-agent",
  })
  return aiSDKIntegration
}
