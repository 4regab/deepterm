import { Metadata } from "next";
import { headers } from "next/headers";
import HomeClient from "./HomeClient";
import { generateFAQJsonLd, siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: "DeepTerm - Free AI Study Tools | Quizlet & Gizmo Alternative",
  description:
    "Transform any study material into flashcards, reviewers, and practice tests with AI. Free alternative to Quizlet and Gizmo. Study smarter, not harder.",
  keywords: [
    "free study app",
    "open source study app",
    "AI-powered study tool",
    "study materials",
    "flashcards",
    "reviewer notes",
    "AI-powered flashcards",
    "AI-powered reviewer notes",
    "AI-powered practice tests",
    "AI-powered study plans",
    "AI-powered study guides",
    "AI-powered study resources",
    "AI-powered study tools",
    "AI-powered study app",
    "AI-powered study software",
    "AI-powered study platform",
    "AI-powered study website",
    "AI-powered study app",
    "AI-powered study app",
    "quizlet alternative",
    "gizmo alternative",
    "AI flashcards",
    "practice tests",
    "study tools",
    "spaced repetition",
    "exam prep",
    "pomodoro timer",
    "free flashcard maker",
  ],
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    title: "DeepTerm - Free AI Study Tools | Quizlet & Gizmo Alternative",
    description:
      "Transform any study material into flashcards, reviewers, and practice tests with AI. Free alternative to Quizlet and Gizmo.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "DeepTerm - Study smarter, not harder",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeepTerm - Free AI Study Tools",
    description:
      "Transform any study material into flashcards, reviewers, and practice tests with AI.",
    images: [siteConfig.ogImage],
  },
};

// FAQ data for JSON-LD
const homeFaqs = [
  {
    question: "How does DeepTerm work?",
    answer:
      "DeepTerm uses Google's Gemini AI to analyze your uploaded PDFs, DOCX files, images, or pasted text. It identifies key concepts, definitions, and important terms, then automatically generates flashcards and reviewer notes tailored to your content.",
  },
  {
    question: "Is DeepTerm free to use?",
    answer:
      "Yes! DeepTerm is completely free to use. You get 10 AI generations per day, which resets daily. There's no credit card required, no hidden fees, and no premium tier that locks essential features.",
  },
  {
    question: "What file formats does DeepTerm support?",
    answer:
      "DeepTerm supports PDF, DOCX, PNG, JPEG, and WebP files, plus plain text you paste into the editor. Upload a document or paste notes directly — whichever is fastest for you.",
  },
  {
    question: "How does the gamification system work?",
    answer:
      "Every study action earns you XP - completing flashcard sessions, taking practice tests, maintaining study streaks, and more. As you accumulate XP, you level up and unlock achievements that track your learning milestones.",
  },
  {
    question: "Can I share my study materials?",
    answer:
      "Absolutely! You can generate shareable links for any of your flashcard decks or reviewers. Anyone with the link can view and study from your materials without needing an account.",
  },
];

export default async function Home() {
  const nonce = (await headers()).get("x-nonce") ?? "";
  const faqJsonLd = generateFAQJsonLd(homeFaqs);

  return (
    <>
      <script
        id="faq-jsonld"
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <HomeClient />
    </>
  );
}
