"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Reveal } from "@/components/ui";
import { cn } from "@/lib/cn";

interface FAQItem {
  question: string;
  answer: string;
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full py-5 sm:py-6 flex items-center justify-between gap-4 text-left group min-h-11"
      >
        <span className={cn(
          "font-sans font-medium text-[15px] sm:text-[17px] pr-4 transition-colors duration-150",
          isOpen ? "text-foreground" : "text-foreground/80 group-hover:text-foreground"
        )}>
          {item.question}
        </span>
        <span
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-[background-color,color] duration-150",
            isOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
          aria-hidden="true"
        >
          {isOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </span>
      </button>
      <div className="faq-panel" data-open={isOpen}>
        <div className="overflow-hidden">
          <p className="font-sans text-sm sm:text-[15px] leading-6 pr-12 pb-5 text-muted-foreground">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: "How does DeepTerm generate flashcards?",
      answer: "DeepTerm uses Google Gemini to read your PDF or pasted text, pull out key terms, and turn them into flashcards and reviewer notes.",
    },
    {
      question: "Is DeepTerm really free?",
      answer: "Yes. You get 10 AI generations per day, resetting at midnight UTC. No card, no premium tier that locks the study tools.",
    },
    {
      question: "What file formats are supported?",
      answer: "PDF files and plain text. Upload a document or paste notes into the editor. DOCX and images are on the way.",
    },
    {
      question: "How does the gamification system work?",
      answer: "Study sessions, practice tests, and streaks earn XP. Levels unlock rank titles and achievements that track milestones.",
    },
    {
      question: "Can I share my study materials?",
      answer: "Yes. Create a share link for any deck or reviewer. Anyone with the link can study it, even without an account.",
    },
  ];

  return (
    <section className="relative z-10">
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          <Reveal className="lg:w-[320px] flex-shrink-0">
            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground mb-4">
              Support
            </p>
            <h2 className="text-[32px] sm:text-[40px] leading-[1.1] tracking-tight font-medium mb-4">
              Frequently asked
            </h2>
            <p className="font-sans text-sm sm:text-[15px] leading-6 text-muted-foreground">
              Short answers to how DeepTerm works, what it costs, and how sharing works.
            </p>
          </Reveal>

          <Reveal delay={80} className="flex-1 plate px-5 sm:px-6">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.question}
                item={faq}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </Reveal>
        </div>
    </section>
  );
}
