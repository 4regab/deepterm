import type { Metadata } from "next";
import { headers } from "next/headers";
import { Space_Grotesk, Sora, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import {
  defaultMetadata,
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
  generateSoftwareAppJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import { PostHogProvider } from "@/components/PostHogProvider";
import { SkipLink } from "@/components/ui";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  style: ["normal", "italic"],
});

export const metadata: Metadata = defaultMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get('x-nonce') ?? '';
  const websiteJsonLd = generateWebsiteJsonLd();
  const organizationJsonLd = generateOrganizationJsonLd();
  const softwareAppJsonLd = generateSoftwareAppJsonLd();

  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${sora.variable} ${sourceSerif4.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* JSON-LD Structured Data */}
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteJsonLd) }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(organizationJsonLd) }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(softwareAppJsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <SkipLink />
        <PostHogProvider>
          {/* Google Analytics */}
          <Script
            nonce={nonce}
            src="https://www.googletagmanager.com/gtag/js?id=G-W6BMP2LP3T"
            strategy="afterInteractive"
          />
          <Script nonce={nonce} id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-W6BMP2LP3T');
            `}
          </Script>
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
