"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Rocket,
  FileText,
  BrainCircuit,
  Zap,
  Timer,
  ArrowRight,
  ChevronDown,
  Settings,
  Trophy,
  Calendar,
  TrendingUp,
} from "lucide-react";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer";

// Interfaces
interface FAQItem {
  question: string;
  answer: string;
}

interface CategoryContent {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  content: string;
  features?: string[];
  steps?: string[];
  faqs: FAQItem[];
}

// Categories data
const categories: CategoryContent[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: <Rocket className="w-6 h-6" />,
    description: "Learn the basics of DeepTerm and start your learning journey.",
    content:
      "Welcome to DeepTerm! Our AI-powered study platform helps you transform any study material into interactive learning tools. Whether you're preparing for exams, learning new concepts, or reviewing material, DeepTerm has the tools you need to succeed.",
    features: [
      "Upload any study material (PDFs, documents, text)",
      "AI automatically generates flashcards, quizzes, and reviewers",
      "Track your progress with detailed analytics",
      "Gamified learning experience with achievements and levels",
      "Pomodoro timer for focused study sessions",
    ],
    steps: [
      "Sign up or log in with your Google account",
      "Navigate to the Materials section",
      "Upload your study material or paste text",
      "Choose your study mode: Flashcards, Quiz, or Reviewer",
      "Start learning and track your progress!",
    ],
    faqs: [
      {
        question: "Is DeepTerm free to use?",
        answer:
          "Yes! DeepTerm is completely free and open source. You can use all features without any payment or subscription.",
      },
      {
        question: "What file formats are supported?",
        answer:
          "DeepTerm supports PDF files, text documents, and direct text input. We're constantly working to add more format support.",
      },
      {
        question: "Do I need to create an account?",
        answer:
          "Yes, you need to sign in with your Google account to save your progress, materials, and achievements.",
      },
    ],
  },
  {
    id: "reviewer",
    title: "Reviewer",
    icon: <FileText className="w-6 h-6" />,
    description: "Create comprehensive study reviewers from your materials.",
    content:
      "The Reviewer feature transforms your study materials into organized, easy-to-read summaries. Perfect for quick revision before exams or understanding complex topics at a glance.",
    features: [
      "AI-generated summaries of key concepts",
      "Organized by topics and subtopics",
      "Highlight important terms and definitions",
      "Export reviewers for offline study",
      "Share reviewers with classmates",
    ],
    steps: [
      "Upload your study material",
      "Select 'Reviewer' as your study mode",
      "Wait for AI to process and generate the reviewer",
      "Review the organized content",
      "Use the reviewer for quick revision sessions",
    ],
    faqs: [
      {
        question: "How long does it take to generate a reviewer?",
        answer:
          "Generation time depends on the length of your material. Most reviewers are ready within 30 seconds to 2 minutes.",
      },
      {
        question: "Can I edit the generated reviewer?",
        answer:
          "Currently, reviewers are read-only. We're working on adding editing capabilities in future updates.",
      },
      {
        question: "Can I share my reviewer with others?",
        answer:
          "Yes! You can share your reviewer using the share feature, which generates a unique link for others to view.",
      },
    ],
  },
  {
    id: "quiz",
    title: "Quiz Mode",
    icon: <BrainCircuit className="w-6 h-6" />,
    description: "Test your knowledge with AI-generated practice tests.",
    content:
      "Quiz Mode creates comprehensive practice tests from your study materials. Test your understanding with multiple choice, true/false, and short answer questions tailored to your content.",
    features: [
      "Multiple question types (MCQ, True/False, Short Answer)",
      "Instant feedback on answers",
      "Detailed explanations for each question",
      "Track quiz scores and improvement over time",
      "Retry quizzes to improve your score",
    ],
    steps: [
      "Select your study material",
      "Choose 'Quiz' as your study mode",
      "Configure quiz settings (number of questions, difficulty)",
      "Take the quiz and submit your answers",
      "Review your results and explanations",
    ],
    faqs: [
      {
        question: "How many questions are in each quiz?",
        answer:
          "You can customize the number of questions before starting. The default is 10 questions, but you can choose anywhere from 5 to 50.",
      },
      {
        question: "Can I retake a quiz?",
        answer:
          "Yes! You can retake any quiz as many times as you want. Your best score is saved for tracking purposes.",
      },
      {
        question: "Are the questions randomized?",
        answer:
          "Yes, questions are randomized each time you take a quiz to ensure a fresh testing experience.",
      },
    ],
  },
  {
    id: "flashcards",
    title: "Flashcards",
    icon: <Zap className="w-6 h-6" />,
    description: "Study with AI-generated flashcards using spaced repetition.",
    content:
      "Flashcards are one of the most effective study methods. DeepTerm automatically generates flashcards from your materials and uses spaced repetition to help you remember information longer.",
    features: [
      "AI-generated question and answer pairs",
      "Spaced repetition algorithm for optimal retention",
      "Flip cards to reveal answers",
      "Mark cards as known or needs review",
      "Track mastery progress for each card set",
    ],
    steps: [
      "Upload or select your study material",
      "Choose 'Flashcards' as your study mode",
      "Review each card by flipping to see the answer",
      "Mark cards based on your confidence level",
      "Continue reviewing until you've mastered all cards",
    ],
    faqs: [
      {
        question: "How does spaced repetition work?",
        answer:
          "Spaced repetition shows you cards at increasing intervals based on how well you know them. Cards you struggle with appear more frequently, while mastered cards appear less often.",
      },
      {
        question: "Can I create my own flashcards?",
        answer:
          "Currently, flashcards are AI-generated from your materials. Manual card creation is planned for a future update.",
      },
      {
        question: "How many flashcards are generated?",
        answer:
          "The number of flashcards depends on your material's content. Typically, 10-50 cards are generated per study session.",
      },
    ],
  },
  {
    id: "pomodoro",
    title: "Pomodoro Timer",
    icon: <Timer className="w-6 h-6" />,
    description: "Stay focused with the built-in Pomodoro technique timer.",
    content:
      "The Pomodoro Technique is a time management method that uses focused work intervals followed by short breaks. Our built-in timer helps you maintain concentration and avoid burnout during study sessions.",
    features: [
      "Customizable work and break durations",
      "Visual and audio notifications",
      "Session tracking and statistics",
      "Automatic break reminders",
      "Integration with study sessions",
    ],
    steps: [
      "Navigate to the Pomodoro section",
      "Set your preferred work duration (default: 25 minutes)",
      "Set your break duration (default: 5 minutes)",
      "Start the timer and focus on your study material",
      "Take a break when the timer ends, then repeat",
    ],
    faqs: [
      {
        question: "What is the Pomodoro Technique?",
        answer:
          "The Pomodoro Technique is a time management method where you work for 25 minutes, then take a 5-minute break. After 4 work sessions, you take a longer 15-30 minute break.",
      },
      {
        question: "Can I customize the timer durations?",
        answer:
          "Yes! You can customize both work and break durations to fit your personal study style and preferences.",
      },
      {
        question: "Does the timer work in the background?",
        answer:
          "Yes, the timer continues running even if you navigate to other parts of the app. You'll receive notifications when sessions end.",
      },
    ],
  },
  {
    id: "account",
    title: "Account Settings",
    icon: <Settings className="w-6 h-6" />,
    description: "Manage your account preferences and settings.",
    content:
      "Your account settings allow you to customize your DeepTerm experience. Manage your profile, notification preferences, and study settings all in one place.",
    features: [
      "Profile customization",
      "Notification preferences",
      "Study reminder settings",
      "Data export options",
      "Account security settings",
    ],
    steps: [
      "Click on your profile icon in the dashboard",
      "Select 'Settings' from the dropdown menu",
      "Navigate through different setting categories",
      "Make your desired changes",
      "Save your settings",
    ],
    faqs: [
      {
        question: "How do I change my profile picture?",
        answer:
          "Your profile picture is linked to your Google account. To change it, update your Google account profile picture.",
      },
      {
        question: "Can I delete my account?",
        answer:
          "Yes, you can request account deletion from the settings page. This will permanently remove all your data from our servers.",
      },
      {
        question: "How do I export my data?",
        answer:
          "You can export your study materials and progress data from the settings page. Data is exported in JSON format.",
      },
    ],
  },
  {
    id: "achievements",
    title: "Achievements",
    icon: <Trophy className="w-6 h-6" />,
    description: "Earn badges and rewards as you learn.",
    content:
      "Stay motivated with our achievement system! Earn badges for completing study milestones, maintaining streaks, and mastering content. Show off your accomplishments and compete with friends.",
    features: [
      "Various achievement categories",
      "Progress tracking for each achievement",
      "Rare and legendary badges",
      "Achievement showcase on profile",
      "Unlock rewards as you progress",
    ],
    steps: [
      "Study regularly to earn achievements",
      "Check your achievements page to see progress",
      "Complete specific challenges for special badges",
      "Share your achievements with friends",
      "Aim for rare achievements to stand out",
    ],
    faqs: [
      {
        question: "How do I earn achievements?",
        answer:
          "Achievements are earned automatically as you use DeepTerm. Complete quizzes, maintain study streaks, and master flashcards to unlock various badges.",
      },
      {
        question: "Can I see other users' achievements?",
        answer:
          "You can see achievements on shared profiles. Some achievements are displayed publicly while others remain private.",
      },
      {
        question: "Do achievements give any benefits?",
        answer:
          "Achievements contribute to your overall level and XP. Some achievements also unlock special features or customization options.",
      },
    ],
  },
  {
    id: "calendar",
    title: "Study Calendar",
    icon: <Calendar className="w-6 h-6" />,
    description: "Plan and track your study schedule.",
    content:
      "The Study Calendar helps you plan your learning journey. Schedule study sessions, set reminders, and track your consistency over time. Never miss a study session again!",
    features: [
      "Visual calendar view of study sessions",
      "Schedule future study sessions",
      "Set reminders and notifications",
      "Track study streaks",
      "View historical study data",
    ],
    steps: [
      "Navigate to the Calendar section",
      "Click on a date to schedule a study session",
      "Set the time and duration",
      "Choose which materials to study",
      "Enable reminders if desired",
    ],
    faqs: [
      {
        question: "How do study streaks work?",
        answer:
          "A study streak counts consecutive days you've completed at least one study session. Missing a day resets your streak to zero.",
      },
      {
        question: "Can I sync with external calendars?",
        answer:
          "External calendar sync (Google Calendar, Apple Calendar) is planned for a future update. Currently, the calendar is internal to DeepTerm.",
      },
      {
        question: "What happens if I miss a scheduled session?",
        answer:
          "Missed sessions are marked in your calendar history. You can reschedule or complete the session later, though it won't count for that original date.",
      },
    ],
  },
  {
    id: "leveling",
    title: "Leveling System",
    icon: <TrendingUp className="w-6 h-6" />,
    description: "Level up and track your learning progress.",
    content:
      "Our leveling system gamifies your learning experience. Earn XP from study activities, level up to unlock new features, and see your progress visualized over time.",
    features: [
      "XP earned from all study activities",
      "Progressive level system",
      "Level-based unlockables",
      "Leaderboard rankings",
      "Progress visualization",
    ],
    steps: [
      "Complete study sessions to earn XP",
      "Check your current level on the dashboard",
      "View XP breakdown by activity type",
      "Unlock new features as you level up",
      "Compete on the leaderboard",
    ],
    faqs: [
      {
        question: "How do I earn XP?",
        answer:
          "XP is earned from completing quizzes, reviewing flashcards, finishing Pomodoro sessions, and maintaining study streaks. Different activities award different amounts of XP.",
      },
      {
        question: "What do I unlock at higher levels?",
        answer:
          "Higher levels unlock profile customization options, special badges, and access to advanced features. Each level milestone brings new rewards.",
      },
      {
        question: "Is there a maximum level?",
        answer:
          "Currently, the maximum level is 100. We may increase this cap in future updates as users progress.",
      },
    ],
  },
];


