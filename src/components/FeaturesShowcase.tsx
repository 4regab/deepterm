"use client";

import {
  Copy,
  FileText,
  Zap,
  ScanLine,
  Plus,
  GripVertical,
  Edit2,
  Trash2,
  Calendar
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

interface Feature {
  id: string;
  title: string;
  description: string;
  visual: React.ReactNode;
}

export default function FeaturesShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useGSAP(() => {
    if (isMobile) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scrollContainer = scrollContainerRef.current;
    const container = containerRef.current;
    if (!scrollContainer || !container) return;

    const getScrollAmount = () => {
      const containerWidth = scrollContainer.parentElement?.clientWidth || window.innerWidth;
      const totalScroll = scrollContainer.scrollWidth - containerWidth;
      return -totalScroll;
    };

    const scrollAmount = Math.abs(getScrollAmount());
    
    const tween = gsap.to(scrollContainer, {
      x: getScrollAmount,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        start: "top 10%",
        end: () => `+=${scrollAmount}`,
        invalidateOnRefresh: true,
      },
    });

    if (tween.scrollTrigger?.pin) {
      (tween.scrollTrigger.pin as HTMLElement).style.zIndex = "10";
    }

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        tween.scrollTrigger?.kill();
        gsap.set(scrollContainer, { x: 0 });
        setIsMobile(true);
      } else {
        setIsMobile(false);
        ScrollTrigger.refresh();
      }
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      tween.scrollTrigger?.kill();
    };
  }, { scope: containerRef, dependencies: [isMobile] });

  const features: Feature[] = [
    {
      id: "00",
      title: "Materials Hub",
      description: "Complete control over your study assets. Edit terms directly, organize reviewers into color-coded categories, and reorder flashcards with simple drag & drop.",
      visual: <MaterialsVisual />
    },
    {
      id: "01",
      title: "Intelligent Content Summarization",
      description: "Transform dense lecture notes into structured reviewers. Our AI extracts key concepts and definitions, creating concise summaries tailored to your learning needs.",
      visual: <ReviewerVisual />
    },
    {
      id: "02",
      title: "Interactive Study Modes",
      description: "Engage with your materials through diverse modes. Use flashcards, practice tests, or challenge yourself with match mode for speed learning.",
      visual: <LearnVisual />
    },
    {
      id: "03",
      title: "Productivity Hub",
      description: "Customize your pomodoro environment with background images, ambient sounds, and fullscreen mode. Manage tasks with reminders and track your sessions.",
      visual: <TimerVisual />
    },
    {
      id: "04",
      title: "Gamified Achievements",
      description: "Level up your learning. Earn trophies and XP for every study session, streak, and mastered deck. Make progress addictive.",
      visual: <AchievementsVisual />
    },
    {
      id: "05",
      title: "Study Progress Calendar",
      description: "Visualize your consistency. Track your daily study activity with a contribution graph and maintain your streak to build lasting habits.",
      visual: <CalendarVisual />
    },
  ];


  const mobileSectionRef = useRef<HTMLElement>(null);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);
  const mobileCardsRef = useRef<HTMLDivElement>(null);
  const desktopTitleRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!isMobile) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    if (mobileHeaderRef.current) {
      gsap.fromTo(mobileHeaderRef.current, 
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: mobileHeaderRef.current,
            start: "top 90%",
            toggleActions: "play none none none",
          }
        }
      );
    }

    if (mobileCardsRef.current) {
      const cards = mobileCardsRef.current.querySelectorAll('.feature-card');
      gsap.fromTo(cards, 
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: mobileCardsRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          }
        }
      );
    }
  }, { dependencies: [isMobile] });

  useGSAP(() => {
    if (isMobile || !desktopTitleRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    gsap.fromTo(desktopTitleRef.current,
      { opacity: 0, x: -40 },
      {
        opacity: 1,
        x: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: desktopTitleRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        }
      }
    );
  }, { dependencies: [isMobile] });

  const mobileScrollContainerRef = useRef<HTMLDivElement>(null);
  const mobileWrapperRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!isMobile) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
  }, { dependencies: [isMobile] });

  return (
    <>
      {/* Mobile/Tablet: Horizontal scroll layout */}
      <section ref={mobileSectionRef} className="lg:hidden relative">
        <div ref={mobileHeaderRef} className="text-center pt-4 pb-6 sm:pt-6 sm:pb-8 px-4 sm:px-6">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl leading-[1.1] tracking-tight font-normal mb-4">
            What you&apos;ll unlock
            <span className="block font-serif italic text-muted-foreground">with DeepTerm</span>
          </h2>
          <p className="text-sm sm:text-base max-w-md mx-auto text-muted-foreground">
            A complete ecosystem of tools designed to transform your study workflow from chaotic to structured.
          </p>
        </div>

        <div ref={mobileWrapperRef} className="min-h-[520px] sm:min-h-[550px] flex items-center overflow-hidden">
          <div ref={mobileScrollContainerRef} className="flex gap-4 sm:gap-6 pl-4 sm:pl-6 pr-4 sm:pr-6">
            {features.map((feature) => (
              <div key={feature.id} className="feature-card w-[88vw] sm:w-[75vw] md:w-[65vw] max-w-[520px] flex-shrink-0">
                <div className="flex flex-col gap-3">
                  <h3 className="font-sans font-medium text-lg sm:text-xl text-foreground">{feature.title}</h3>
                  <div className="w-full aspect-[4/3] sm:aspect-[16/10] rounded-[18px] overflow-hidden border relative bg-muted border-border">
                    {feature.visual}
                  </div>
                  <p className="font-sans text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Desktop: Horizontal scroll layout with GSAP */}
      <section ref={containerRef} className="hidden lg:flex relative min-h-[600px] h-[80vh] max-h-[900px] items-center overflow-hidden">
        <div ref={desktopTitleRef} className="w-[320px] xl:w-[380px] flex-shrink-0 pl-8 xl:pl-16 pr-4 z-10">
          <h2 className="font-serif text-4xl xl:text-5xl leading-[1.1] tracking-tight font-normal mb-4">
            What you&apos;ll unlock with
            <span className="block font-serif italic text-muted-foreground">DeepTerm</span>
          </h2>
          <p className="font-sans text-base xl:text-lg max-w-sm text-muted-foreground">
            A complete ecosystem of tools designed to transform your study workflow from chaotic to structured.
          </p>
        </div>

        <div className="flex-1 h-full flex items-center overflow-hidden">
          <div ref={scrollContainerRef} className="flex gap-8 py-12">
            {features.map((feature) => (
              <div key={feature.id} className="feature-card w-[700px] flex-shrink-0">
                <div className="flex flex-col gap-4">
                  <div className="flex-shrink-0 py-2">
                    <h3 className="font-sans font-medium text-2xl text-foreground">{feature.title}</h3>
                  </div>
                  <div className="w-full aspect-[16/10] rounded-[18px] overflow-hidden border relative bg-muted border-border">
                    {feature.visual}
                  </div>
                  <p className="font-sans text-base leading-relaxed max-w-2xl text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}


function MaterialsVisual() {
  return (
    <div className="w-full h-full p-2 sm:p-6 flex items-center justify-center">
      <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full max-w-2xl">
        {[
          { title: "Biology 101: Cell Structure", type: "Reviewer", count: 12, date: "2h ago" },
          { title: "Chemistry Finals Deck", type: "Flashcards", count: 45, date: "5h ago" },
          { title: "History: World War II", type: "Reviewer", count: 8, date: "1d ago" },
          { title: "Physics Formulas", type: "Flashcards", count: 24, date: "2d ago" },
        ].map((item, i) => (
          <div key={i} className="rounded-lg sm:rounded-xl p-2 sm:p-4 border transition-all cursor-pointer group relative bg-white border-border hover:border-border hover:shadow-lg">
            <div className="flex justify-between items-start mb-1.5 sm:mb-3">
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[8px] sm:text-[10px] font-medium uppercase tracking-wider flex items-center gap-0.5 sm:gap-1 ${
                item.type === "Reviewer" ? "bg-primary text-white" : "bg-muted text-foreground"
              }`}>
                {item.type === "Reviewer" ? <FileText size={8} className="sm:w-[10px] sm:h-[10px]" /> : <Copy size={8} className="sm:w-[10px] sm:h-[10px]" />}
                <span className="hidden sm:inline">{item.type === "Flashcards" ? "Cards" : "Reviewer"} · </span>{item.count}
              </span>
              <div className="p-0.5 sm:p-1 rounded-full text-muted-foreground">
                <GripVertical size={10} className="sm:w-[14px] sm:h-[14px]" />
              </div>
            </div>
            <div className="mb-1.5 sm:mb-3">
              <h3 className="font-sans font-medium text-[10px] sm:text-sm line-clamp-2 text-foreground">{item.title}</h3>
            </div>
            <div className="flex items-center text-[8px] sm:text-xs text-muted-foreground">
              <div className="flex items-center gap-0.5 sm:gap-1">
                <ScanLine size={8} className="sm:w-[12px] sm:h-[12px]" />
                <span>{item.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewerVisual() {
  return (
    <div className="w-full h-full p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-4">
        {[
          { name: "Cell Biology", count: 12, color: "#22c55e", expanded: true },
          { name: "Genetics", count: 8, color: "#3b82f6", expanded: false },
        ].map((category, i) => (
          <div key={i} className="rounded-xl border overflow-hidden shadow-sm bg-white border-border">
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              style={{ borderLeft: `4px solid ${category.color}` }}
            >
              <div className="flex items-center gap-4">
                <h3 className="font-sans font-medium text-foreground">{category.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {category.count} terms
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Plus size={16} />
                <Trash2 size={16} />
              </div>
            </div>
            {category.expanded && (
              <div className="border-t border-border">
                <div className="p-4 grid gap-3">
                  {[
                    { term: "Mitosis", def: "Process of nuclear division in eukaryotic cells." },
                    { term: "Meiosis", def: "Type of cell division that reduces chromosome number." }
                  ].map((term, j) => (
                    <div key={j} className="p-3 rounded-lg border flex justify-between items-start bg-muted border-border">
                      <div>
                        <h4 className="font-medium text-sm mb-1 text-foreground">{term.term}</h4>
                        <p className="text-xs text-muted-foreground">{term.def}</p>
                      </div>
                      <div className="opacity-50 text-foreground">
                        <Edit2 size={12} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function LearnVisual() {
  return (
    <div className="w-full h-full relative overflow-hidden flex items-center justify-center p-3 sm:p-8 bg-gray-100">
      <div className="w-full max-w-2xl rounded-2xl sm:rounded-3xl border p-3 sm:p-6 lg:p-8 flex flex-col gap-3 sm:gap-6 bg-white border-gray-200">
        <div className="flex justify-between items-start">
          <span className="text-[10px] sm:text-sm font-medium text-gray-500">Definition</span>
          <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-xs font-medium rounded-full flex items-center gap-1 bg-blue-100 text-blue-600">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full border-2 border-blue-600" />
            New cards
          </span>
        </div>

        <p className="text-xs sm:text-base lg:text-xl font-sans font-medium leading-relaxed text-foreground">
          Process of nuclear division in eukaryotic cells that occurs when a parent cell divides to produce two identical daughter cells.
        </p>

        <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-1 sm:mt-4">
          {["Meiosis", "Mitosis", "Cytokinesis", "Interphase"].map((opt, i) => (
            <div key={i} className="p-2 sm:p-4 border rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-4 bg-white border-gray-200 text-foreground">
              <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full font-medium flex items-center justify-center text-[10px] sm:text-sm bg-blue-100 text-blue-600">
                {String.fromCharCode(65 + i)}
              </div>
              <span className="font-medium text-[10px] sm:text-sm">{opt}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function TimerVisual() {
  return (
    <div className="w-full h-full p-4 flex items-center justify-center gap-4">
      {/* Timer Card */}
      <div 
        className="relative w-[55%] h-full rounded-[20px] p-4 text-center text-white overflow-hidden flex flex-col items-center justify-between"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url('/assets/studyart.webp')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute top-3 right-3 flex gap-1.5 z-20">
          <div className="w-7 h-7 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/25 transition-all" title="Change background">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div className="w-7 h-7 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/25 transition-all" title="Fullscreen">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </div>
        </div>

        <div className="flex gap-1.5 relative z-10 w-full justify-center mt-1">
          {["Focus", "Short", "Long"].map((label, i) => (
            <div key={i} className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition-all backdrop-blur-sm ${
              i === 0 ? "bg-white/25 scale-105" : "bg-white/10 opacity-70"
            }`}>
              {label}
            </div>
          ))}
        </div>

        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle cx="50%" cy="50%" r="45%" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
            <circle cx="50%" cy="50%" r="45%" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 45}%`} strokeDashoffset={`${2 * Math.PI * 45 * 0.25}%`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-light tracking-wider text-white">18:45</span>
            <span className="text-[8px] text-white/70 uppercase tracking-widest mt-0.5">Focus</span>
          </div>
        </div>

        <div className="flex gap-1.5 mb-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= 2 ? "bg-white" : "bg-white/25"}`} />
          ))}
        </div>

        <div className="flex items-center gap-2 w-full justify-center">
          <div className="h-8 px-4 rounded-full flex items-center justify-center font-medium text-xs shadow-lg cursor-pointer transition-transform hover:scale-105 bg-white text-foreground">
            Pause
          </div>
          <div className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/25">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </div>
        </div>
      </div>

      {/* Tasks Panel */}
      <div className="w-[40%] h-full rounded-[16px] p-3 flex flex-col overflow-hidden bg-white border border-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-sans font-medium text-xs text-foreground">Tasks</h4>
          <div className="w-5 h-5 rounded-full flex items-center justify-center cursor-pointer bg-muted text-foreground">
            <Plus size={12} />
          </div>
        </div>
        
        <div className="flex-1 space-y-1.5 overflow-hidden">
          {[
            { text: "Review Chapter 5", completed: true, reminder: null },
            { text: "Practice problems", completed: false, reminder: "14:30" },
            { text: "Write summary notes", completed: false, reminder: null },
          ].map((task, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg transition-all bg-muted hover:bg-accent">
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 ${
                task.completed ? "bg-primary border-primary" : "border-input"
              }`}>
                {task.completed && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className={`text-[10px] leading-tight block ${
                  task.completed ? "text-muted-foreground line-through" : "text-foreground"
                }`}>
                  {task.text}
                </span>
                {task.reminder && (
                  <span className="text-[8px] flex items-center gap-0.5 mt-0.5 text-muted-foreground">
                    <Zap size={6} /> {task.reminder}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AchievementsVisual() {
  const achievements = [
    { icon: "Trophy", title: "First Steps", description: "Create your first material", progress: 1, requirement: 1, unlocked: true, bg: "bg-yellow-100", color: "text-yellow-600" },
    { icon: "Flame", title: "On Fire", description: "Maintain a 7-day streak", progress: 7, requirement: 7, unlocked: true, bg: "bg-orange-100", color: "text-orange-600" },
    { icon: "BookOpen", title: "Bookworm", description: "Study 100 flashcards", progress: 100, requirement: 100, unlocked: true, bg: "bg-blue-100", color: "text-blue-600" },
    { icon: "Star", title: "Master", description: "Master 50 cards", progress: 32, requirement: 50, unlocked: false, bg: "bg-purple-100", color: "text-purple-600" },
  ];

  return (
    <div className="w-full h-full p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-sans tracking-tight text-lg text-foreground">Achievements</h3>
          <span className="text-muted-foreground text-sm font-sans">3/4 Unlocked</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((achievement, i) => {
            const progressPercent = Math.round((achievement.progress / achievement.requirement) * 100);
            return (
              <div
                key={i}
                className={`relative p-3 rounded-xl border transition-all ${
                  achievement.unlocked
                    ? "bg-white border-border shadow-sm"
                    : "bg-muted border-border opacity-70 grayscale-[0.3]"
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${achievement.bg} flex items-center justify-center mb-2`}>
                  {achievement.icon === "Trophy" && (
                    <svg className={`w-4 h-4 ${achievement.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m-4-8a4 4 0 01-4-4V5a2 2 0 012-2h12a2 2 0 012 2v4a4 4 0 01-4 4m-4 0v4" />
                    </svg>
                  )}
                  {achievement.icon === "Flame" && (
                    <svg className={`w-4 h-4 ${achievement.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                    </svg>
                  )}
                  {achievement.icon === "BookOpen" && (
                    <svg className={`w-4 h-4 ${achievement.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                  {achievement.icon === "Star" && (
                    <svg className={`w-4 h-4 ${achievement.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  )}
                </div>
                <h4 className="font-sans font-medium text-foreground text-[12px] sm:text-[13px] mb-0.5">{achievement.title}</h4>
                <p className="font-sans text-[10px] text-muted-foreground mb-2 leading-tight">{achievement.description}</p>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${achievement.unlocked ? "bg-green-500" : "bg-primary/40"}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="font-sans text-[9px] text-muted-foreground mt-0.5">
                  {achievement.progress}/{achievement.requirement}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Warm amber/orange gradient for activity levels (matching actual dashboard)
const LEVEL_COLORS = ["bg-[#f5f5f0]", "bg-[#f5e6c8]", "bg-[#e8c896]", "bg-[#d4a574]", "bg-[#c4875a]"];
const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Pre-computed calendar data to avoid Math.random() during render
const CALENDAR_DATA = [
  { day: 1, level: 0 }, { day: 2, level: 1 }, { day: 3, level: 2 }, { day: 4, level: 0 }, { day: 5, level: 3 }, { day: 6, level: 1 }, { day: 7, level: 0 },
  { day: 8, level: 2 }, { day: 9, level: 4 }, { day: 10, level: 3 }, { day: 11, level: 2 }, { day: 12, level: 1 }, { day: 13, level: 0 }, { day: 14, level: 2 },
  { day: 15, level: 3 }, { day: 16, level: 4 }, { day: 17, level: 2 }, { day: 18, level: 1 }, { day: 19, level: 3 }, { day: 20, level: 2 }, { day: 21, level: 0 },
  { day: 22, level: 1 }, { day: 23, level: 2 }, { day: 24, level: 4 }, { day: 25, level: 3 }, { day: 26, level: 2 }, { day: 27, level: 1 }, { day: 28, level: 0 },
  { day: 29, level: 2 }, { day: 30, level: 3 }, { day: 31, level: 4 }, { day: 0, level: 0 }, { day: 0, level: 0 }, { day: 0, level: 0 }, { day: 0, level: 0 },
];

function CalendarVisual() {
  return (
    <div className="w-full h-full p-3 sm:p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#f5e6c8] px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-muted-foreground" />
            <h2 className="font-sans tracking-tight text-sm text-foreground">Study History</h2>
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-white">
          <button className="w-6 h-6 flex items-center justify-center border border-border rounded hover:bg-accent">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="font-sans tracking-tight text-xs text-foreground font-medium">December 2025</span>
          <button className="w-6 h-6 flex items-center justify-center border border-border rounded hover:bg-accent">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 bg-[#f5f0e0]">
          {DAY_HEADERS.map((day) => (
            <div key={day} className="py-1 text-center text-[9px] text-muted-foreground font-medium border-b border-r border-border last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {CALENDAR_DATA.map((cell, i) => (
            <div
              key={i}
              className={`h-8 sm:h-10 flex items-center justify-center text-[10px] font-medium border-b border-r border-border ${LEVEL_COLORS[cell.level]} ${cell.day === 8 ? "ring-2 ring-[#c4875a] ring-inset" : ""} ${cell.day === 0 ? "text-muted-foreground" : "text-foreground"}`}
            >
              {cell.day > 0 ? cell.day : ""}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex justify-center items-center gap-2 py-2 border-t border-border">
          <span className="text-[9px] text-muted-foreground">Less</span>
          <div className="flex gap-0.5">
            {LEVEL_COLORS.map((color, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-sm ${color} border border-border`} />
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground">More</span>
        </div>
      </div>
    </div>
  );
}
