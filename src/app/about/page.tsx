"use client";

import { motion } from "framer-motion";
import { Heart, Users, Globe, BookOpen, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const values = [
  {
    icon: Heart,
    title: "Free Forever",
    description:
      "Education should never be locked behind a paywall. DeepTerm is and always will be completely free for students everywhere.",
  },
  {
    icon: Globe,
    title: "Accessible Anywhere",
    description:
      "No downloads, no installations. Just open your browser and start studying. Works on any device with an internet connection.",
  },
  {
    icon: Zap,
    title: "Simple & Intuitive",
    description:
      "We believe powerful tools don't need to be complicated. DeepTerm is designed to be easy to use from day one.",
  },
  {
    icon: Users,
    title: "Built for Students",
    description:
      "Every feature is crafted with students in mind. We understand the challenges of studying and built tools to overcome them.",
  },
];

const features = [
  "100% free to use with no hidden costs",
  "AI-powered content extraction and generation",
  "Privacy-focused - your data stays yours",
  "Quick sign-in with Google to get started",
  "Works with PDF, DOCX, and plain text",
  "Access from any device, anywhere",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f0f0ea] flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 py-10 sm:py-14 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-serif text-[32px] sm:text-[44px] text-[#171d2b] mb-4 leading-tight">
              About DeepTerm
            </h1>
            <p className="font-sans text-[#171d2b]/70 text-[15px] sm:text-[17px] leading-relaxed max-w-2xl mx-auto">
              Every student deserves access to powerful study tools without
              financial barriers or technical hurdles.
            </p>
          </motion.div>
        </section>

        {/* Origin Story */}
        <section className="px-4 sm:px-6 pb-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white rounded-2xl p-6 sm:p-8 border border-[#171d2b]/10"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#171d2b] flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="font-serif text-xl sm:text-2xl text-[#171d2b]">
                Why I Built This
              </h2>
            </div>
            <div className="space-y-3 font-sans text-[#171d2b]/70 text-[14px] sm:text-[15px] leading-relaxed">
              <p>
                I started DeepTerm because students everywhere were struggling
                with expensive study apps, complicated software requiring
                downloads, and tools that weren&apos;t designed with their
                actual needs in mind.
              </p>
              <p>
                The vision was clear: a completely free, on-the-go study
                platform accessible instantly from any device. No credit cards,
                no downloads, no complicated setup. Just open your browser and
                start learning.
              </p>
              <p>
                DeepTerm combines AI with intuitive design to transform any
                study material into flashcards, practice tests, and organized
                reviewers in seconds. Education is a right, not a privilege.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Values Grid */}
        <section className="px-4 sm:px-6 pb-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center mb-6"
          >
            <h2 className="font-serif text-xl sm:text-2xl text-[#171d2b] mb-2">
              What I Stand For
            </h2>
            <p className="font-sans text-[#171d2b]/60 text-[14px]">
              Core values guiding every decision.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
                className="bg-white p-4 sm:p-5 rounded-xl border border-[#171d2b]/10"
              >
                <div className="w-10 h-10 rounded-lg bg-[#f0f0ea] flex items-center justify-center mb-3">
                  <value.icon className="w-5 h-5 text-[#171d2b]" />
                </div>
                <h3 className="font-serif text-[15px] sm:text-[16px] text-[#171d2b] mb-1">
                  {value.title}
                </h3>
                <p className="font-sans text-[#171d2b]/60 text-[12px] sm:text-[13px] leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features List */}
        <section className="px-4 sm:px-6 pb-12 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-[#171d2b] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden"
          >
            <div className="relative z-10">
              <h2 className="font-serif text-2xl sm:text-3xl mb-6">
                What Makes DeepTerm Different
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 font-sans text-white/80 text-[14px] sm:text-[15px]"
                  >
                    <span className="text-white mt-0.5">→</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-white blur-[100px]" />
              <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] rounded-full bg-white blur-[100px]" />
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
