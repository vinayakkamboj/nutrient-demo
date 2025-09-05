import { Button } from "../components/ui/button"

export function Navbar() {
  const handleContactClick = () => {
    window.open("https://www.nutrient.io/contact-sales", "_blank")
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-neutral-200">
      {/* Left: Brand */}
      <div className="flex items-baseline gap-2 font-['Inter'] ml-6">
        <span className="text-[22px] sm:text-2xl font-bold tracking-tight text-neutral-900">
          Nutrient
        </span>
        <span className="text-[12px] sm:text-sm font-medium text-neutral-600">
          WebSDK Demo
        </span>
      </div>

      {/* Right: CTA */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleContactClick}
          className="rounded-md px-2 py-0.5 text-[10px] sm:text-[11px] font-medium bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Contact Sales
        </Button>
        
      </div>
    </header>
  )
}
