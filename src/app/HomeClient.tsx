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
    <div className="bg-background min-h-screen">
      <Header />

      <main id="main-content" className="mx-auto max-w-[76rem] px-4 sm:px-6 flex flex-col gap-12 sm:gap-20 pb-12 sm:pb-20">
        <section className="pt-10 sm:pt-16 lg:pt-20 text-center">
          <Reveal delay={80}>
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground mb-5">
              Open-source study tools
            </p>
            <h1 className="text-[40px] sm:text-[56px] lg:text-[72px] leading-[1.05] tracking-tight font-medium mb-5">
              Study smarter
              <span className="block text-muted-foreground">not harder</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="text-sm sm:text-[15px] leading-6 max-w-[46ch] mx-auto mb-8 text-muted-foreground">
              Turn PDFs and notes into flashcards, reviewers, and practice tests. Ten AI generations a day, no card required.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              {isLoggedIn ? (
                <ButtonLink href="/dashboard" size="lg">
                  Go to dashboard
                </ButtonLink>
              ) : (
                <Button size="lg" onClick={handleLoginClick}>
                  Start learning free
                </Button>
              )}
              <a
                href="https://github.com/4regab/deepterm"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 w-full sm:w-auto rounded-full px-8 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-[color-mix(in_srgb,var(--secondary)_95%,var(--ink))] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:translate-y-px active:scale-[0.96]"
              >
                View on GitHub
              </a>
            </div>
          </Reveal>
        </section>

        <Reveal delay={80}>
          <div className="plate overflow-hidden p-1">
            <div className="relative min-h-[220px] sm:min-h-[320px] rounded-[18px] bg-muted">
              <Image
                alt=""
                src={imgPlanet2}
                width={280}
                height={280}
                priority
                className="absolute left-[6%] top-[8%] w-[42%] max-w-[280px] object-contain"
                unoptimized
              />
              <Image
                alt=""
                src={imgPlanet1}
                width={240}
                height={240}
                className="absolute right-[8%] bottom-[6%] w-[36%] max-w-[240px] object-contain"
                unoptimized
              />
              <div className="relative z-10 flex h-full min-h-[220px] sm:min-h-[320px] items-end p-5 sm:p-8">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Flashcards, reviewers, practice tests
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        <FeaturesShowcase />
        <StepsSection />
        <FAQSection />

        <section className="plate px-6 sm:px-10 py-12 sm:py-16 text-center">
          <Reveal>
            <h2 className="text-[22px] sm:text-[32px] tracking-tight font-medium mb-3">
              Ready to study smarter?
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-[36ch] mx-auto">
              Turn your next set of notes into cards in about 30 seconds.
            </p>
            {isLoggedIn ? (
              <ButtonLink href="/dashboard" size="lg">
                Go to dashboard
              </ButtonLink>
            ) : (
              <Button size="lg" onClick={handleLoginClick}>
                Start learning free
              </Button>
            )}
            <p className="text-xs text-muted-foreground mt-4">
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
