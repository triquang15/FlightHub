import * as React from "react"
import { Clock3, Loader2, LogOut, ShieldCheck } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { clearUserState } from "@/Redux/user/userSlice"
import { logoutLocal } from "@/Redux/auth/authSlice"
import {
  clearAuthTokens,
} from "@/utils/authStorage"
import { refreshAccessToken } from "@/utils/api"
import {
  SESSION_WARNING_THRESHOLD_MS,
  formatSessionRemainingTime,
  useSessionExpiry,
} from "@/components/auth/useSessionExpiry"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const SessionExpiryWarning = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const { remainingTime } = useSessionExpiry()
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const hasExpiredSession = React.useRef(false)
  const isAutoExtending = React.useRef(false)

  const endSession = React.useCallback((message) => {
    if (hasExpiredSession.current) return
    hasExpiredSession.current = true
    clearAuthTokens()
    dispatch(clearUserState())
    dispatch(logoutLocal())
    toast.info(message)
    navigate("/login", { replace: true })
  }, [dispatch, navigate])

  React.useEffect(() => {
    if (!isAuthenticated || remainingTime !== 0 || isAutoExtending.current) return

    isAutoExtending.current = true
    refreshAccessToken()
      .then(() => {
        hasExpiredSession.current = false
        toast.success("Session extended automatically")
      })
      .catch((error) => {
        console.error("Automatic session extension failed:", error)
        endSession("Your session expired. Please sign in again.")
      })
      .finally(() => {
        isAutoExtending.current = false
      })
  }, [endSession, isAuthenticated, remainingTime])

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      await refreshAccessToken()
      toast.success("Session extended")
    } catch (error) {
      console.error("Failed to extend session:", error)
      endSession("Your session could not be extended. Please sign in again.")
    } finally {
      setIsRefreshing(false)
    }
  }

  const showWarning = isAuthenticated && remainingTime !== null && remainingTime > 0 && remainingTime <= SESSION_WARNING_THRESHOLD_MS

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-amber-500/10 text-amber-600"><Clock3 /></AlertDialogMedia>
          <AlertDialogTitle>Your session is about to expire</AlertDialogTitle>
          <AlertDialogDescription>
            For your security, you will be signed out unless you extend your session.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center justify-between rounded-xl border bg-muted/50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-primary" />Time remaining</span>
          <span className="font-mono text-xl font-bold tabular-nums text-amber-600">{formatSessionRemainingTime(remainingTime)}</span>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={() => endSession("You have been signed out.")} disabled={isRefreshing}>
            <LogOut className="mr-2 h-4 w-4" />Sign out
          </Button>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
            Stay signed in
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default SessionExpiryWarning
