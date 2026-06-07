import { Check, Cloud, LoaderCircle, Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTheme } from "@/components/theme-provider"

const options = [
  { value: "SYSTEM", label: "System", icon: Monitor },
  { value: "LIGHT", label: "Light", icon: Sun },
  { value: "DARK", label: "Dark", icon: Moon },
]

export function ThemeToggle({ className = "" }) {
  const {
    preference,
    theme,
    isSaving,
    syncError,
    isAccountSynced,
    setThemePreference,
  } = useTheme()
  const CurrentIcon = theme === "dark" ? Moon : Sun

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Open appearance preferences"
          title="Appearance preferences"
          className={className}
        >
          <CurrentIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" side="top" className="w-64 p-3">
        <PopoverHeader>
          <PopoverTitle>Appearance</PopoverTitle>
          <PopoverDescription>
            Choose how FlightHub looks for your account.
          </PopoverDescription>
        </PopoverHeader>

        <div className="mt-1 grid grid-cols-3 gap-2">
          {options.map(({ value, label, icon: Icon }) => {
            const selected = preference === value

            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setThemePreference(value)}
                className={`relative flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {selected && <Check className="absolute right-1 top-1 h-3 w-3" />}
              </button>
            )
          })}
        </div>

        <div className="mt-2 flex items-center gap-2 border-t pt-2 text-xs text-muted-foreground">
          {isSaving ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Cloud className="h-3.5 w-3.5" />
          )}
          <span>
            {syncError || (isAccountSynced ? "Synced to your account" : "Saved on this device")}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
