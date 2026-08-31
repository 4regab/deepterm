"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturesShowcase from "@/components/FeaturesShowcase";
import StepsSection from "@/components/StepsSection";
import FAQSection from "@/components/FAQSection";
import CaptchaModal from "@/components/CaptchaModal";
import { createClient } from "@/config/supabase/client";
import type { User } from "@supabase/supabase-js";

async function handleGoogleLogin() {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });
}

const imgPlanet2 = "/assets/planet2.webp";
const imgPlanet1 = "/assets/planet1.webp";

export default function HomeClient() {
  const [user, setUser] = useState<User | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const hasCheckedRef = useRef(false);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    const checkUser = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch {
        // Ignore errors
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#f0f0ea";
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  const handleLoginClick = () => {
    if (sitekey) {
      setShowCaptcha(true);
    } else {
      handleGoogleLogin();
    }
  };

  const handleCaptchaVerify = () => {
    setShowCaptcha(false);
    handleGoogleLogin();
  };

  const isLoggedIn = !!user;
  return (
    <div className="bg-[#f0f0ea] relative min-h-screen">
      <div className="max-w-[1440px] mx-auto">
        <Header className="!mt-4 sm:!mt-5 lg:!mt-6" />

        <main id="main-content">
          {/* Hero Section */}
          <section className="relative z-10 mx-auto pt-4 sm:pt-8 lg:pt-10 pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center overflow-visible min-h-[75vh] sm:min-h-[70vh] lg:min-h-[80vh]">
            {/* Planet positioned top-left */}
            <div className="hidden sm:block absolute -left-[30px] lg:-left-[40px] top-[3%] w-[270px] h-[270px] lg:w-[330px] lg:h-[330px] z-0 pointer-events-none" aria-hidden="true">
              <Image
                alt=""
                src={imgPlanet2}
                fill
                className="object-contain"
                style={{ transform: "rotate(10deg)" }}
                unoptimized
                priority
              />
            </div>

            {/* Planet positioned bottom-right */}
            <div className="hidden sm:block absolute -right-[20px] lg:-right-[30px] bottom-[0%] w-[240px] h-[240px] lg:w-[300px] lg:h-[300px] z-0 pointer-events-none" aria-hidden="true">
              <Image
                alt=""
                src={imgPlanet1}
                fill
                className="object-contain"
                style={{ transform: "rotate(-15deg)" }}
                unoptimized
              />
            </div>

            {/* Main Hero Content */}
            <div className="relative z-10 text-center max-w-[900px] lg:max-w-[1100px] mx-auto px-2 sm:px-0">
              <h1 className="relative mb-4 sm:mb-5 font-serif text-[#171d2b]">
                <span className="block text-[46px] sm:text-[64px] lg:text-[88px] xl:text-[110px] leading-[1.1] tracking-tight font-normal">
                  Study smarter
                </span>
                <span className="inline-block text-[42px] sm:text-[72px] lg:text-[100px] xl:text-[130px] leading-[1.2] tracking-tight font-normal italic">
                  {" "}not harder
                </span>
              </h1>

              <p className="font-sans text-[14px] sm:text-[17px] lg:text-[18px] leading-[1.6] max-w-[320px] sm:max-w-[520px] mx-auto mb-6 text-[#171d2b]/70">
                Your Open Source alternative to Quizlet and Gizmo. Transform any study material into cards, reviewers, and exams instantly.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 mb-6 w-full">
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="group relative h-[48px] sm:h-[56px] w-full sm:w-auto rounded-full px-6 sm:px-10 font-sora text-[14px] sm:text-[16px] font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] bg-[#171d2b] text-white hover:bg-[#2a3347] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f0ea]"
                  >
                    Go to Dashboard
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleLoginClick}
                    className="group relative h-[48px] sm:h-[56px] w-full sm:w-auto rounded-full px-6 sm:px-10 font-sora text-[14px] sm:text-[16px] font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] bg-[#171d2b] text-white hover:bg-[#2a3347] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f0ea]"
                  >
                    Start Learning Free
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}
                <a
                  href="https://github.com/4regab/deepterm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-[48px] sm:h-[56px] w-full sm:w-auto rounded-full px-6 sm:px-10 font-sora text-[14px] sm:text-[16px] font-medium transition-all duration-300 flex items-center justify-center gap-2 border-2 hover:scale-[1.02] border-[#171d2b]/20 text-[#171d2b] hover:bg-[#171d2b]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f0ea]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                  View on GitHub
                </a>
              </div>

              {/* Features Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171d2b]/5">
                  <svg className="w-3.5 h-3.5 text-[#171d2b]/60" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  <span className="font-sans text-[11px] sm:text-[12px] text-[#171d2b]/70">AI-Powered</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171d2b]/5">
                  <svg className="w-3.5 h-3.5 text-[#171d2b]/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-sans text-[11px] sm:text-[12px] text-[#171d2b]/70">Interactive</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171d2b]/5">
                  <svg className="w-3.5 h-3.5 text-[#171d2b]/60" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span className="font-sans text-[11px] sm:text-[12px] text-[#171d2b]/70">Open Source</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171d2b]/5">
                  <svg className="w-3.5 h-3.5 text-[#171d2b]/60" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                  </svg>
                  <span className="font-sans text-[11px] sm:text-[12px] text-[#171d2b]/70">Gamified</span>
                </div>
              </div>
            </div>
          </section>

          {/* Features Showcase - Horizontal Scroll */}
          <FeaturesShowcase />

          {/* Steps Section - Stacked Cards */}
          <StepsSection />

          {/* FAQ Section - Accordion */}
          <FAQSection />

          {/* Final CTA Section */}
          <section className="relative z-10 mx-2 sm:mx-4 mb-6 sm:mb-8 rounded-[24px] sm:rounded-[40px] lg:rounded-[50px] overflow-hidden">
            <div className="bg-gradient-to-br from-[#171d2b] to-[#2a3347] px-4 sm:px-8 lg:px-12 py-10 sm:py-14 lg:py-16 text-center">
              <h2 className="font-serif text-[24px] sm:text-[32px] lg:text-[40px] text-white mb-2 sm:mb-3 lg:mb-4 leading-[1.2] px-2">
                Ready to transform your learning?
              </h2>
              <p className="font-sans text-[14px] sm:text-[15px] lg:text-[16px] text-white/85 mb-6 sm:mb-7 lg:mb-8 max-w-[400px] mx-auto px-2">
                Start studying smarter, not harder.
              </p>
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center h-[44px] sm:h-[50px] lg:h-[54px] rounded-[100px] px-6 sm:px-8 lg:px-10 font-sora text-[14px] sm:text-[16px] lg:text-[18px] transition-colors shadow-lg bg-white text-[#171d2b] hover:bg-[#f0f0ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#171d2b]"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleLoginClick}
                  className="inline-flex items-center justify-center h-[44px] sm:h-[50px] lg:h-[54px] rounded-[100px] px-6 sm:px-8 lg:px-10 font-sora text-[14px] sm:text-[16px] lg:text-[18px] transition-colors shadow-lg bg-white text-[#171d2b] hover:bg-[#f0f0ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#171d2b]"
                >
                  Start Learning Free
                </button>
              )}
              <p className="font-sans text-[12px] sm:text-[13px] text-white/70 mt-4 sm:mt-5 px-2">
                Free with Google · 10 AI generations a day · No credit card
              </p>
            </div>
          </section>
        </main>

        <Footer />
      </div>

      <CaptchaModal
        isOpen={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onVerify={handleCaptchaVerify}
      />
    </div>
  );
}
