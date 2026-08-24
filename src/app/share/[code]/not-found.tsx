import { ButtonLink } from "@/components/ui"

export default function ShareNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <main id="main-content" className="text-center px-4">
        <p className="text-5xl font-sora font-medium text-foreground tabular mb-3">404</p>
        <h1 className="text-xl font-medium text-foreground mb-2">
          This share link isn&apos;t available
        </h1>
        <p className="text-muted-foreground mb-6 max-w-[36ch] mx-auto text-pretty">
          It may have been turned off, or the code is wrong. Ask the owner for a new link.
        </p>
        <ButtonLink href="/">
          Go to home
        </ButtonLink>
      </main>
    </div>
  )
}
