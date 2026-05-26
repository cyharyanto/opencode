import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"
import { registerTelemetryIntegration, type TelemetryIntegration } from "ai"

type StepEvent = {
  model?: {
    provider?: string
  }
  metadata?: Record<string, unknown>
  stepNumber?: number
}

type IntrospectionIntegration = IntrospectionAISDKIntegration & TelemetryIntegration

let integration: IntrospectionIntegration | undefined
let registered = false
let enabled = false

export function registerIntrospectionAISDKTelemetry() {
  if (registered) return enabled
  registered = true

  if (!process.env.INTROSPECTION_TOKEN) return false

  integration = withConversationGate(
    withProviderNameShim(
      new IntrospectionAISDKIntegration({
        serviceName: "opencode",
      }) as IntrospectionIntegration,
    ),
  )
  registerTelemetryIntegration(integration)
  enabled = true
  return true
}

export function isIntrospectionEnabled() {
  return enabled
}

export async function forceFlushIntrospectionTelemetry() {
  await integration?.forceFlush()
}

export async function shutdownIntrospectionTelemetry() {
  await integration?.shutdown()
}

function withConversationGate<T extends IntrospectionIntegration>(delegate: T): T {
  const wrapped = delegate as T & Required<TelemetryIntegration>
  const onStart = delegate.onStart?.bind(delegate)
  const onStepStart = delegate.onStepStart?.bind(delegate)
  const onToolCallStart = delegate.onToolCallStart?.bind(delegate)
  const onToolCallFinish = delegate.onToolCallFinish?.bind(delegate)
  const onStepFinish = delegate.onStepFinish?.bind(delegate)
  const onFinish = delegate.onFinish?.bind(delegate)

  wrapped.onStart = (event) => {
    if (!hasConversationID(event)) return
    onStart?.(event)
  }
  wrapped.onStepStart = (event) => {
    if (!hasConversationID(event)) return
    onStepStart?.(event)
  }
  wrapped.onToolCallStart = (event) => {
    if (!hasConversationID(event)) return
    onToolCallStart?.(event)
  }
  wrapped.onToolCallFinish = (event) => {
    if (!hasConversationID(event)) return
    onToolCallFinish?.(event)
  }
  wrapped.onStepFinish = (event) => {
    if (!hasConversationID(event)) return
    onStepFinish?.(event)
  }
  wrapped.onFinish = (event) => {
    if (!hasConversationID(event)) return
    onFinish?.(event)
  }

  return wrapped
}

function hasConversationID(event: unknown) {
  const conversationID = (event as StepEvent | undefined)?.metadata?.["gen_ai.conversation.id"]
  return typeof conversationID === "string" && conversationID.length > 0
}

function withProviderNameShim<T extends IntrospectionIntegration>(delegate: T): T {
  const wrapped = delegate as T & {
    _generation?: {
      rootSpan?: {
        setAttribute(name: string, value: string): void
      }
      stepSpans?: Map<unknown, { setAttribute(name: string, value: string): void }>
    }
  }
  const onStart = delegate.onStart?.bind(delegate)
  const onStepStart = delegate.onStepStart?.bind(delegate)
  const onStepFinish = delegate.onStepFinish?.bind(delegate)

  wrapped.onStart = (event) => {
    onStart?.(event)
    const provider = providerName(event)
    if (provider) wrapped._generation?.rootSpan?.setAttribute("gen_ai.provider.name", provider)
  }

  wrapped.onStepStart = (event) => {
    onStepStart?.(event)
    setCurrentStepProvider(wrapped, event)
  }

  wrapped.onStepFinish = (event) => {
    setCurrentStepProvider(wrapped, event)
    onStepFinish?.(event)
  }

  return wrapped
}

function setCurrentStepProvider(
  integration: IntrospectionIntegration & {
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
  const provider = e?.model?.provider ?? e?.metadata?.["gen_ai.provider.name"] ?? e?.metadata?.["gen_ai.system"]
  return typeof provider === "string" && provider.length > 0 ? provider : undefined
}
