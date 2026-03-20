import { useMetrica } from 'next-yandex-metrica'
import { useCallback } from 'react'

export const useAnalytics = () => {
  const { reachGoal } = useMetrica()

  const triggerFormClick = useCallback(() => {
    return reachGoal('TRIGGER_FORM_CLICK')
  }, [reachGoal])

  const sendForm = useCallback(() => {
    return reachGoal('SEND_FORM')
  }, [reachGoal])

  return {
    triggerFormClick,
    sendForm,
  }
}
