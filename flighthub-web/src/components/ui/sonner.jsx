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
          "--normal-bg": "#ECFDF5",
          "--normal-text": "#065F46",
          "--normal-border": "#D1FAE5",
          "--border-radius": "var(--radius)",
          "--box-shadow": "0 15px 40px rgba(15, 23, 42, 0.08)",
        }
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-900 shadow-lg",
        },
        duration: 4000,
      }}
      {...props} />
  );
}

export { Toaster }
