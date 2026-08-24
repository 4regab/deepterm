"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturesShowcase from "@/components/FeaturesShowcase";
import StepsSection from "@/components/StepsSection";
import FAQSection from "@/components/FAQSection";
import CaptchaModal from "@/components/CaptchaModal";
import { Button, ButtonLink, Reveal } from "@/components/ui";
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
    <div className="bg-background relative max-w-[76rem] min-h-screen mx-auto">
      <Header />

      <main id="main-content">
        <section className="relative z-10 mx-auto pt-4 sm:pt-8 lg:pt-10 pb-8 sm:pb-12 lg:pb-16 px-4 sm:px-6 flex flex-col items-center justify-center overflow-visible min-h-[75vh] sm:min-h-[70vh] lg:min-h-[80vh]">
          <div className="hidden sm:block absolute -left-[30px] lg:-left-[40px] top-[3%] w-[270px] h-[270px] lg:w-[330px] lg:h-[330px] z-0 pointer-events-none">
            <Image
              alt=""
              src={imgPlanet2}
              fill
              className="object-contain"
              style={{ transform: "rotate(10deg)" }}
              unoptimized
            />
          </div>

          <div className="hidden sm:block absolute -right-[20px] lg:-right-[30px] bottom-[0%] w-[240px] h-[240px] lg:w-[300px] lg:h-[300px] z-0 pointer-events-none">
            <Image
              alt=""
              src={imgPlanet1}
              fill
              className="object-contain"
              style={{ transform: "rotate(-15deg)" }}
              unoptimized
            />
          </div>

          <div className="relative z-10 text-center max-w-[900px] lg:max-w-[1100px] mx-auto px-2 sm:px-0">
            <Reveal delay={80}>
              <h1 className="relative mb-4 sm:mb-5">
                <span className="block font-serif text-[46px] sm:text-[64px] lg:text-[88px] xl:text-[110px] leading-[1.1] tracking-tight text-foreground font-normal">
                  Study smarter
                </span>
                <span className="inline-block font-serif italic text-[42px] sm:text-[72px] lg:text-[100px] xl:text-[130px] leading-[1.2] tracking-tight text-muted-foreground font-normal">
                  not harder
                </span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="font-sans text-[15px] sm:text-[17px] leading-6 max-w-[36ch] sm:max-w-[52ch] mx-auto mb-6 text-muted-foreground">
                Open-source study tools that turn PDFs and notes into flashcards, reviewers, and practice tests.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3 mb-6 w-full">
                {isLoggedIn ? (
                  <ButtonLink href="/dashboard" size="lg" className="w-full sm:w-auto">
                    Go to dashboard
                    <svg className="w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </ButtonLink>
                ) : (
                  <Button size="lg" className="w-full sm:w-auto group" onClick={handleLoginClick}>
                    Start learning free
                    <svg className="w-4 h-4 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Button>
                )}
                <a
                  href="https://github.com/4regab/deepterm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-12 w-full sm:w-auto rounded-full px-8 font-sora text-base font-medium border border-border text-foreground hover:bg-accent transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.96]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
                  View on GitHub
                </a>
              </div>
            </Reveal>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {["AI-powered", "Interactive", "Open source", "Gamified"].map((label) => (
                <span key={label} className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground font-sans text-xs">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <FeaturesShowcase />
        <StepsSection />
        <FAQSection />

        <section className="relative z-10 mx-4 sm:mx-6 mb-8 rounded-[28px] sm:rounded-[40px] overflow-hidden bg-primary px-4 sm:px-8 lg:px-12 py-12 sm:py-16 text-center">
          <Reveal>
            <h2 className="font-serif text-[22px] sm:text-[32px] lg:text-[40px] text-primary-foreground mb-3 leading-[1.2]">
              Ready to study smarter?
            </h2>
            <p className="font-sans text-[15px] text-primary-foreground/80 mb-6 max-w-[36ch] mx-auto">
              Turn your next set of notes into cards in about 30 seconds.
            </p>
            {isLoggedIn ? (
              <ButtonLink href="/dashboard" variant="secondary" size="lg">
                Go to dashboard
              </ButtonLink>
            ) : (
              <Button variant="secondary" size="lg" onClick={handleLoginClick}>
                Start learning free
              </Button>
            )}
            <p className="font-sans text-xs text-primary-foreground/60 mt-4">
              No card, no install. Ten AI generations a day.
            </p>
          </Reveal>
        </section>
      </main>

      <Footer />

      <CaptchaModal
        isOpen={showCaptcha}
        onClose={() => setShowCaptcha(false)}
        onVerify={handleCaptchaVerify}
      />
    </div>
  );
}
