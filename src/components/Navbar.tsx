import { Button } from "../components/ui/button"

export function Navbar() {
  const handleContactClick = () => {
    window.open("https://www.nutrient.io/contact-sales", "_blank")
  }

  return (
    <header className="flex items-center justify-between h-10 px-2 sm:px-4 bg-white border-b border-neutral-200">
      {/* Left: Brand */}
      <div className="flex items-baseline gap-1 font-['Inter'] min-w-0 flex-1">
        <span className="text-sm sm:text-lg font-bold tracking-tight text-neutral-900 truncate">
          Nutrient
        </span>
        <span className="text-xs sm:text-xs font-medium text-neutral-600 truncate">
          WebSDK Demo
        </span>
      </div>

      {/* Right: CTA */}
      <div className="flex items-center ml-1">
        <Button
          onClick={handleContactClick}
          size="sm"
          className="text-[10px] xs:text-xs px-1.5 xs:px-2 py-1 h-6 xs:h-7 whitespace-nowrap min-w-0"
        >
          <span className="hidden xs:inline">Contact Sales</span>
          <span className="xs:hidden">Contact</span>
        </Button>
      </div>
    </header>
  )
}