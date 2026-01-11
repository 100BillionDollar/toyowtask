import { Button } from "@/components/ui/button"
import { Moon, Sun, TrendingUp } from "lucide-react"

export function Header({ darkMode, onToggleTheme }: any) {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <TrendingUp className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Marketplace Intelligence</h1>
            <p className="text-xs text-muted-foreground">
              Compare prices across platforms
            </p>
          </div>
        </div>

        <Button size="icon" variant="outline" onClick={onToggleTheme}>
          {darkMode ? <Sun /> : <Moon />}
        </Button>
      </div>
    </header>
  )
}
