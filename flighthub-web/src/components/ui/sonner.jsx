import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({
  ...props
}) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme}
      position="top-right"
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#0f172a",
          "--normal-border": "#e2e8f0",
          "--success-bg": "#ecfdf5",
          "--success-text": "#065f46",
          "--success-border": "#d1fae5",
          "--error-bg": "#fef2f2",
          "--error-text": "#7f1d1d",
          "--error-border": "#fecaca",
          "--warning-bg": "#fefce8",
          "--warning-text": "#78350f",
          "--warning-border": "#fde68a",
          "--info-bg": "#eff6ff",
          "--info-text": "#1d4ed8",
          "--info-border": "#bfdbfe",
          "--border-radius": "var(--radius)",
          "--box-shadow": "0 15px 40px rgba(15, 23, 42, 0.08)",
        }
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast rounded-2xl border bg-white text-slate-950 shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100",
        },
        duration: 4000,
      }}
      {...props} />
  );
}

export { Toaster }
