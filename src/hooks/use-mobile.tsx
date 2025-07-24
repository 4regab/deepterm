import * as React from "react"

// Using standard Tailwind breakpoints
const MOBILE_BREAKPOINT = 768 // md breakpoint
const TABLET_BREAKPOINT = 1024 // lg breakpoint
const SMALL_MOBILE_BREAKPOINT = 640 // sm breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Use matchMedia for more reliable detection
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsMobile(mql.matches)
    }
    
    // Initial detection
    setIsMobile(mql.matches)
    
    // Modern event listener approach
    mql.addEventListener("change", onChange)
    
    // Cleanup
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return false during SSR and true value once mounted
  return !!isMobile
}

// Additional hook for small mobile detection
export function useIsSmallMobile() {
  const [isSmallMobile, setIsSmallMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${SMALL_MOBILE_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsSmallMobile(mql.matches)
    }
    
    setIsSmallMobile(mql.matches)
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isSmallMobile
}

// Hook for tablet detection (between mobile and desktop)
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`)
    
    const onChange = () => {
      setIsTablet(mql.matches)
    }
    
    setIsTablet(mql.matches)
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isTablet
}

// Hook for desktop detection
export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`)
    
    const onChange = () => {
      setIsDesktop(mql.matches)
    }
    
    setIsDesktop(mql.matches)
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isDesktop
}

// Comprehensive hook that provides all screen size information
export function useScreenSize() {
  const isMobile = useIsMobile()
  const isSmallMobile = useIsSmallMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()

  return {
    isMobile,
    isSmallMobile,
    isTablet,
    isDesktop,
    // Helper properties
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop,
  }
}
