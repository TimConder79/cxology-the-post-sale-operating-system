import { useState, useCallback, useEffect } from 'react'
import type { GenStep } from '@/lib/aiService'
import { sleep } from '@/lib/aiService'

export type GenState = 'idle' | 'generating' | 'done'

export interface UseAiGenerationResult {
  state: GenState
  stepIndex: number      // -1 = not started
  stepLabel: string
  trigger: () => void
  reset: () => void
}

export function useAiGeneration(
  steps: GenStep[],
  opts?: { autoTrigger?: boolean; onComplete?: () => void }
): UseAiGenerationResult {
  const [state, setState] = useState<GenState>('idle')
  const [stepIndex, setStepIndex] = useState(-1)
  const [stepLabel, setStepLabel] = useState('')

  const run = useCallback(async () => {
    setState('generating')
    setStepIndex(0)
    for (let i = 0; i < steps.length; i++) {
      setStepIndex(i)
      setStepLabel(steps[i].label)
      await sleep(steps[i].ms)
    }
    setState('done')
    opts?.onComplete?.()
  }, [steps, opts])

  const trigger = useCallback(() => {
    if (state === 'idle') run()
  }, [state, run])

  const reset = useCallback(() => {
    setState('idle')
    setStepIndex(-1)
    setStepLabel('')
  }, [])

  // Auto-trigger on mount if requested
  useEffect(() => {
    if (opts?.autoTrigger && state === 'idle') {
      const t = setTimeout(() => run(), 300)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { state, stepIndex, stepLabel, trigger, reset }
}
