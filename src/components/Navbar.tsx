import React from "react";
import { Link } from "react-router-dom";
import { FileText, Clock, Menu, X, Zap, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const Navbar = () => {
  const isMobile = useIsMobile();

  const NavLinks = () => (
    <nav className="flex items-center gap-3">
      <Link to="/">
        <Button variant="outline" className="neo-border bg-white hover:bg-gray-100 text-neo-black font-medium flex items-center gap-2 shadow-neo hover:shadow-neo-lg transition-all hover:-translate-y-0.5 hover:-translate-x-0.5">
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Button>
      </Link>
      <Link to="/extractor">
        <Button variant="outline" className="neo-border bg-neo-accent2 hover:bg-neo-accent2/90 text-white font-medium flex items-center gap-2 shadow-neo hover:shadow-neo-lg transition-all hover:-translate-y-0.5 hover:-translate-x-0.5">
          <FileText className="h-4 w-4" />
          <span>Reviewer Maker</span>
        </Button>
      </Link>
      <Link to="/pomodoro">
        <Button variant="outline" className="neo-border bg-neo-accent3 hover:bg-neo-accent3/90 text-neo-black font-medium flex items-center gap-2 shadow-neo hover:shadow-neo-lg transition-all hover:-translate-y-0.5 hover:-translate-x-0.5">
          <Clock className="h-4 w-4" />
          <span>Pomodoro</span>
        </Button>
      </Link>
    </nav>
  );

  return (
    <header className="bg-white border-b-2 border-neo-black py-3 sticky top-0 z-10 shadow-[0_2px_10px_rgba(0,0,0,0.07)]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.ico" alt="Logo" className="h-7 w-7" />
            <h1 className="text-2xl font-bold font-heading">DeepTerm</h1>
          </Link>
          
          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="neo-border shadow-neo p-2 hover:shadow-neo-lg hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="border-l-2 border-neo-black bg-white">
                <div className="py-8 flex flex-col gap-4">
                  <Link to="/" className="w-full">
                    <Button variant="outline" className="neo-border w-full justify-start font-medium">
                      <Home className="h-4 w-4 mr-2" />
                      Home
                    </Button>
                  </Link>
                  <Link to="/extractor" className="w-full">
                    <Button variant="outline" className="neo-border w-full justify-start font-medium bg-neo-accent2 text-white">
                      <FileText className="h-4 w-4 mr-2" />
                      Reviewer Maker
                    </Button>
                  </Link>
                  <Link to="/pomodoro" className="w-full">
                    <Button variant="outline" className="neo-border w-full justify-start font-medium bg-neo-accent3 text-neo-black">
                      <Clock className="h-4 w-4 mr-2" />
                      Pomodoro Timer
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <NavLinks />
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
