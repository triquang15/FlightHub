import * as React from "react"
import { Clock3, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { refreshAccessToken } from "@/utils/api"
import { useSessionExpiry } from "@/components/auth/useSessionExpiry"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const SessionCountdownControl = ({ className, showLabel = true }) => {
  const { formattedRemainingTime, isExpiringSoon, remainingTime } = useSessionExpiry()
  const [isExtending, setIsExtending] = React.useState(false)

  if (remainingTime === null) return null

  const handleExtend = async () => {
    try {
      setIsExtending(true)
      await refreshAccessToken()
      toast.success("Session extended")
    } catch (error) {
      console.error("Failed to extend session:", error)
      toast.error("Could not extend your session")
    } finally {
      setIsExtending(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExtend}
      disabled={isExtending}
      title="Extend your signed-in session"
      className={cn(
        "h-10 rounded-full px-3 font-mono text-xs tabular-nums",
        isExpiringSoon && "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
        className,
      )}
    >
      {isExtending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Clock3 className="mr-1.5 h-3.5 w-3.5" />}
      {formattedRemainingTime}
      {showLabel && <span className="ml-1 font-sans font-medium">Extend</span>}
    </Button>
  )
}

export default SessionCountdownControl
