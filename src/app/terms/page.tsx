"use client";

import Link from "next/link";
import { imgLogo } from "@/config/assets";

export default function TermsPage() {
  return (
    <div className="bg-[#f0f0ea] min-h-screen">
      {/* Header */}
      <header className="px-4 sm:px-6 lg:px-8 py-4 border-b border-[#171d2b]/10">
        <div className="max-w-[1000px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-[28px] h-[28px] flex items-center justify-center">
              <div className="rotate-[292deg]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Deepterm Logo" className="w-[22px] h-[22px]" src={imgLogo} />
              </div>
            </div>
            <span className="font-sora text-[#171d2b] text-[18px]">deepterm</span>
          </Link>
          <Link href="/" className="font-sans text-[14px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="max-w-[800px] mx-auto">
          <h1 className="font-serif text-[28px] sm:text-[36px] lg:text-[42px] text-[#171d2b] mb-2">
            Terms of Service
          </h1>
          <p className="font-sans text-[13px] sm:text-[14px] text-[#171d2b]/50 mb-8">
            Last updated: November 2025
          </p>

          <div className="space-y-8 font-sans text-[14px] sm:text-[15px] text-[#171d2b]/80 leading-[1.7]">
            <section>
              <h2 className="font-serif text-[18px] sm:text-[20px] text-[#171d2b] mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using DeepTerm, you accept and agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-[18px] sm:text-[20px] text-[#171d2b] mb-3">2. Description of Service</h2>
              <p>
                DeepTerm is an AI-powered study companion that provides tools including note extraction, 
                quiz generation, flashcard creation, and productivity features. Our service is designed 
                to enhance your learning experience through intelligent automation.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-[18px] sm:text-[20px] text-[#171d2b] mb-3">3. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities that occur under your account. You must notify us immediately 
                of any unauthorized use.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-[18px] sm:text-[20px] text-[#171d2b] mb-3">4. Acceptable Use</h2>
              <p className="mb-3">You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Upload content that infringes on intellectual property rights</li>
                <li>Use the service for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the service</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-[18px] sm:text-[20px] text-[#171d2b] mb-3">5. Intellectual Property</h2>
              <p>
                You retain ownership of the content you upload. By using our service, you grant us 
                a limited license to process your content for the purpose of providing our services.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-[18px] sm:text-[20px] text-[#171d2b] mb-3">6. Limitation of Liability</h2>
              <p>
                DeepTerm is provided &quot;as is&quot; without warranties of any kind. We are not liable for 
                any indirect, incidental, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-[18px] sm:text-[20px] text-[#171d2b] mb-3">7. Changes to Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of the service after 
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-[18px] sm:text-[20px] text-[#171d2b] mb-3">8. Contact</h2>
              <p>
                For questions about these Terms, contact us at{" "}
                <a href="mailto:deeptermai@gmail.com" className="text-[#171d2b] underline hover:no-underline">
                  deeptermai@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
