import { Metadata } from "next";
import HelpClient from "./HelpClient";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Help Center - DeepTerm",
  description:
    "Get help with DeepTerm's study tools. Learn how to use flashcards, practice tests, reviewers, pomodoro timer, and more.",
  path: "/help",
});

export default function HelpPage() {
  return <HelpClient />;
}
