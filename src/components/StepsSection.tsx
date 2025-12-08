"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { FileText, Brain, Gamepad2 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function StepsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const desktopCardsRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useGSAP(() => {
    if (!headerRef.current) return;
    
    gsap.fromTo(headerRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 90%",
          toggleActions: "play none none none",
        }
      }
    );
  }, { scope: sectionRef });

  const mobileScrollContainerRef = useRef<HTMLDivElement>(null);
  const mobileWrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!isMobile) return;

    const scrollContainer = mobileScrollContainerRef.current;
    const wrapper = mobileWrapperRef.current;
    if (!scrollContainer || !wrapper) return;

    const getScrollAmount = () => {
      const containerWidth = wrapper.clientWidth || window.innerWidth;
      const totalScroll = scrollContainer.scrollWidth - containerWidth;
      return -totalScroll;
    };

    const scrollAmount = Math.abs(getScrollAmount());

    const tween = gsap.to(scrollContainer, {
      x: getScrollAmount,
      ease: "none",
      scrollTrigger: {
        trigger: wrapper,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        start: "top 15%",
        end: () => `+=${scrollAmount}`,
        invalidateOnRefresh: true,
      },
    });

    if (tween.scrollTrigger?.pin) {
      (tween.scrollTrigger.pin as HTMLElement).style.zIndex = "10";
    }

    return () => {
      tween.scrollTrigger?.kill();
    };
  }, { scope: sectionRef, dependencies: [isMobile] });

  useGSAP(() => {
    if (isMobile || !desktopCardsRef.current) return;
    
    const desktopCards = desktopCardsRef.current.querySelectorAll('.step-card-desktop');
    
    gsap.fromTo(desktopCards,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power2.out",
        scrollTrigger: {
          trigger: desktopCardsRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        }
      }
    );
  }, { scope: sectionRef, dependencies: [isMobile] });


  const steps = [
    {
      number: "01",
      title: "Upload or Paste",
      description: "Drop your study materials - PDFs, documents, or paste text directly. No account required to start.",
      bgClass: "bg-[#171d2b]",
      numberClass: "text-white/20",
      visual: (
        <div className="rounded-2xl p-5 bg-white/10 border border-white/20">
          <div className="border-2 border-dashed rounded-xl p-6 text-center border-white/30">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 bg-white/20">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <p className="text-sm font-medium mb-1 text-white/90">Drop files here</p>
            <p className="text-xs text-white/50">PDF, DOCX, or paste text</p>
          </div>
          <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-white/10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/20">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-2.5 rounded-full mb-1.5 bg-white/40" style={{ width: '75%' }} />
              <div className="h-2 rounded-full bg-white/20" style={{ width: '50%' }} />
            </div>
          </div>
        </div>
      ),
    },
    {
      number: "02",
      title: "AI Processes",
      description: "Our AI extracts key terms, generates practice tests, and creates flashcards automatically.",
      bgClass: "bg-[#2a3347]",
      numberClass: "text-white/20",
      visual: (
        <div className="rounded-2xl p-5 shadow-lg bg-white">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex items-center gap-2 mb-4 text-[#171d2b]">
            <Brain className="w-5 h-5" />
            <span className="text-[13px] font-medium">AI Generating...</span>
          </div>
          <div className="h-2 rounded-full mb-4 bg-gray-100">
            <div className="h-full rounded-full bg-[#171d2b]" style={{ width: '70%' }} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-[#171d2b] text-white">12</div>
              <span className="text-xs text-[#171d2b]">Flashcards created</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
              <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-gray-600 text-white">5</div>
              <span className="text-xs text-[#171d2b]">Review sections</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      number: "03",
      title: "Study & Succeed",
      description: "Review, practice, and track your progress with gamified learning. Level up as you master content.",
      bgClass: "bg-[#3d4a5f]",
      numberClass: "text-white/20",
      visual: (
        <div className="rounded-2xl p-5 bg-white/10 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white text-[#171d2b]">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Level 7</p>
                <p className="text-xs text-white/60">1,250 XP</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">+50 XP</div>
          </div>
          <div className="h-2 rounded-full mb-4 bg-white/20">
            <div className="h-full rounded-full bg-white/70" style={{ width: '65%' }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Streak", value: "7 days" },
              { label: "Mastered", value: "24" },
              { label: "Sessions", value: "42" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-2 rounded-lg bg-white/10">
                <p className="text-sm font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <section ref={sectionRef} className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
      <div ref={headerRef} className="text-center mb-10 sm:mb-12 lg:mb-16">
        <h2 className="font-serif text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.1] mb-3 sm:mb-4 text-[#171d2b]">
          Get Started in Minutes
        </h2>
        <p className="font-sans text-[14px] sm:text-[16px] max-w-[500px] mx-auto text-[#171d2b]/60">
          Three steps to your perfect study materials. It&apos;s really that easy.
        </p>
      </div>

      {/* Mobile: Horizontal scroll cards */}
      <div ref={mobileWrapperRef} className="lg:hidden min-h-[420px] sm:min-h-[480px] flex items-center overflow-hidden -mx-4 sm:-mx-6">
        <div ref={mobileScrollContainerRef} className="flex gap-4 sm:gap-6 pl-4 sm:pl-6 pr-4 sm:pr-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`step-card-mobile w-[85vw] sm:w-[70vw] md:w-[60vw] max-w-[500px] flex-shrink-0 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 relative overflow-hidden ${step.bgClass}`}
            >
              <div className="flex flex-col gap-6">
                <div className="flex-1">
                  <span className={`font-serif text-[60px] sm:text-[80px] font-light leading-none block ${step.numberClass}`}>
                    {step.number}
                  </span>
                  <h3 className="font-serif font-semibold text-[24px] sm:text-[28px] mt-2 mb-3 text-white">
                    {step.title}
                  </h3>
                  <p className="font-sans text-[14px] sm:text-[15px] leading-relaxed max-w-[400px] text-white/80">
                    {step.description}
                  </p>
                </div>
                <div className="flex-shrink-0">{step.visual}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: Sticky stacking cards */}
      <div ref={desktopCardsRef} className="hidden lg:block max-w-[900px] mx-auto relative" style={{ height: `${steps.length * 320 + 150}px` }}>
        {steps.map((step, index) => (
          <div
            key={index}
            className="step-card-desktop sticky mb-6"
            style={{ top: `${100 + index * 24}px`, zIndex: 10 + index }}
          >
            <div className={`rounded-[32px] p-10 relative overflow-hidden shadow-2xl ${step.bgClass}`}>
              <div className="flex flex-row items-center justify-between gap-10">
                <div className="flex-1">
                  <span className={`font-serif text-[100px] font-light leading-none block ${step.numberClass}`}>
                    {step.number}
                  </span>
                  <h3 className="font-serif font-semibold text-[32px] mt-2 mb-3 text-white">{step.title}</h3>
                  <p className="font-sans text-[15px] leading-relaxed max-w-[400px] text-white/80">{step.description}</p>
                </div>
                <div className="flex-shrink-0 w-[320px]">{step.visual}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
