"use client";

import { FileText, Brain, Gamepad2 } from "lucide-react";
import { Reveal } from "@/components/ui";

const steps = [
  {
    number: "01",
    title: "Upload or paste",
    description: "Drop a PDF or paste notes. You can start without an account.",
    icon: FileText,
  },
  {
    number: "02",
    title: "AI processes",
    description: "Gemini pulls key terms and builds flashcards, reviewers, and practice tests.",
    icon: Brain,
  },
  {
    number: "03",
    title: "Study and succeed",
    description: "Review, practice, and track XP. Levels follow the work you actually do.",
    icon: Gamepad2,
  },
];

export default function StepsSection() {
  return (
    <section className="relative z-10">
      <Reveal className="text-center mb-8 sm:mb-10">
        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground mb-3">
          How it works
        </p>
        <h2 className="font-serif text-[28px] sm:text-[36px] leading-[1.1] tracking-tight font-normal mb-3">
          Three steps
        </h2>
        <p className="text-sm max-w-[46ch] mx-auto text-muted-foreground">
          From notes to a study set without a setup wizard.
        </p>
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Reveal key={step.number} delay={index * 80}>
              <article className="plate h-full p-5 sm:p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs tabular-nums tracking-[0.12em] text-muted-foreground">
                    {step.number}
                  </span>
                  <span className="size-8 rounded-full bg-muted flex items-center justify-center" aria-hidden="true">
                    <Icon className="size-4 text-foreground" />
                  </span>
                </div>
                <h3 className="text-base font-medium tracking-tight">{step.title}</h3>
                <p className="text-sm leading-6 text-muted-foreground">{step.description}</p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
