import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PomodoroProvider } from "./context/PomodoroContext";
import { UserProfileProvider } from "./context/UserProfileContext";
import { FlashcardProvider } from "./context/FlashcardContext";
import ErrorBoundary from "./components/ErrorBoundary";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Pomodoro from "./pages/Pomodoro";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import CookieConsentBanner from "./components/CookieConsentBanner";
import Study from "./pages/Study";
import Quiz from "./pages/Quiz";
import Flashcards from "./pages/Flashcards";
import DebugGeminiAPI from "./components/DebugGeminiAPI";
import DocxDebugger from "./components/DocxDebugger";
import DocxDebuggerNew from "./components/DocxDebuggerNew";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/extractor" element={<Index />} />
        <Route path="/reviewer" element={<Index />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/study" element={<Study />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/debug" element={<DebugGeminiAPI />} />
        <Route path="/docx-debug" element={<DocxDebugger />} />
        <Route path="/docx-debug-new" element={<DocxDebuggerNew />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />      </Routes>
      <CookieConsentBanner />
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <UserProfileProvider>
            <PomodoroProvider>
              <FlashcardProvider>
                <TooltipProvider>
                  <AppContent />
                </TooltipProvider>
              </FlashcardProvider>
            </PomodoroProvider>
          </UserProfileProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
