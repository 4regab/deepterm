"use client";

import Link from "next/link";

const imgLogo = "/assets/logo.svg";

export default function Footer() {
  return (
    <footer className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 border-t border-[#171d2b]/10 bg-[#f0f0ea]">
      <div className="max-w-[1000px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 mb-2 sm:mb-0">
            <Link href="/" className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] flex items-center justify-center">
                <div className="rotate-[292deg]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="Deepterm Logo" className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" src={imgLogo} />
                </div>
              </div>
              <span className="font-sora text-[#171d2b] text-[16px] sm:text-[18px]">deepterm</span>
            </Link>
            <p className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 leading-[1.5]">
              AI-powered study tools that work for you.
            </p>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-sora text-[13px] sm:text-[14px] text-[#171d2b] mb-2 sm:mb-3">About Us</h4>
            <ul className="flex flex-col gap-1.5 sm:gap-2">
              <li><Link href="/about" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">About</Link></li>
              <li><Link href="/help" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-sora text-[13px] sm:text-[14px] text-[#171d2b] mb-2 sm:mb-3">Legal</h4>
            <ul className="flex flex-col gap-1.5 sm:gap-2">
              <li><Link href="/privacy-policy" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Connect Links */}
          <div>
            <h4 className="font-sora text-[13px] sm:text-[14px] text-[#171d2b] mb-2 sm:mb-3">Connect</h4>
            <ul className="flex flex-col gap-1.5 sm:gap-2">
              <li><a href="https://ko-fi.com/deepterm" target="_blank" rel="noopener noreferrer" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">Donate</a></li>
              <li><a href="https://github.com/4regab/deepterm" target="_blank" rel="noopener noreferrer" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">GitHub</a></li>
              <li><a href="mailto:deeptermai@gmail.com" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">Email</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 sm:pt-6 border-t border-[#171d2b]/10 gap-3 sm:gap-4">
          <p className="font-sans text-[11px] sm:text-[12px] text-[#171d2b]/50">
            © 2025 DeepTerm. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://ko-fi.com/deepterm" target="_blank" rel="noopener noreferrer" className="text-[#171d2b]/50 hover:text-[#171d2b] transition-colors" aria-label="Ko-fi">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z" /></svg>
            </a>
            <a href="https://github.com/4regab/deepterm" target="_blank" rel="noopener noreferrer" className="text-[#171d2b]/50 hover:text-[#171d2b] transition-colors" aria-label="GitHub">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
            </a>
            <a href="mailto:deeptermai@gmail.com" className="text-[#171d2b]/50 hover:text-[#171d2b] transition-colors" aria-label="Email">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
