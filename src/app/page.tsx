"use client";

import {
  imgSpark,
  imgVector,
  imgAiRobustness1,
  imgGamesvg,
  imgLogo,
} from "@/config/assets";
import Header from "@/components/Header";
import DraggablePlanet from "@/components/DraggablePlanet";
import FeaturesShowcase from "@/components/FeaturesShowcase";
import BackgroundPaths from "@/components/BackgroundPaths";

const imgPlanet2 = "/assets/planet2.webp";
const imgPlanet1 = "/assets/planet1.webp";
const imgStudyart1 = "/assets/studyart.webp";

export default function Home() {
  return (
    <div className="bg-[#f0f0ea] relative max-w-[1440px] min-h-screen mx-auto">
      <BackgroundPaths />
      <Header />

      {/* Hero Section */}
      <section className="relative z-10 mx-2 sm:mx-4 mt-2 rounded-[30px] sm:rounded-[50px] overflow-hidden">
        {/* Background - hero image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/assets/herobg.webp')" }}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-[#171d2b]/60" />

        <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between px-5 sm:px-10 pt-6 sm:pt-8 pb-4 gap-4 sm:gap-6">
          {/* Hero Text Content */}
          <div className="flex flex-col gap-3 sm:gap-4 max-w-[420px] pt-2 z-10 text-center md:text-left relative">


            <h1 
              className="[text-shadow:rgba(0,0,0,0.25)_0px_4px_4px] text-[32px] sm:text-[44px] lg:text-[58px] text-white leading-[1.1] m-0"
              style={{ fontFamily: '"Source Serif 4", serif', fontWeight: 400, fontOpticalSizing: 'auto' }}
            >
              <span className="sm:whitespace-nowrap">Study tools that</span>
              <br />
              <span className="sm:whitespace-nowrap">works <span className="italic">for</span> you.</span>
            </h1>
            <p className="font-sans font-normal leading-[1.5] text-[14px] sm:text-[17px] text-white/90 max-w-[360px] m-0 mx-auto md:mx-0">
              We use latest AI to simplify complex topics, generate personalized practice tests, and interactive aids all in minutes.
            </p>
          </div>

          {/* Study Art Image */}
          <div className="relative h-[180px] sm:h-[200px] lg:h-[240px] rounded-[20px] sm:rounded-[30px] w-full md:w-[320px] lg:w-[420px] overflow-hidden flex-shrink-0 mt-2 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Study Art"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src={imgStudyart1}
            />

          </div>
        </div>

        {/* Features Bar */}
        <div className="relative flex flex-wrap items-center justify-center gap-4 sm:gap-10 py-4 sm:py-5 px-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px]" src={imgSpark} />
            <span className="font-sans text-[12px] sm:text-[14px] text-white">AI-Powered</span>
          </div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="w-[12px] h-[14px] sm:w-[14px] sm:h-[16px] rotate-[36deg]" src={imgVector} />
            <span className="font-sans text-[12px] sm:text-[14px] text-white">Free to Use</span>
          </div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="w-[18px] h-[10px] sm:w-[20px] sm:h-[12px]" src={imgAiRobustness1} />
            <span className="font-sans text-[12px] sm:text-[14px] text-white">Smart Learning</span>
          </div>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="w-[14px] h-[10px] sm:w-[16px] sm:h-[12px]" src={imgGamesvg} />
            <span className="font-sans text-[12px] sm:text-[14px] text-white">Gamified</span>
          </div>
        </div>
      </section>

      {/* Planet Decorations - hidden on mobile/tablet, only visible on lg+ */}
      <DraggablePlanet
        src={imgPlanet2}
        defaultX={-80}
        defaultY={520}
        size="w-[200px] h-[200px]"
        mdSize="lg:w-[280px] lg:h-[280px]"
        rotation={76}
        blur={8}
      />
      <DraggablePlanet
        src={imgPlanet1}
        defaultX={1150}
        defaultY={700}
        size="w-[180px] h-[180px]"
        mdSize="lg:w-[250px] lg:h-[250px]"
        rotation={301}
        blur={6}
      />

      {/* How Our Tools Work Section - GSAP Animated */}
      <FeaturesShowcase />

      {/* Getting Started Section */}
      <section className="relative z-10 px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
        <h2 className="font-serif text-[22px] sm:text-[28px] lg:text-[32px] text-[#171d2b] text-center mb-2 sm:mb-3">
          Get Started in Minutes
        </h2>
        <p className="font-sans text-[13px] sm:text-[15px] lg:text-[16px] text-[#171d2b]/70 text-center mb-8 sm:mb-10 lg:mb-12 max-w-[500px] mx-auto px-4">
          Three simple steps to smarter studying
        </p>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-6 max-w-[950px] mx-auto">
          {/* Step 1 */}
          <div className="flex flex-row lg:flex-col items-center lg:items-center text-left lg:text-center gap-4 lg:gap-0 w-full lg:w-auto lg:max-w-[260px] px-2">
            <div className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] lg:w-[68px] lg:h-[68px] rounded-full bg-[#171d2b] flex items-center justify-center flex-shrink-0 lg:mb-4">
              <span className="font-serif text-[20px] sm:text-[22px] lg:text-[26px] text-white">1</span>
            </div>
            <div className="flex-1 lg:flex-none">
              <h3 className="font-serif font-medium text-[16px] sm:text-[17px] lg:text-[19px] text-[#171d2b] mb-1 lg:mb-2">
                Upload or Paste
              </h3>
              <p className="font-sans text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b]/70 leading-[1.5]">
                Drop your study materials - PDFs, documents, or paste text directly
              </p>
            </div>
          </div>

          {/* Connector */}
          <div className="hidden lg:block w-[40px] xl:w-[60px] h-[2px] bg-[#171d2b]/20 flex-shrink-0" />

          {/* Step 2 */}
          <div className="flex flex-row lg:flex-col items-center lg:items-center text-left lg:text-center gap-4 lg:gap-0 w-full lg:w-auto lg:max-w-[260px] px-2">
            <div className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] lg:w-[68px] lg:h-[68px] rounded-full bg-[#171d2b] flex items-center justify-center flex-shrink-0 lg:mb-4">
              <span className="font-serif text-[20px] sm:text-[22px] lg:text-[26px] text-white">2</span>
            </div>
            <div className="flex-1 lg:flex-none">
              <h3 className="font-serif font-medium text-[16px] sm:text-[17px] lg:text-[19px] text-[#171d2b] mb-1 lg:mb-2">
                AI Processes
              </h3>
              <p className="font-sans text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b]/70 leading-[1.5]">
                Our AI extracts key terms, generates practice tests, and creates flashcards
              </p>
            </div>
          </div>

          {/* Connector */}
          <div className="hidden lg:block w-[40px] xl:w-[60px] h-[2px] bg-[#171d2b]/20 flex-shrink-0" />

          {/* Step 3 */}
          <div className="flex flex-row lg:flex-col items-center lg:items-center text-left lg:text-center gap-4 lg:gap-0 w-full lg:w-auto lg:max-w-[260px] px-2">
            <div className="w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] lg:w-[68px] lg:h-[68px] rounded-full bg-[#171d2b] flex items-center justify-center flex-shrink-0 lg:mb-4">
              <span className="font-serif text-[20px] sm:text-[22px] lg:text-[26px] text-white">3</span>
            </div>
            <div className="flex-1 lg:flex-none">
              <h3 className="font-serif font-medium text-[16px] sm:text-[17px] lg:text-[19px] text-[#171d2b] mb-1 lg:mb-2">
                Study & Succeed
              </h3>
              <p className="font-sans text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b]/70 leading-[1.5]">
                Review, practice, and track your progress with gamified learning
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Section */}
      <section className="relative z-10 px-3 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <h2 className="font-serif text-[22px] sm:text-[28px] lg:text-[32px] text-[#171d2b] text-center mb-2 sm:mb-3">
          Why Choose DeepTerm?
        </h2>
        <p className="font-sans text-[13px] sm:text-[15px] lg:text-[16px] text-[#171d2b]/70 text-center mb-6 sm:mb-8 lg:mb-10 max-w-[500px] mx-auto px-2">
          See how we compare to traditional study methods
        </p>

        {/* Mobile: Card-based comparison */}
        <div className="sm:hidden space-y-4 max-w-[400px] mx-auto">
          {[
            { feature: "Note Extraction", trad: "Manual", other: "Basic", deep: "AI-Powered" },
            { feature: "Practice Test Generation", trad: false, other: "Limited", deep: true },
            { feature: "Flashcards", trad: "Manual", other: true, deep: true },
            { feature: "Gamification", trad: false, other: false, deep: true },
            { feature: "Price", trad: "Free", other: "$10-30/mo", deep: "Free" },
          ].map((row, i) => (
            <div key={i} className="bg-[rgba(210,210,200,0.4)] rounded-[16px] p-4">
              <h4 className="font-sans font-medium text-[14px] text-[#171d2b] mb-3">{row.feature}</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-[#171d2b]/50 mb-1">Traditional</p>
                  <p className="text-[12px]">
                    {row.trad === false ? <span className="text-[#ef4444]">✕</span> :
                      row.trad === true ? <span className="text-[#22c55e]">✓</span> :
                        <span className="text-[#171d2b]/60">{row.trad}</span>}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#171d2b]/50 mb-1">Other AI</p>
                  <p className="text-[12px]">
                    {row.other === false ? <span className="text-[#ef4444]">✕</span> :
                      row.other === true ? <span className="text-[#22c55e]">✓</span> :
                        <span className="text-[#171d2b]/60">{row.other}</span>}
                  </p>
                </div>
                <div className="bg-[#171d2b]/10 rounded-lg py-1">
                  <p className="text-[10px] text-[#171d2b]/70 mb-1">DeepTerm</p>
                  <p className="text-[12px] font-medium">
                    {row.deep === false ? <span className="text-[#ef4444]">✕</span> :
                      row.deep === true ? <span className="text-[#22c55e]">✓</span> :
                        <span className="text-[#171d2b]">{row.deep}</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tablet/Desktop: Table */}
        <div className="hidden sm:block max-w-[800px] mx-auto overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="font-sans text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b]/60 text-left py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10">Feature</th>
                <th className="font-sans text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b]/60 text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10">Traditional</th>
                <th className="font-sans text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b]/60 text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10">Other AI</th>
                <th className="font-sora text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b] text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 bg-[#171d2b]/5 rounded-t-lg">DeepTerm</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-sans text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b] py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10">Note Extraction</td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 text-[12px] sm:text-[13px]"><span className="text-[#171d2b]/40">Manual</span></td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 text-[12px] sm:text-[13px]"><span className="text-[#171d2b]/70">Basic</span></td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 bg-[#171d2b]/5 text-[12px] sm:text-[13px]"><span className="text-[#171d2b] font-medium">AI-Powered</span></td>
              </tr>
              <tr>
                <td className="font-sans text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b] py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10">Practice Test Generation</td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10"><span className="text-[#ef4444]">✕</span></td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 text-[12px] sm:text-[13px]"><span className="text-[#171d2b]/70">Limited</span></td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 bg-[#171d2b]/5"><span className="text-[#22c55e]">✓</span></td>
              </tr>
              <tr>
                <td className="font-sans text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b] py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10">Flashcards</td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 text-[12px] sm:text-[13px]"><span className="text-[#171d2b]/40">Manual</span></td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10"><span className="text-[#22c55e]">✓</span></td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 bg-[#171d2b]/5"><span className="text-[#22c55e]">✓</span></td>
              </tr>
              <tr>
                <td className="font-sans text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b] py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10">Gamification</td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10"><span className="text-[#ef4444]">✕</span></td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10"><span className="text-[#ef4444]">✕</span></td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 bg-[#171d2b]/5"><span className="text-[#22c55e]">✓</span></td>
              </tr>
              <tr>
                <td className="font-sans text-[12px] sm:text-[13px] lg:text-[14px] text-[#171d2b] py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10">Price</td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 text-[12px] sm:text-[13px]"><span className="text-[#171d2b]/70">Free</span></td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 text-[12px] sm:text-[13px]"><span className="text-[#171d2b]/70">$10-30/mo</span></td>
                <td className="text-center py-3 px-2 sm:px-3 lg:px-4 border-b border-[#171d2b]/10 bg-[#171d2b]/5 text-[12px] sm:text-[13px]"><span className="text-[#171d2b] font-medium">Free</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative z-10 mx-2 sm:mx-4 mb-6 sm:mb-8 rounded-[24px] sm:rounded-[40px] lg:rounded-[50px] overflow-hidden">
        <div className="bg-gradient-to-br from-[#171d2b] to-[#2a3347] px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-16 text-center">
          <h2 className="font-serif text-[22px] sm:text-[32px] lg:text-[40px] text-white mb-2 sm:mb-3 lg:mb-4 leading-[1.2] px-2">
            Ready to transform your learning?
          </h2>
          <p className="font-sans text-[13px] sm:text-[15px] lg:text-[16px] text-white/80 mb-5 sm:mb-6 lg:mb-8 max-w-[400px] mx-auto px-2">
            Start studying smarter, not harder.
          </p>
          <button className="bg-white h-[44px] sm:h-[50px] lg:h-[54px] rounded-[100px] px-6 sm:px-8 lg:px-10 text-[#171d2b] font-sora text-[14px] sm:text-[16px] lg:text-[18px] hover:bg-[#f0f0ea] transition-colors shadow-lg">
            Start Learning Free
          </button>
          <p className="font-sans text-[11px] sm:text-[12px] lg:text-[13px] text-white/60 mt-3 sm:mt-4 px-2">
            No credit card required • No installation • Start in 30 seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 border-t border-[#171d2b]/10">
        <div className="max-w-[1000px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1 mb-2 sm:mb-0">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] flex items-center justify-center">
                  <div className="rotate-[292deg]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="Deepterm Logo" className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px]" src={imgLogo} />
                  </div>
                </div>
                <span className="font-sora text-[#171d2b] text-[16px] sm:text-[18px]">deepterm</span>
              </div>
              <p className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 leading-[1.5]">
                AI-powered study tools that work for you.
              </p>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-sora text-[13px] sm:text-[14px] text-[#171d2b] mb-2 sm:mb-3">Company</h4>
              <ul className="flex flex-col gap-1.5 sm:gap-2">
                <li><a href="/help#about" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">About</a></li>
                <li><a href="/help" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">Help Center</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-sora text-[13px] sm:text-[14px] text-[#171d2b] mb-2 sm:mb-3">Legal</h4>
              <ul className="flex flex-col gap-1.5 sm:gap-2">
                <li><a href="/privacy-policy" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">Terms of Service</a></li>
              </ul>
            </div>

            {/* Connect Links */}
            <div>
              <h4 className="font-sora text-[13px] sm:text-[14px] text-[#171d2b] mb-2 sm:mb-3">Connect</h4>
              <ul className="flex flex-col gap-1.5 sm:gap-2">
                <li><a href="https://ko-fi.com/deepterm" target="_blank" rel="noopener noreferrer" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">Donate</a></li>
                <li><a href="https://github.com/4regab/deepterm" target="_blank" rel="noopener noreferrer" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">GitHub</a></li>
                <li><a href="mailto:deeptermai@gmail.com" className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 hover:text-[#171d2b] transition-colors">Email</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 sm:pt-6 border-t border-[#171d2b]/10 gap-3 sm:gap-4">
            <p className="font-sans text-[11px] sm:text-[12px] text-[#171d2b]/50">
              © 2025 DeepTerm. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://ko-fi.com/deepterm" target="_blank" rel="noopener noreferrer" className="text-[#171d2b]/50 hover:text-[#171d2b] transition-colors" aria-label="Ko-fi">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/></svg>
              </a>
              <a href="https://github.com/4regab/deepterm" target="_blank" rel="noopener noreferrer" className="text-[#171d2b]/50 hover:text-[#171d2b] transition-colors" aria-label="GitHub">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" /></svg>
              </a>
              <a href="mailto:deeptermai@gmail.com" className="text-[#171d2b]/50 hover:text-[#171d2b] transition-colors" aria-label="Email">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
