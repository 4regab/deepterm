import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter_Tight, Geist_Mono, Source_Serif_4, Space_Grotesk, Sora } from "next/font/google";
import Script from "next/script";
import "@/styles/globals.css";
import {
  defaultMetadata,
  generateWebsiteJsonLd,
  generateOrganizationJsonLd,
  generateSoftwareAppJsonLd,
} from "@/lib/seo";
import { PostHogProvider } from "@/components/PostHogProvider";
import { SkipLink } from "@/components/ui";

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["300", "400", "500"],
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500"],
  display: "swap",
});

const sourceSerif4 = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  style: ["normal", "italic"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora-face",
  display: "swap",
});

export const metadata: Metadata = defaultMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? "";
  const websiteJsonLd = generateWebsiteJsonLd();
  const organizationJsonLd = generateOrganizationJsonLd();
  const softwareAppJsonLd = generateSoftwareAppJsonLd();

  return (
    <html
      lang="en"
      className={`${interTight.variable} ${geistMono.variable} ${sourceSerif4.variable} ${spaceGrotesk.variable} ${sora.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
        />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <SkipLink />
        <PostHogProvider>
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
