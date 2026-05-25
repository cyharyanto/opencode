import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"
import type { IntrospectionAISDKIntegrationOptions } from "@introspection-sdk/introspection-node"

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
    integration = new IntrospectionAISDKIntegration({
      serviceName: process.env.INTROSPECTION_SERVICE_NAME ?? "opencode",
      advanced: testAdvancedOptions,
    })
    return integration
  } catch {
    return undefined
  }
}