// FAQAccordion Component
function FAQAccordion({ faqs }: { faqs: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <motion.div
          key={index}
          className="bg-white rounded-xl border border-[#171d2b]/10 overflow-hidden"
          initial={false}
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-5 py-4 flex items-center justify-between text-left"
          >
            <span className="font-sans text-[15px] text-[#171d2b] font-medium pr-4">
              {faq.question}
            </span>
            <motion.div
              animate={{ rotate: openIndex === index ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0"
            >
              <ChevronDown className="w-5 h-5 text-[#171d2b]/60" />
            </motion.div>
          </button>
          <AnimatePresence initial={false}>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-5 pb-4">
                  <p className="font-sans text-[14px] text-[#171d2b]/70 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// CategoryDetail Component
function CategoryDetail({
  category,
  onBack,
}: {
  category: CategoryContent;
  onBack: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-[800px] mx-auto"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#171d2b]/70 hover:text-[#171d2b] transition-colors mb-6 font-sans text-[14px]"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        Back to Help Center
      </button>

      {/* Category Header */}
      <div className="bg-white rounded-2xl border border-[#171d2b]/10 p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#171d2b]/5 flex items-center justify-center text-[#171d2b]">
            {category.icon}
          </div>
          <h1 className="font-serif text-[28px] sm:text-[32px] text-[#171d2b]">
            {category.title}
          </h1>
        </div>
        <p className="font-sans text-[15px] sm:text-[16px] text-[#171d2b]/70 leading-relaxed">
          {category.content}
        </p>
      </div>

      {/* Features Section */}
      {category.features && category.features.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#171d2b]/10 p-6 sm:p-8 mb-6">
          <h2 className="font-serif text-[20px] sm:text-[22px] text-[#171d2b] mb-4">
            Key Features
          </h2>
          <ul className="space-y-3">
            {category.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#171d2b]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-3 h-3 text-[#171d2b]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="font-sans text-[14px] sm:text-[15px] text-[#171d2b]/70">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps Section */}
      {category.steps && category.steps.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#171d2b]/10 p-6 sm:p-8 mb-6">
          <h2 className="font-serif text-[20px] sm:text-[22px] text-[#171d2b] mb-4">
            How to Use
          </h2>
          <ol className="space-y-4">
            {category.steps.map((step, index) => (
              <li key={index} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-[#171d2b] flex items-center justify-center flex-shrink-0">
                  <span className="font-sans text-[13px] text-white font-medium">
                    {index + 1}
                  </span>
                </div>
                <span className="font-sans text-[14px] sm:text-[15px] text-[#171d2b]/70 pt-1">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* FAQs Section */}
      {category.faqs && category.faqs.length > 0 && (
        <div className="mb-6">
          <h2 className="font-serif text-[20px] sm:text-[22px] text-[#171d2b] mb-4">
            Frequently Asked Questions
          </h2>
          <FAQAccordion faqs={category.faqs} />
        </div>
      )}
    </motion.div>
  );
}


// Main HelpClient Component
export default function HelpClient() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter categories based on search query
  const filteredCategories = categories.filter(
    (category) =>
      category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected category data
  const selectedCategoryData = categories.find(
    (cat) => cat.id === selectedCategory
  );

  return (
    <div className="bg-[#f0f0ea] relative max-w-[1440px] min-h-screen mx-auto">
      <Header className="!mt-4 sm:!mt-5 lg:!mt-6" />

      {/* Hero Section */}
      <section className="relative z-10 mx-auto pt-8 sm:pt-12 lg:pt-16 pb-8 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[800px] mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-serif text-[36px] sm:text-[48px] lg:text-[56px] text-[#171d2b] mb-4 leading-[1.1]"
          >
            Help Center
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-sans text-[15px] sm:text-[17px] text-[#171d2b]/70 mb-8 max-w-[500px] mx-auto"
          >
            Find answers to your questions and learn how to get the most out of
            DeepTerm.
          </motion.p>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative max-w-[500px] mx-auto"
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              <Search className="w-5 h-5 text-[#171d2b]/40" />
            </div>
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[52px] sm:h-[56px] pl-12 pr-4 rounded-full bg-white border border-[#171d2b]/10 font-sans text-[15px] text-[#171d2b] placeholder:text-[#171d2b]/40 focus:outline-none focus:border-[#171d2b]/30 transition-colors"
            />
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative z-10 mx-auto pb-16 sm:pb-20 lg:pb-24 px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {selectedCategoryData ? (
            <CategoryDetail
              key="detail"
              category={selectedCategoryData}
              onBack={() => setSelectedCategory(null)}
            />
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-[1000px] mx-auto"
            >
              {/* Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {filteredCategories.map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className="bg-white rounded-2xl border border-[#171d2b]/10 p-5 sm:p-6 text-left hover:border-[#171d2b]/20 hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-[#171d2b]/5 flex items-center justify-center text-[#171d2b] group-hover:bg-[#171d2b] group-hover:text-white transition-colors">
                        {category.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-[17px] sm:text-[18px] text-[#171d2b] mb-1 group-hover:text-[#171d2b] transition-colors">
                          {category.title}
                        </h3>
                        <p className="font-sans text-[13px] sm:text-[14px] text-[#171d2b]/60 line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-4 text-[#171d2b]/50 group-hover:text-[#171d2b] transition-colors">
                      <span className="font-sans text-[13px]">Learn more</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* No Results */}
              {filteredCategories.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-[#171d2b]/5 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7 text-[#171d2b]/40" />
                  </div>
                  <h3 className="font-serif text-[20px] text-[#171d2b] mb-2">
                    No results found
                  </h3>
                  <p className="font-sans text-[14px] text-[#171d2b]/60">
                    Try searching with different keywords
                  </p>
                </motion.div>
              )}

              {/* Contact Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-12 sm:mt-16 bg-white rounded-2xl border border-[#171d2b]/10 p-6 sm:p-8 text-center"
              >
                <h2 className="font-serif text-[22px] sm:text-[26px] text-[#171d2b] mb-3">
                  Still need help?
                </h2>
                <p className="font-sans text-[14px] sm:text-[15px] text-[#171d2b]/60 mb-6 max-w-[400px] mx-auto">
                  Can&apos;t find what you&apos;re looking for? Reach out to us
                  and we&apos;ll be happy to help.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                  <a
                    href="mailto:deeptermai@gmail.com"
                    className="w-full sm:w-auto h-[46px] px-6 rounded-full bg-[#171d2b] text-white font-sora text-[14px] hover:bg-[#2a3347] transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                    Email Support
                  </a>
                  <a
                    href="https://github.com/4regab/deepterm/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto h-[46px] px-6 rounded-full border-2 border-[#171d2b]/20 text-[#171d2b] font-sora text-[14px] hover:bg-[#171d2b]/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                    Report an Issue
                  </a>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
