"use client";

import { useId, useState, useRef } from "react";
import { Plus, X, HelpCircle } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/lib/motion";

gsap.registerPlugin(ScrollTrigger);

interface FAQItem {
  question: string;
  answer: string;
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
  panelId,
  buttonId,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  panelId: string;
  buttonId: string;
}) {
  return (
    <div className="border-b transition-colors border-[#171d2b]/15">
      <button
        type="button"
        id={buttonId}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full py-5 sm:py-6 flex items-center justify-between gap-4 text-left transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0f0ea] rounded-sm"
      >
        <span className={`font-sans font-medium text-[15px] sm:text-[17px] lg:text-[18px] pr-4 transition-colors ${
          isOpen ? "text-[#171d2b]" : "text-[#171d2b]/85 group-hover:text-[#171d2b]"
        }`}>
          {item.question}
        </span>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
          isOpen ? "bg-[#171d2b] text-white" : "bg-[#171d2b]/10 text-[#171d2b]/55"
        }`} aria-hidden="true">
          {isOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </div>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={`overflow-hidden transition-all duration-300 ease-out ${
          isOpen ? "max-h-[500px] opacity-100 pb-5 sm:pb-6" : "max-h-0 opacity-0"
        }`}
        inert={!isOpen ? true : undefined}
      >
        <p className="font-sans text-[14px] sm:text-[15px] leading-[1.7] pr-12 text-[#171d2b]/75">
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);
  const baseId = useId();

  const faqs: FAQItem[] = [
    {
      question: "How does DeepTerm generate flashcards?",
      answer: "DeepTerm uses Google's Gemini AI to analyze your uploaded PDFs, DOCX files, images, or pasted text. It identifies key concepts, definitions, and important terms, then automatically generates flashcards and reviewer notes tailored to your content.",
    },
    {
      question: "Is DeepTerm really free?",
      answer: "Yes! DeepTerm is completely free to use. You get 10 AI generations per day, which resets daily. There's no credit card required, no hidden fees, and no premium tier that locks essential features.",
    },
    {
      question: "What file formats are supported?",
      answer: "DeepTerm supports PDF, DOCX, PNG, JPEG, and WebP files, plus plain text you paste into the editor. Upload a document or paste notes directly — whichever is fastest for you.",
    },
    {
      question: "How does the gamification system work?",
      answer: "Every study action earns you XP — completing flashcard sessions, taking practice tests, maintaining study streaks, and more. As you accumulate XP, you level up and unlock achievements that track your learning milestones.",
    },
    {
      question: "Can I share my study materials?",
      answer: "Absolutely! You can generate shareable links for any of your flashcard decks or reviewers. Anyone with the link can view and study from your materials without needing an account.",
    },
  ];

  useGSAP(() => {
    if (!sectionRef.current || prefersReducedMotion()) return;

    const leftCol = sectionRef.current.querySelector('.faq-left');
    const rightCol = sectionRef.current.querySelector('.faq-right');

    if (leftCol) {
      gsap.fromTo(leftCol,
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          }
        }
      );
    }

    if (rightCol) {
      gsap.fromTo(rightCol,
        { opacity: 0, x: 30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.7,
          delay: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          }
        }
      );
    }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="faq" className="relative z-10 px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 scroll-mt-24">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">

          {/* Left Column - Title & Support */}
          <div className="faq-left lg:w-[320px] flex-shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-medium mb-6 bg-[#171d2b]/5 text-[#171d2b]/70">
              <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Support
            </div>

            <h2 className="font-serif text-[32px] sm:text-[40px] lg:text-[48px] leading-[1.1] mb-4 text-[#171d2b]">
              Frequently<br />
              <span className="text-[#171d2b]/70">Asked.</span>
            </h2>

            <p className="font-sans text-[14px] sm:text-[15px] leading-relaxed text-[#171d2b]/75">
              Everything you need to know about using DeepTerm.
            </p>
          </div>

          {/* Right Column - Accordion */}
          <div className="faq-right flex-1">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                item={faq}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
                buttonId={`${baseId}-btn-${index}`}
                panelId={`${baseId}-panel-${index}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
