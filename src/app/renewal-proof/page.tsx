import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
    title: "Domain Renewal Notice",
    description:
        "Deepterm domain renewal notice with deadline details and community support information.",
    path: "/renewal-proof",
});

export default function RenewalProofPage() {
    return (
        <div className="min-h-screen bg-[#f0f0ea]">
            <div className="sticky top-0 z-50">
                <div className="mx-auto max-w-[1440px]">
                    <Header />
                </div>
            </div>

            <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8" id="maincontent">
                <article className="rounded-3xl border border-[#171d2b]/10 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
                    <p className="mb-3 inline-flex rounded-full bg-[#fff6ea] px-3 py-1 font-sans text-[12px] font-medium text-[#3d160f]">
                        Transparency Notice
                    </p>

                    <h1 className="mb-4 font-serif text-3xl text-[#171d2b] sm:text-4xl">Deepterm Domain Renewal</h1>

                    <p className="mb-3 font-sans text-[15px] leading-[1.7] text-[#171d2b]/80 sm:text-[16px]">
                        Deepterm&apos;s domain renewal payment is due on April 15. If we cannot cover the renewal
                        cost in time, the domain may shut down and the site may become unavailable.
                    </p>

                    <p className="mb-6 font-sans text-[15px] leading-[1.7] text-[#171d2b]/80 sm:text-[16px]">
                        Deepterm is kept free for students, and community support directly helps us keep the
                        service online.
                    </p>

                    <p className="mb-6 font-sans text-[14px] text-[#171d2b]/70 sm:text-[15px]">
                        Public domain record reference:{" "}
                        <a
                            href="https://www.whois.com/whois/deepterm.tech"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-[#171d2b]/30 underline-offset-4 transition-colors hover:text-[#171d2b]"
                        >
                            whois.com/whois/deepterm.tech
                        </a>
                    </p>

                    <div className="mb-6 rounded-2xl border border-[#171d2b]/10 bg-[#f8f8f3] p-4 sm:p-5">
                        <h2 className="mb-2 font-sora text-[14px] font-semibold text-[#171d2b] sm:text-[15px]">
                            Deadline
                        </h2>
                        <p className="font-sans text-[14px] text-[#171d2b]/80 sm:text-[15px]">
                            Renewal payment due: April 15
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <a
                            href="https://ko-fi.com/4regab"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-[42px] items-center justify-center rounded-full bg-[#171d2b] px-5 font-sora text-[14px] text-white transition-colors hover:bg-[#2a3347] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] focus-visible:ring-offset-2"
                        >
                            Support on Ko-fi
                        </a>

                        <Link
                            href="/"
                            className="inline-flex h-[42px] items-center justify-center rounded-full border border-[#171d2b]/20 px-5 font-sora text-[14px] text-[#171d2b] transition-colors hover:bg-[#171d2b]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] focus-visible:ring-offset-2"
                        >
                            Back to Home
                        </Link>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
