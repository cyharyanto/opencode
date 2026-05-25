import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"
import type { IntrospectionAISDKIntegrationOptions } from "@introspection-sdk/introspection-node"

let integration: IntrospectionAISDKIntegration | undefined

const hasCredentials = (options: IntrospectionAISDKIntegrationOptions = {}) =>
  !!options.token || !!process.env.INTROSPECTION_TOKEN || !!options.advanced?.spanExporter

export const IntrospectionInstrumentation = {
  isEnabled(options: IntrospectionAISDKIntegrationOptions = {}) {
    return hasCredentials(options)
  },

  integrations(options: IntrospectionAISDKIntegrationOptions = {}) {
    if (!this.isEnabled(options)) return []
    integration ??= new IntrospectionAISDKIntegration({
      serviceName: "opencode",
      ...options,
    })
    return [integration]
  },

  async shutdown() {
    await integration?.shutdown()
    integration = undefined
  },
}
