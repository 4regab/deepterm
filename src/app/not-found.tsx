import Image from "next/image"
import { ButtonLink } from "@/components/ui"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center overflow-hidden relative px-4">
      <main id="main-content" className="text-center relative z-10">
        <div className="relative inline-block mb-8">
          <Image
            src="/assets/sad.webp"
            alt=""
            width={280}
            height={280}
            className="mx-auto"
            priority
          />
        </div>

        <p className="font-sans text-6xl md:text-8xl font-medium text-foreground tabular mb-3">
          404
        </p>

        <h1 className="text-2xl md:text-3xl font-medium text-foreground mb-3">
          This page isn&apos;t here
        </h1>

        <p className="text-muted-foreground mb-8 max-w-[36ch] mx-auto text-pretty">
          The link may be outdated, or the page moved. The home page still has the study tools.
        </p>

        <ButtonLink href="/">
          Go to home
        </ButtonLink>
      </main>
    </div>
  )
}
