import React from "react";
import { Link } from "react-router-dom";
import { FileText, Mail, Zap, Github, Clock, Heart } from "lucide-react";
const Footer = () => {
  return <footer className="bg-white neo-border-t mt-auto py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center md:items-start mobile-text-center">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-[#ffead6] rounded-md neo-border">
                <img src="/favicon.ico" alt="Logo" className="h-5 w-5" />
              </div>
              <p className="font-bold text-xl">DeepTerm</p>
            </div>
            <p className="text-gray-700">
              Boost your productivity with our Pomodoro and Notes tool.
            </p>
            
            <p className="text-gray-600 text-sm mt-4">
              © {new Date().getFullYear()} DeepTerm
            </p>
          </div>

          
          
          <div className="flex flex-col items-center md:items-start mobile-text-center">
            <h3 className="font-bold mb-4 text-lg text-[#1a1a1a]">Resources</h3>
            <div className="flex flex-col gap-3">
              <Link to="/privacy-policy" className="text-gray-700 hover:text-[#FF5C00] transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-700 hover:text-[#FF5C00] transition-colors">
                Terms of Service
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-[#FF5C00] transition-colors">
                Contact
              </Link>
            </div>
          </div>
          
          <div className="flex flex-col items-center md:items-start mobile-text-center">
            <h3 className="font-bold mb-4 text-lg text-[#1a1a1a]">Connect</h3>
            <div className="flex flex-col gap-3">
              <a href="mailto:contact@4regab.com" className="text-gray-700 hover:text-[#FF5C00] transition-colors flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Email Us</span>
              </a>
              <a href="https://4regab.me" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-[#FF5C00] transition-colors flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span>4regab</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;