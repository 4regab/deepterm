import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CookieConsent from "react-cookie-consent";
import cookieUtils from "./utils/cookieUtils";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Pomodoro from "./pages/Pomodoro";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

// Create a client
const queryClient = new QueryClient();

const App = () => {
  // Initialize AdSense based on existing cookie consent when the app loads
  useEffect(() => {
    cookieUtils.configureAdsense();
  }, []);

  const handleAcceptAllCookies = () => {
    cookieUtils.setConsentLevel(cookieUtils.ConsentLevel.ALL);
  };

  const handleAcceptEssentialOnly = () => {
    cookieUtils.setConsentLevel(cookieUtils.ConsentLevel.ESSENTIAL);
  };

  const handleDeclineCookies = () => {
    cookieUtils.setConsentLevel(cookieUtils.ConsentLevel.DECLINED);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
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
          
          <CookieConsent
            location="bottom"
            buttonText="Accept All"
            cookieName="deeptermCookieConsent"
            style={{ 
              background: "white", 
              padding: "16px", 
              zIndex: 9999, 
              boxShadow: "0 -1px 4px rgba(0, 0, 0, 0.1)",
              color: "#1a1a1a",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              maxWidth: "100%",
              borderTop: "1px solid hsl(48 30% 96%)" /* --muted color */
            }}
            buttonStyle={{ 
              background: "hsl(23 100% 50%)", /* --primary */
              color: "#1a1a1a",
              fontSize: "14px",
              padding: "8px 16px",
              borderRadius: "0.5rem", /* rounded-lg */
              border: "none",
              fontWeight: "500",
              cursor: "pointer",
              marginLeft: "8px"
            }}
            expires={365}
            onAccept={handleAcceptAllCookies}
            ButtonComponent="button"
            enableDeclineButton
            declineButtonText="Decline"
            declineButtonStyle={{
              background: "transparent", 
              color: "#1a1a1a",
              fontSize: "14px",
              padding: "8px 16px",
              borderRadius: "0.5rem", /* rounded-lg */
              border: "1px solid #e5e5e5",
              fontWeight: "500",
              cursor: "pointer",
              marginLeft: "8px"
            }}
            onDecline={handleDeclineCookies}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div style={{ marginRight: "16px", flex: "1" }}>
                <p style={{ margin: "0", padding: "0" }}>
                  This site uses cookies to enhance your experience.{" "}
                  <a href="/privacy-policy" style={{ color: "hsl(160 84% 39%)", textDecoration: "none", fontWeight: "500" }}>
                    Privacy Policy
                  </a>
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button 
                  onClick={handleAcceptEssentialOnly} 
                  style={{
                    background: "transparent", 
                    color: "#1a1a1a",
                    fontSize: "14px",
                    padding: "8px 16px",
                    borderRadius: "0.5rem", /* rounded-lg */
                    border: "1px solid #e5e5e5",
                    fontWeight: "500",
                    cursor: "pointer"
                  }}
                >
                  Essential Only
                </button>
              </div>
            </div>
          </CookieConsent>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
