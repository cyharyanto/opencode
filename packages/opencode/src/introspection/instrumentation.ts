import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"

type TelemetryIntegration = IntrospectionAISDKIntegration

type StepEvent = {
  model?: {
    provider?: string
  }
  metadata?: Record<string, unknown>
  stepNumber?: number
}

let integration: TelemetryIntegration | undefined
let shutdownRegistered = false

export function introspectionIntegration() {
  if (!process.env.INTROSPECTION_TOKEN) return undefined
  if (!integration) {
    integration = withProviderNameShim(
      new IntrospectionAISDKIntegration({
        serviceName: "opencode",
      }),
    )
    registerShutdown(integration)
  }
  return integration
}

export function introspectionIntegrations() {
  const current = introspectionIntegration()
  return current ? [current] : []
}

export function isIntrospectionEnabled() {
  return introspectionIntegration() !== undefined
}

function withProviderNameShim<T extends TelemetryIntegration>(delegate: T): T {
  const wrapped = delegate as T & {
    _generation?: {
      rootSpan?: {
        setAttribute(name: string, value: string): void
      }
      stepSpans?: Map<unknown, { setAttribute(name: string, value: string): void }>
    }
  }
  const onStart = delegate.onStart.bind(delegate)
  const onStepStart = delegate.onStepStart.bind(delegate)
  const onStepFinish = delegate.onStepFinish.bind(delegate)

  wrapped.onStart = (event: unknown) => {
    onStart(event)
    const provider = providerName(event)
    if (provider) wrapped._generation?.rootSpan?.setAttribute("gen_ai.provider.name", provider)
  }

  wrapped.onStepStart = (event: unknown) => {
    onStepStart(event)
    setCurrentStepProvider(wrapped, event)
  }

  wrapped.onStepFinish = (event: unknown) => {
    setCurrentStepProvider(wrapped, event)
    onStepFinish(event)
  }

  return wrapped
}

function setCurrentStepProvider(
  integration: TelemetryIntegration & {
    _generation?: {
      stepSpans?: Map<unknown, { setAttribute(name: string, value: string): void }>
    }
  },
  event: unknown,
) {
  const provider = providerName(event)
  if (!provider) return
  const stepNumber = (event as StepEvent | undefined)?.stepNumber ?? 0
  integration._generation?.stepSpans?.get(stepNumber)?.setAttribute("gen_ai.provider.name", provider)
}

function providerName(event: unknown) {
  const e = event as StepEvent | undefined
  const provider = e?.model?.provider ?? e?.metadata?.["gen_ai.provider.name"]
  return typeof provider === "string" && provider.length > 0 ? provider : undefined
}

function registerShutdown(current: TelemetryIntegration) {
  if (shutdownRegistered) return
  shutdownRegistered = true

  const flush = () => {
    void current.forceFlush().catch(() => {})
  }
  const shutdown = () => {
    void current.shutdown().catch(() => {})
  }

  process.once("beforeExit", flush)
  process.once("exit", flush)
  process.once("SIGINT", () => {
    shutdown()
    process.exit(130)
  })
  process.once("SIGTERM", () => {
    shutdown()
    process.exit(143)
  })
}
