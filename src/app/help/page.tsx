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
  Mail,
  ArrowRight,
  ChevronDown,
  Settings,
  Trophy,
  Calendar,
  TrendingUp,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface FAQItem {
  question: string;
  answer: string;
}

interface CategoryContent {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  content: string;
  features?: string[];
  steps?: { title: string; description: string }[];
  faqs: FAQItem[];
}

const categories: CategoryContent[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    description: "Learn the basics of DeepTerm and set up your account.",
    content:
      "Getting started with DeepTerm is simple. You can begin using most features immediately without creating an account. For the best experience, we recommend signing in to save your progress and access your materials across devices.",
    steps: [
      {
        title: "Visit the Dashboard",
        description:
          "Click 'Log in' or 'Start Learning Free' to access your personal dashboard where all tools are available.",
      },
      {
        title: "Choose Your Tool",
        description:
          "Select from Reviewer Maker, Practice Test Maker, Flashcard Maker, or Pomodoro Timer based on your study needs.",
      },
      {
        title: "Upload or Paste Content",
        description:
          "Upload PDF/DOCX files or paste text directly. Our AI will process your content automatically.",
      },
      {
        title: "Study and Track Progress",
        description:
          "Use the generated materials to study and track your progress on your dashboard.",
      },
    ],
    faqs: [
      {
        question: "Do I need an account to use DeepTerm?",
        answer:
          "No, you can use basic features without an account. However, signing in allows you to save your materials, track progress, and sync across devices.",
      },
      {
        question: "What file formats are supported?",
        answer:
          "DeepTerm supports PDF, DOCX, and plain text. You can also paste content directly into the text input area.",
      },
      {
        question: "How do I sign in?",
        answer:
          "Click the 'Log in' button in the header and sign in with your Google account. It's quick and secure.",
      },
    ],
  },

  {
    id: "reviewer",
    title: "Reviewer Maker",
    icon: FileText,
    description: "Transform documents into organized, learnable knowledge.",
    content:
      "The Reviewer Maker uses AI to extract key terms, definitions, and concepts from your study materials. It organizes information into structured notes that are easy to review and memorize. Choose from different modes to customize how your content is processed.",
    features: [
      "AI-powered term and definition extraction",
      "Three modes: Full, Sentence, and Keywords",
      "Automatic category grouping",
      "Export to PDF or DOCX format",
      "Edit and customize extracted content",
      "Save reviewers for later access",
    ],
    steps: [
      {
        title: "Upload Your Material",
        description:
          "Upload a PDF, DOCX file, or paste your study text directly into the input area.",
      },
      {
        title: "Select Processing Mode",
        description:
          "Choose Full mode for comprehensive extraction, Sentence mode for key sentences, or Keywords mode for essential terms only.",
      },
      {
        title: "Review and Edit",
        description:
          "Review the AI-extracted content and make any necessary edits or additions.",
      },
      {
        title: "Export or Save",
        description:
          "Export your reviewer as PDF/DOCX or save it to your dashboard for future study sessions.",
      },
    ],
    faqs: [
      {
        question: "What's the difference between the three modes?",
        answer:
          "Full mode extracts comprehensive definitions and explanations. Sentence mode pulls key sentences containing important information. Keywords mode focuses on essential terms and brief definitions.",
      },
      {
        question: "Can I edit the extracted content?",
        answer:
          "Yes, all extracted content is fully editable. You can modify, add, or remove any terms and definitions before saving or exporting.",
      },
      {
        question: "What's the maximum file size?",
        answer:
          "We support files up to 10MB. For larger documents, consider splitting them into smaller sections for better processing.",
      },
    ],
  },
  {
    id: "quiz",
    title: "Practice Test Maker",
    icon: BrainCircuit,
    description: "Generate AI-powered quizzes from your study materials.",
    content:
      "The Practice Test Maker creates relevant questions from your study materials to reinforce knowledge through active recall. The AI analyzes your content and generates various question types to test your understanding comprehensively.",
    features: [
      "Multiple question types (multiple choice, true/false, fill-in-blank)",
      "AI determines optimal question count",
      "Verbatim mode for exact text matching",
      "Manual question creation option",
      "Save tests for repeated practice",
      "Track your test performance",
    ],
    steps: [
      {
        title: "Input Your Content",
        description:
          "Upload study materials or paste text that you want to be tested on.",
      },
      {
        title: "Configure Settings",
        description:
          "Choose question types, enable/disable verbatim mode, and set the number of questions (or let AI decide).",
      },
      {
        title: "Generate Test",
        description:
          "Click generate and the AI will create a practice test based on your content.",
      },
      {
        title: "Take and Review",
        description:
          "Take the test, review your answers, and identify areas that need more study.",
      },
    ],
    faqs: [
      {
        question: "What is Verbatim mode?",
        answer:
          "Verbatim mode generates questions that require exact answers from your source material. This is useful for memorizing specific definitions or facts.",
      },
      {
        question: "Can I create my own questions?",
        answer:
          "Yes, you can manually add custom questions to any generated test or create entirely manual tests.",
      },
      {
        question: "How many questions can I generate?",
        answer:
          "You can let the AI determine the optimal number based on your content, or manually specify anywhere from 5 to 50 questions.",
      },
    ],
  },
  {
    id: "flashcards",
    title: "Flashcard Maker",
    icon: Zap,
    description: "Master any subject with active recall using flashcards.",
    content:
      "The Flashcard Maker extracts key terms and definitions to create flashcard sets for spaced repetition learning. This proven study technique helps you retain information longer by testing yourself at optimal intervals.",
    features: [
      "AI-powered term and definition extraction",
      "Manual flashcard creation",
      "Flip animation for self-testing",
      "Organize cards into sets",
      "Track cards you've mastered",
      "Support for TXT, PDF, and DOCX",
    ],
    steps: [
      {
        title: "Add Your Content",
        description:
          "Upload a document or paste text containing the terms and concepts you want to learn.",
      },
      {
        title: "Generate Flashcards",
        description:
          "The AI identifies key terms and their definitions, creating flashcards automatically.",
      },
      {
        title: "Review and Customize",
        description:
          "Edit generated cards or add your own custom flashcards to the set.",
      },
      {
        title: "Study with Spaced Repetition",
        description:
          "Use the flashcard viewer to test yourself, marking cards as known or needs review.",
      },
    ],
    faqs: [
      {
        question: "How does spaced repetition work?",
        answer:
          "Spaced repetition shows you cards at increasing intervals based on how well you know them. Cards you struggle with appear more frequently, while mastered cards appear less often.",
      },
      {
        question: "Can I import existing flashcards?",
        answer:
          "Currently, you can create flashcards from documents or manually. We're working on import features for popular flashcard formats.",
      },
      {
        question: "Is there a limit to flashcard sets?",
        answer:
          "There's no limit to the number of flashcard sets you can create. Organize them by subject or topic for easy access.",
      },
    ],
  },

  {
    id: "pomodoro",
    title: "Pomodoro Timer",
    icon: Timer,
    description: "Boost productivity with focused work sessions.",
    content:
      "The Pomodoro Timer helps you maintain focus using the proven Pomodoro Technique. Work in focused intervals with short breaks to maximize productivity and prevent burnout. Track your streaks and link sessions to specific tasks.",
    features: [
      "Customizable focus and break durations",
      "Default 25/5/15 minute intervals",
      "Daily streak tracking",
      "Task integration",
      "Session history",
      "Audio notifications",
    ],
    steps: [
      {
        title: "Set Your Timer",
        description:
          "Choose your focus duration (default 25 minutes) and break lengths (5 min short, 15 min long).",
      },
      {
        title: "Link a Task (Optional)",
        description:
          "Connect your session to a specific task or study goal for better tracking.",
      },
      {
        title: "Start Focusing",
        description:
          "Hit start and focus on your work. The timer will notify you when it's break time.",
      },
      {
        title: "Take Breaks",
        description:
          "Short breaks after each session, longer breaks after 4 sessions. Stay consistent to build streaks.",
      },
    ],
    faqs: [
      {
        question: "What is the Pomodoro Technique?",
        answer:
          "The Pomodoro Technique is a time management method that uses focused work intervals (typically 25 minutes) followed by short breaks. It helps maintain concentration and prevents mental fatigue.",
      },
      {
        question: "Can I customize the timer durations?",
        answer:
          "Yes, you can adjust focus time, short break, and long break durations to match your preferences and work style.",
      },
      {
        question: "How do streaks work?",
        answer:
          "Complete at least one Pomodoro session each day to maintain your streak. Streaks help motivate consistent study habits.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & Settings",
    icon: Settings,
    description: "Manage your profile and preferences.",
    content:
      "Manage your DeepTerm account settings, preferences, and saved materials. Sign in with Google for a seamless experience across all your devices.",
    features: [
      "Google sign-in integration",
      "Sync across devices",
      "Manage saved materials",
      "View study history",
      "Delete account option",
      "Privacy controls",
    ],
    steps: [
      {
        title: "Sign In",
        description:
          "Click 'Log in' and authenticate with your Google account.",
      },
      {
        title: "Access Dashboard",
        description:
          "Your dashboard shows all saved reviewers, tests, flashcards, and study progress.",
      },
      {
        title: "Manage Materials",
        description:
          "View, edit, or delete your saved study materials from the dashboard.",
      },
      {
        title: "Adjust Settings",
        description:
          "Customize your experience through the settings menu in your profile.",
      },
    ],
    faqs: [
      {
        question: "How do I delete my account?",
        answer:
          "Go to Settings in your dashboard and select 'Delete Account'. This will permanently remove all your data from our servers.",
      },
      {
        question: "Can I use DeepTerm without signing in?",
        answer:
          "Yes, basic features work without an account. However, your materials won't be saved between sessions.",
      },
      {
        question: "Is my Google data shared?",
        answer:
          "We only access your basic profile information (name and email) for authentication. We never access your Google Drive, contacts, or other data.",
      },
    ],
  },
  {
    id: "achievements",
    title: "Achievements",
    icon: Trophy,
    description: "Track your progress and unlock rewards as you study.",
    content:
      "DeepTerm features 50 achievements across 5 categories to motivate your learning journey. Achievements are automatically unlocked as you reach milestones in your study activities.",
    features: [
      "50 total achievements to unlock",
      "5 achievement categories",
      "Automatic progress tracking",
      "Visual progress indicators",
      "Achievement notifications",
      "Dashboard achievement display",
    ],
    steps: [
      {
        title: "Study Regularly",
        description:
          "Complete study sessions, quizzes, flashcards, and pomodoros to make progress toward achievements.",
      },
      {
        title: "Track Progress",
        description:
          "View your achievement progress on the dashboard - each achievement shows how close you are to unlocking it.",
      },
      {
        title: "Unlock Achievements",
        description:
          "When you meet the requirements, achievements unlock automatically and appear in your recent activity.",
      },
      {
        title: "View All Achievements",
        description:
          "Click 'View All' on the achievements section to see all 50 achievements and your progress toward each.",
      },
    ],
    faqs: [
      {
        question: "What are the achievement categories?",
        answer:
          "There are 5 categories: Study Time (10 achievements for total hours studied), Streaks (10 for consecutive study days), Pomodoro (10 for focus sessions), Flashcards (10 for creating sets and mastering cards), and Quizzes (10 for completing quizzes and perfect scores).",
      },
      {
        question: "How do Study Time achievements work?",
        answer:
          "Study Time achievements track your total study minutes. They range from 'First Hour' (1 hour) to 'Legend' (2000 hours). Milestones include: 1hr, 5hr, 10hr, 25hr, 50hr, 100hr, 250hr, 500hr, 1000hr, and 2000hr.",
      },
      {
        question: "What are Streak achievements?",
        answer:
          "Streak achievements reward consecutive days of studying. They range from '3 Day Streak' to 'Unstoppable' (500 days). Key milestones: 3, 7, 14, 21, 30, 60, 90, 180, 365, and 500 consecutive days.",
      },
      {
        question: "How do Pomodoro achievements work?",
        answer:
          "Complete pomodoro work sessions to unlock these. Starting with 'Focus Beginner' (1 session) up to 'Time Lord' (5000 sessions). Milestones: 1, 10, 25, 50, 100, 250, 500, 1000, 2500, and 5000 sessions.",
      },
      {
        question: "What Flashcard achievements are available?",
        answer:
          "Two types: creating flashcard sets (1, 5, 10, 25 sets) and mastering flashcards (10, 50, 100, 250, 500, 1000 cards mastered). 'First Steps' is your first set, 'Memory Legend' requires mastering 1000 cards.",
      },
      {
        question: "How do Quiz achievements work?",
        answer:
          "Quiz achievements track completed quizzes (1, 10, 25, 50, 100) and perfect scores (1, 5, 10, 25, 50 perfect quizzes). 'Quiz Starter' is your first quiz, 'Quiz Legend' requires 50 perfect scores.",
      },
    ],
  },
  {
    id: "calendar",
    title: "Study Calendar",
    icon: Calendar,
    description: "Visualize your study habits with the activity tracker.",
    content:
      "The Study Calendar provides a visual heatmap of your daily study activity. Each day is color-coded based on how many minutes you studied, helping you identify patterns and maintain consistency.",
    features: [
      "Monthly calendar view",
      "Color-coded intensity levels",
      "Daily study time tracking",
      "Current streak display",
      "Month navigation",
      "Today indicator",
    ],
    steps: [
      {
        title: "View Your Calendar",
        description:
          "Access the Study Calendar from your dashboard to see your monthly activity overview.",
      },
      {
        title: "Understand Intensity Levels",
        description:
          "Days are shaded based on study time: lighter colors for less time, darker for more intensive study days.",
      },
      {
        title: "Navigate Months",
        description:
          "Use the arrow buttons to view previous months and track your long-term study patterns.",
      },
      {
        title: "Maintain Streaks",
        description:
          "Study at least a few minutes each day to keep your streak going - visible at the top of the calendar.",
      },
    ],
    faqs: [
      {
        question: "What do the color intensity levels mean?",
        answer:
          "Level 0 (no color): 0 minutes. Level 1 (lightest): 1-29 minutes. Level 2: 30-59 minutes. Level 3: 60-119 minutes. Level 4 (darkest): 120+ minutes of study time.",
      },
      {
        question: "How is study time tracked?",
        answer:
          "Study time is automatically recorded when you complete pomodoro sessions, review flashcards, or take quizzes. Each activity contributes to your daily total.",
      },
      {
        question: "What counts toward my streak?",
        answer:
          "Any recorded study activity on a day counts toward maintaining your streak. This includes pomodoro sessions, flashcard reviews, and quiz completions.",
      },
      {
        question: "Can I see past months?",
        answer:
          "Yes, use the navigation arrows on the calendar to browse through previous months and see your historical study patterns.",
      },
      {
        question: "Why is today highlighted?",
        answer:
          "The current day has a special indicator (usually a ring or border) so you can quickly see today's activity status and whether you've studied yet.",
      },
    ],
  },
  {
    id: "leveling",
    title: "Leveling & XP",
    icon: TrendingUp,
    description: "Earn XP and level up as you learn.",
    content:
      "DeepTerm features a gamified leveling system where you earn XP (experience points) for study activities. As you accumulate XP, you level up and progress through ranks from Novice to Grandmaster.",
    features: [
      "XP rewards for all activities",
      "Progressive leveling system",
      "6 rank titles to achieve",
      "Level-up notifications",
      "XP progress bar",
      "Lifetime XP tracking",
    ],
    steps: [
      {
        title: "Earn XP",
        description:
          "Complete study activities to earn XP. Different activities award different amounts based on difficulty and effort.",
      },
      {
        title: "Level Up",
        description:
          "When your XP reaches the threshold for the next level, you'll level up and see a notification.",
      },
      {
        title: "Track Progress",
        description:
          "View your current level, XP progress bar, and rank title on your dashboard header.",
      },
      {
        title: "Achieve Higher Ranks",
        description:
          "As you reach higher levels, your rank title changes to reflect your dedication and expertise.",
      },
    ],
    faqs: [
      {
        question: "How much XP do I earn for each activity?",
        answer:
          "XP rewards: Correct flashcard answer = 10 XP. Mastering a flashcard = 25 XP. Completing a quiz = 20 XP. Perfect quiz score = 50 XP. Completing a pomodoro work session = 15 XP. Each minute of study = 1 XP.",
      },
      {
        question: "How does the leveling formula work?",
        answer:
          "Level 1 requires 100 XP. Each subsequent level requires 50 more XP than the previous. Level 2 = 150 XP, Level 3 = 200 XP, Level 4 = 250 XP, and so on. The formula is: XP needed = 100 + (level - 1) × 50.",
      },
      {
        question: "What are the rank titles and their levels?",
        answer:
          "Novice: Levels 1-4. Apprentice: Levels 5-9. Scholar: Levels 10-19. Expert: Levels 20-34. Master: Levels 35-49. Grandmaster: Level 50+.",
      },
      {
        question: "Is there a maximum level?",
        answer:
          "There's no maximum level - you can continue leveling up indefinitely. Once you reach level 50, you achieve the Grandmaster rank and continue progressing.",
      },
      {
        question: "What happens when I level up?",
        answer:
          "When you level up, you'll see a notification celebrating your achievement. Your new level and any rank changes are immediately reflected on your dashboard.",
      },
      {
        question: "How much total XP do I need for each rank?",
        answer:
          "Approximate totals: Novice (start) = 0 XP. Apprentice (Level 5) = ~400 XP. Scholar (Level 10) = ~1,150 XP. Expert (Level 20) = ~4,650 XP. Master (Level 35) = ~14,025 XP. Grandmaster (Level 50) = ~30,650 XP.",
      },
    ],
  },
];

function FAQAccordion({ faqs }: { faqs: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-[#171d2b]/10 overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-[#f0f0ea]/50 transition-colors"
          >
            <span className="font-sans font-medium text-[#171d2b] text-[14px] sm:text-[15px]">
              {faq.question}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-[#171d2b]/50 transition-transform ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-4 pb-4 text-[#171d2b]/70 text-[13px] sm:text-[14px] leading-relaxed">
                  {faq.answer}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}


function CategoryDetail({ category }: { category: CategoryContent }) {
  const IconComponent = category.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-2xl border border-[#171d2b]/10 p-6 sm:p-8"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-[#171d2b] flex items-center justify-center">
          <IconComponent className="h-6 w-6 text-white" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#171d2b]">
          {category.title}
        </h2>
      </div>

      <p className="font-sans text-[#171d2b]/70 text-[15px] leading-relaxed mb-8">
        {category.content}
      </p>

      {category.features && (
        <div className="mb-8">
          <h3 className="font-serif text-lg text-[#171d2b] mb-4">
            Key Features
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {category.features.map((feature, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-[#171d2b]/70 text-[14px]"
              >
                <span className="text-[#171d2b] mt-0.5">→</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {category.steps && (
        <div className="mb-8">
          <h3 className="font-serif text-lg text-[#171d2b] mb-4">
            How to Use
          </h3>
          <div className="space-y-4">
            {category.steps.map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#171d2b] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h4 className="font-sans font-medium text-[#171d2b] text-[15px] mb-1">
                    {step.title}
                  </h4>
                  <p className="font-sans text-[#171d2b]/60 text-[14px]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-serif text-lg text-[#171d2b] mb-4">
          Frequently Asked Questions
        </h3>
        <FAQAccordion faqs={category.faqs} />
      </div>
    </motion.div>
  );
}

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCategoryData = categories.find(
    (c) => c.id === selectedCategory
  );

  const filteredCategories = searchQuery
    ? categories.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  return (
    <div className="min-h-screen bg-[#f0f0ea] flex flex-col">
      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 py-12 sm:py-20 text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-serif text-[36px] sm:text-[48px] text-[#171d2b] mb-4 leading-tight">
              Help Center
            </h1>
            <p className="font-sans text-[#171d2b]/60 text-[15px] sm:text-[16px] mb-8 max-w-lg mx-auto">
              Everything you need to know about DeepTerm and how to make the
              most of your study sessions.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#171d2b]/40 group-focus-within:text-[#171d2b] transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCategory(null);
                }}
                placeholder="Search for help..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-[#171d2b]/10 rounded-xl text-[#171d2b] placeholder-[#171d2b]/40 focus:outline-none focus:ring-2 focus:ring-[#171d2b]/10 focus:border-[#171d2b]/30 transition-all shadow-sm hover:shadow-md font-sans"
              />
            </div>
          </motion.div>
        </section>

        {/* Main Content */}
        <section className="px-4 sm:px-6 pb-20 max-w-6xl mx-auto">
          {selectedCategory ? (
            <div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-2 text-[#171d2b]/60 hover:text-[#171d2b] transition-colors mb-6 font-sans text-[14px]"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to all topics
              </button>
              {selectedCategoryData && (
                <CategoryDetail category={selectedCategoryData} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category, index) => (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="group bg-white p-6 rounded-2xl border border-[#171d2b]/10 hover:border-[#171d2b]/20 hover:shadow-lg transition-all duration-300 flex flex-col h-full text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#f0f0ea] flex items-center justify-center mb-4 group-hover:bg-[#171d2b] transition-colors duration-300">
                    <category.icon className="h-6 w-6 text-[#171d2b] group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-serif text-xl text-[#171d2b] mb-2">
                    {category.title}
                  </h3>
                  <p className="font-sans text-[#171d2b]/60 text-sm leading-relaxed mb-4 flex-grow">
                    {category.description}
                  </p>
                  <div className="flex items-center text-[#171d2b] font-medium text-sm mt-auto opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    Learn more <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="font-sans text-[#171d2b]/60">
                No results found for &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </section>

        {/* Contact Section */}
        <section className="px-4 sm:px-6 pb-20 max-w-4xl mx-auto text-center">
          <div className="bg-[#171d2b] rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="font-serif text-2xl sm:text-3xl mb-4">
                Still need help?
              </h2>
              <p className="font-sans text-white/70 mb-8 max-w-lg mx-auto">
                Can&apos;t find what you&apos;re looking for? Reach out to us
                directly.
              </p>
              <a
                href="mailto:deeptermai@gmail.com"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#171d2b] rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                <Mail className="mr-2 h-5 w-5" />
                Contact Support
              </a>
            </div>

            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-white blur-[100px]" />
              <div className="absolute bottom-[-50%] right-[-20%] w-[500px] h-[500px] rounded-full bg-white blur-[100px]" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
