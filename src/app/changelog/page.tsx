import { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Changelog - DeepTerm",
  description: "Latest updates and improvements to DeepTerm",
};

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#f0f0ea]">
      <div className="sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto">
          <Header />
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#171d2b] mb-2">Changelog</h1>
          <p className="font-sans text-base text-[#171d2b]/70">
            Latest updates and improvements to DeepTerm
          </p>
        </div>

        <div className="space-y-5">
          {/* Version 0.1.3 */}
          <div className="bg-white rounded-xl border border-[#171d2b]/10 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-0.5 bg-[#171d2b] text-white text-xs font-medium rounded-full">
                v0.1.3
              </span>
              <span className="text-[#171d2b]/60 text-xs font-sans">December 10, 2025</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-sans font-semibold text-[#171d2b] text-sm mb-2 flex items-center gap-2">
                  <span className="text-[#171d2b]">+</span> Added
                </h3>
                <ul className="space-y-1 ml-5">
                  <li className="font-sans text-[#171d2b]/80 text-sm">hCaptcha integration for bot protection</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Graceful fallback when captcha fails</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Error handling for captcha loading</li>
                </ul>
              </div>

              <div>
                <h3 className="font-sans font-semibold text-[#171d2b] text-sm mb-2 flex items-center gap-2">
                  <span className="text-[#c4875a]">!</span> Security
                </h3>
                <ul className="space-y-1 ml-5">
                  <li className="font-sans text-[#171d2b]/80 text-sm">Bot protection on OAuth sign-in</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">hCaptcha verification before auth</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Protection against automated attacks</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 0.1.2 */}
          <div className="bg-white rounded-xl border border-[#171d2b]/10 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-0.5 bg-[#171d2b]/10 text-[#171d2b] text-xs font-medium rounded-full">
                v0.1.2
              </span>
              <span className="text-[#171d2b]/60 text-xs font-sans">December 8, 2025</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-sans font-semibold text-[#171d2b] text-sm mb-2 flex items-center gap-2">
                  <span className="text-[#171d2b]">+</span> Added
                </h3>
                <ul className="space-y-1 ml-5">
                  <li className="font-sans text-[#171d2b]/80 text-sm">FAQ section on landing page</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Step-by-step getting started guide</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Sticky header with glass effect</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Resources dropdown menu</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Pomodoro fullscreen mode</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Custom timer background images</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Task reminders with notifications</li>
                </ul>
              </div>

              <div>
                <h3 className="font-sans font-semibold text-[#171d2b] text-sm mb-2 flex items-center gap-2">
                  <span className="text-[#171d2b]/60">~</span> Changed
                </h3>
                <ul className="space-y-1 ml-5">
                  <li className="font-sans text-[#171d2b]/80 text-sm">Improved landing page layout</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Enhanced feature showcase previews</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Better mobile navigation</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Enhanced Pomodoro timer UI</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 0.1.1 */}
          <div className="bg-white rounded-xl border border-[#171d2b]/10 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-0.5 bg-[#171d2b]/10 text-[#171d2b] text-xs font-medium rounded-full">
                v0.1.1
              </span>
              <span className="text-[#171d2b]/60 text-xs font-sans">December 1, 2025</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-sans font-semibold text-[#171d2b] text-sm mb-2 flex items-center gap-2">
                  <span className="text-[#171d2b]">+</span> Added
                </h3>
                <ul className="space-y-1 ml-5">
                  <li className="font-sans text-[#171d2b]/80 text-sm">ShareModal for material sharing</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Mobile filter dropdown</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Delete with Supabase</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Achievements test coverage</li>
                </ul>
              </div>

              <div>
                <h3 className="font-sans font-semibold text-[#171d2b] text-sm mb-2 flex items-center gap-2">
                  <span className="text-[#171d2b]/60">~</span> Changed
                </h3>
                <ul className="space-y-1 ml-5">
                  <li className="font-sans text-[#171d2b]/80 text-sm">Gemini client service module</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Materials list UI refactor</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">API error handling</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Dashboard accessibility</li>
                </ul>
              </div>

              <div>
                <h3 className="font-sans font-semibold text-[#171d2b] text-sm mb-2 flex items-center gap-2">
                  <span className="text-[#c4875a]">!</span> Security
                </h3>
                <ul className="space-y-1 ml-5">
                  <li className="font-sans text-[#171d2b]/80 text-sm">COOP/CORP headers</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">CSP for Google Fonts</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">RLS sharing policies</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Version 0.1.0 */}
          <div className="bg-white rounded-xl border border-[#171d2b]/10 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2.5 py-0.5 bg-[#171d2b]/10 text-[#171d2b] text-xs font-medium rounded-full">
                v0.1.0
              </span>
              <span className="text-[#171d2b]/60 text-xs font-sans">November 30, 2025</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-sans font-semibold text-[#171d2b] text-sm mb-2 flex items-center gap-2">
                  <span className="text-[#171d2b]">+</span> Added
                </h3>
                <ul className="space-y-1 ml-5">
                  <li className="font-sans text-[#171d2b]/80 text-sm">AI flashcard & reviewer generation</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Three extraction modes</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Study modes: flashcards, learn, match, practice</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Pomodoro timer with tasks</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">XP system with levels & achievements</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">GitHub-style activity calendar</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">PDF/DOCX export</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Shareable links</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Google OAuth via Supabase</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Multi-key API rotation</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Rate limiting (10/day)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-sans font-semibold text-[#171d2b] text-sm mb-2 flex items-center gap-2">
                  <span className="text-[#c4875a]">!</span> Security
                </h3>
                <ul className="space-y-1 ml-5">
                  <li className="font-sans text-[#171d2b]/80 text-sm">Row Level Security on all tables</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Input validation with Zod</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">Atomic rate limit operations</li>
                  <li className="font-sans text-[#171d2b]/80 text-sm">CSP and HSTS headers</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
