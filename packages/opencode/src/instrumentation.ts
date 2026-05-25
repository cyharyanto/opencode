import { IntrospectionAISDKIntegration } from "@introspection-sdk/introspection-node"

let aiSDKIntegration: IntrospectionAISDKIntegration | undefined

const LEGACY_PROVIDER_ATTRIBUTE = "gen_ai.system"
const PROVIDER_NAME_ATTRIBUTE = "gen_ai.provider.name"

export function introspectionAIEnabled() {
  return !!process.env.INTROSPECTION_TOKEN
}

export function introspectionAISDKIntegrations() {
  if (!introspectionAIEnabled()) return []
  aiSDKIntegration ??= withProviderNameShim(
    new IntrospectionAISDKIntegration({
      serviceName: "opencode",
    }),
  )
  return [aiSDKIntegration]
}

function withProviderNameShim(integration: IntrospectionAISDKIntegration) {
  // SDK gap: @introspection-sdk/introspection-node@0.4.2 emits the provider as
  // the legacy `gen_ai.system` attribute but the platform contract expects
  // `gen_ai.provider.name`. Keep the workaround isolated to this integration
  // module by copying the value onto the SDK-created spans before export.
  const shimmed = integration as IntrospectionAISDKIntegration & {
    _generation?: {
      rootSpan?: ProviderShimSpan
      stepSpans?: Map<number, ProviderShimSpan>
    } | null
    onStart: (event: unknown) => void
    onStepStart: (event: unknown) => void
    onStepFinish: (event: unknown) => void
  }

  const onStart = shimmed.onStart
  shimmed.onStart = (event: unknown) => {
    onStart.call(shimmed, event)
    copyProviderName(shimmed._generation?.rootSpan)
  }

  const onStepStart = shimmed.onStepStart
  shimmed.onStepStart = (event: unknown) => {
    onStepStart.call(shimmed, event)
    const stepNumber =
      (event as { stepNumber?: number } | undefined)?.stepNumber ?? 0
    copyProviderName(shimmed._generation?.stepSpans?.get(stepNumber))
  }

  const onStepFinish = shimmed.onStepFinish
  shimmed.onStepFinish = (event: unknown) => {
    const stepNumber =
      (event as { stepNumber?: number } | undefined)?.stepNumber ?? 0
    const stepSpan = shimmed._generation?.stepSpans?.get(stepNumber)
    const provider = (event as { model?: { provider?: unknown } } | undefined)?.model
      ?.provider
    if (typeof provider === "string") {
      stepSpan?.setAttribute(PROVIDER_NAME_ATTRIBUTE, provider)
    } else copyProviderName(stepSpan)
    onStepFinish.call(shimmed, event)
  }

  return shimmed
}

type ProviderShimSpan = {
  attributes?: Record<string, unknown>
  setAttribute: (key: string, value: string) => unknown
}

function copyProviderName(span: ProviderShimSpan | undefined) {
  if (!span) return
  if (span.attributes?.[PROVIDER_NAME_ATTRIBUTE] != null) return
  const provider = span.attributes?.[LEGACY_PROVIDER_ATTRIBUTE]
  if (typeof provider === "string") span.setAttribute(PROVIDER_NAME_ATTRIBUTE, provider)
}
