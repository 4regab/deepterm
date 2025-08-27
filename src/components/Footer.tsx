import { Coffee, Mail, Github } from "lucide-react";
import { Link } from "react-router-dom";
const Footer = () => {
  return <footer className="bg-white neo-border-t mt-auto py-6 sm:py-8 lg:py-10">
    <div className="container mx-auto px-3 sm:px-4 lg:px-6">
      {/* Mobile-first responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Brand section - Full width on mobile, spans 2 columns on sm if needed */}
        <div className="flex flex-col items-start text-left sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-[#ffead6] rounded-md neo-border">
              <img src="/favicon.ico" alt="Logo" className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <p className="font-bold text-lg sm:text-xl text-neo-black">DeepTerm</p>
          </div>
          <p className="text-neo-muted text-sm sm:text-base leading-relaxed">
            Your all-in-one study companion with gamified experience designed to boost your learning efficiency
          </p>

          <p className="text-neo-muted text-xs sm:text-sm mt-3 sm:mt-4">
            © {new Date().getFullYear()} DeepTerm
          </p>
        </div>

        {/* Resources section */}
        <div className="flex flex-col items-start text-left">
          <h3 className="font-bold mb-3 sm:mb-4 text-base sm:text-lg text-neo-black">Resources</h3>
          <div className="flex flex-col gap-2 sm:gap-3">
            <Link to="/about" className="text-neo-muted hover:text-[#FF5C00] transition-colors flex items-center gap-2 text-sm sm:text-base min-h-[44px] py-1 touch-target">
              <span>About</span>
            </Link>
            <Link to="/privacy-policy" className="text-neo-muted hover:text-[#FF5C00] transition-colors text-sm sm:text-base min-h-[44px] py-1 touch-target">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-neo-muted hover:text-[#FF5C00] transition-colors text-sm sm:text-base min-h-[44px] py-1 touch-target">
              Terms of Service
            </Link>
            <Link to="/contact" className="text-neo-muted hover:text-[#FF5C00] transition-colors text-sm sm:text-base min-h-[44px] py-1 touch-target">
              Contact
            </Link>
          </div>
        </div>

        {/* Connect section */}
        <div className="flex flex-col items-start text-left">
          <h3 className="font-bold mb-3 sm:mb-4 text-base sm:text-lg text-neo-black">Connect</h3>
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Email link */}
            <a href="mailto:deeptermai@gmail.com" className="text-neo-muted hover:text-[#FF5C00] transition-colors flex items-center justify-start gap-2 text-sm sm:text-base min-h-[44px] py-1 touch-target">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span>Email Us</span>
            </a>
            {/* GitHub repository link */}
            <a href="https://github.com/4regab/deepterm" target="_blank" rel="noopener noreferrer" className="text-neo-muted hover:text-[#FF5C00] transition-colors flex items-center justify-start gap-2 text-sm sm:text-base min-h-[44px] py-1 touch-target">
              <Github className="h-4 w-4 flex-shrink-0" />
              <span>GitHub</span>
            </a>
            {/* Donate link */}
            <a href="https://ko-fi.com/deepterm" target="_blank" rel="noopener noreferrer" className="text-neo-muted hover:text-[#FF5C00] transition-colors flex items-center justify-start gap-2 text-sm sm:text-base min-h-[44px] py-1 touch-target">
              <Coffee className="h-4 w-4 flex-shrink-0" />
              <span>Donate here</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </footer>;
};
export default Footer;
