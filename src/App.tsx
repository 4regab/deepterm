import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PomodoroProvider } from "./context/PomodoroContext";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Pomodoro from "./pages/Pomodoro";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import cookieUtils from "./utils/cookieUtils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// Create a client
const queryClient = new QueryClient();

const App = () => {
  // Track cookie consent state to show/hide the banner
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  // Initialize AdSense based on existing cookie consent when the app loads
  useEffect(() => {
    cookieUtils.configureAdsense();
    
    // Check if consent was already given previously
    const consentLevel = cookieUtils.getConsentLevel();
    if (consentLevel !== undefined) {
      setShowCookieBanner(false);
    }
  }, []);

  const handleAcceptAllCookies = () => {
    cookieUtils.setConsentLevel(cookieUtils.ConsentLevel.ALL);
    setShowCookieBanner(false);
  };

  const handleDeclineCookies = () => {
    cookieUtils.setConsentLevel(cookieUtils.ConsentLevel.DECLINED);
    setShowCookieBanner(false);
  };

  const handleEssentialOnlyCookies = () => {
    cookieUtils.setConsentLevel(cookieUtils.ConsentLevel.ESSENTIAL);
    setShowCookieBanner(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <PomodoroProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/extractor" element={<Index />} />
              <Route path="/pomodoro" element={<Pomodoro />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>

            {showCookieBanner && (
              <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-[#333] text-white py-2 px-4 flex flex-col md:flex-row items-center gap-2">
                <div className="text-sm flex-grow">
                  <span>We use cookies to enhance your experience and show relevant ads. See our </span>
                  <Link to="/privacy-policy" className="font-medium text-[#FFC225] hover:underline">
                    Privacy Policy
                  </Link>
                  <span>.</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {/* Essential Only Button - Outline style */}
                  <Button 
                    size="sm"
                    variant="outline"
                    className="border-white/40 text-white/80 hover:bg-white/10 hover:text-white"
                    onClick={handleEssentialOnlyCookies}
                  >
                    Essential Only
                  </Button>
                  {/* Decline All Button - Outline style */}
                  <Button 
                    size="sm"
                    variant="outline"
                    className="border-white/40 text-white/80 hover:bg-white/10 hover:text-white"
                    onClick={handleDeclineCookies}
                  >
                    Decline All
                  </Button>
                  {/* Accept All Button - Primary accent color */}
                  <Button 
                    size="sm"
                    className="bg-[#FFC225] text-[#1a1a1a] hover:bg-[#FFD151]"
                    onClick={handleAcceptAllCookies}
                  >
                    Accept All
                  </Button>
                </div>
              </div>
            )}
          </TooltipProvider>
        </PomodoroProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
