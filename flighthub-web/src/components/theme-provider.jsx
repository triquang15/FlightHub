import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import api from "@/utils/api"

const themePreferences = ["SYSTEM", "LIGHT", "DARK"]

const initialState = {
  preference: "SYSTEM",
  theme: "light",
  isSaving: false,
  syncError: null,
  isAccountSynced: false,
  setThemePreference: () => null,
}

const ThemeProviderContext = createContext(initialState)

const normalizePreference = (value, fallback = "SYSTEM") => {
  const normalized = String(value || "").toUpperCase()
  return themePreferences.includes(normalized) ? normalized : fallback
}

const resolveTheme = (preference) => {
  if (preference === "SYSTEM") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }

  return preference.toLowerCase()
}

const applyTheme = (theme) => {
  const root = window.document.documentElement

  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.setAttribute("data-theme", theme)
}

export function ThemeProvider({
  children,
  defaultTheme = "SYSTEM",
  storageKey = "airline-ui-theme",
  ...props
}) {
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [preference, setPreference] = useState(() =>
    normalizePreference(localStorage.getItem(storageKey), defaultTheme)
  )
  const [systemTheme, setSystemTheme] = useState(() => resolveTheme("SYSTEM"))
  const [isSaving, setIsSaving] = useState(false)
  const [syncError, setSyncError] = useState(null)
  const saveQueueRef = useRef(Promise.resolve())
  const pendingSavesRef = useRef(0)
  const theme = preference === "SYSTEM" ? systemTheme : preference.toLowerCase()

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    if (preference !== "SYSTEM") return undefined

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = () => {
      setSystemTheme(resolveTheme("SYSTEM"))
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange)
  }, [preference])

  useEffect(() => {
    let ignore = false

    if (!isAuthenticated || !user?.id) return undefined

    const loadPreferences = async () => {
      try {
        const response = await api.get("/api/users/preferences")
        if (!ignore) {
          const serverPreference = normalizePreference(response.data?.data?.theme, defaultTheme)
          localStorage.setItem(storageKey, serverPreference)
          setPreference(serverPreference)
          setSyncError(null)
        }
      } catch {
        if (!ignore) {
          setSyncError("Unable to load account preference")
        }
      }
    }

    loadPreferences()

    return () => {
      ignore = true
    }
  }, [defaultTheme, isAuthenticated, storageKey, user?.id])

  const setThemePreference = useCallback(async (nextPreference) => {
    const normalized = normalizePreference(nextPreference, defaultTheme)

    localStorage.setItem(storageKey, normalized)
    setPreference(normalized)
    setSyncError(null)

    if (!isAuthenticated || !user?.id) return

    pendingSavesRef.current += 1
    setIsSaving(true)

    const saveRequest = saveQueueRef.current
      .catch(() => undefined)
      .then(() => api.patch("/api/users/preferences", { theme: normalized }))

    saveQueueRef.current = saveRequest

    try {
      await saveRequest
      setSyncError(null)
    } catch {
      setSyncError("Unable to save account preference")
    } finally {
      pendingSavesRef.current -= 1
      if (pendingSavesRef.current === 0) {
        setIsSaving(false)
      }
    }
  }, [defaultTheme, isAuthenticated, storageKey, user?.id])

  const value = useMemo(() => ({
    preference,
    theme,
    isSaving,
    syncError,
    isAccountSynced: Boolean(isAuthenticated && user?.id),
    setThemePreference,
  }), [isAuthenticated, isSaving, preference, setThemePreference, syncError, theme, user?.id])

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeProviderContext)
