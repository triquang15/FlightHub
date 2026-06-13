import * as React from "react"
import { jwtDecode } from "jwt-decode"
import { AUTH_TOKENS_CHANGED_EVENT, getAccessToken } from "@/utils/authStorage"

export const SESSION_WARNING_THRESHOLD_MS = 2 * 60 * 1000

export const getSessionRemainingTime = () => {
  const token = getAccessToken()
  if (!token) return null

  try {
    const { exp } = jwtDecode(token)
    return exp ? Math.max(0, exp * 1000 - Date.now()) : null
  } catch {
    return 0
  }
}

export const formatSessionRemainingTime = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.ceil((milliseconds || 0) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export const useSessionExpiry = () => {
  const [remainingTime, setRemainingTime] = React.useState(getSessionRemainingTime)

  React.useEffect(() => {
    const updateRemainingTime = () => setRemainingTime(getSessionRemainingTime())
    const intervalId = window.setInterval(updateRemainingTime, 1000)

    window.addEventListener(AUTH_TOKENS_CHANGED_EVENT, updateRemainingTime)
    window.addEventListener("storage", updateRemainingTime)
    document.addEventListener("visibilitychange", updateRemainingTime)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener(AUTH_TOKENS_CHANGED_EVENT, updateRemainingTime)
      window.removeEventListener("storage", updateRemainingTime)
      document.removeEventListener("visibilitychange", updateRemainingTime)
    }
  }, [])

  return {
    remainingTime,
    formattedRemainingTime: formatSessionRemainingTime(remainingTime),
    isExpiringSoon: remainingTime !== null && remainingTime <= SESSION_WARNING_THRESHOLD_MS,
  }
}
