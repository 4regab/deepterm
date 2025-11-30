import Link from "next/link"

export default function ShareNotFound() {
  return (
    <div className="min-h-screen bg-[#f0f0ea] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-6xl font-sora font-bold text-[#171d2b] mb-4">404</h1>
        <h2 className="text-xl font-semibold text-[#171d2b] mb-2">
          Share link not found
        </h2>
        <p className="text-[#171d2b]/60 mb-6 max-w-md">
          This share link may have been disabled or does not exist.
        </p>
        <Link 
          href="/"
          className="inline-block px-6 py-3 bg-[#171d2b] text-white rounded-xl font-medium hover:bg-[#2a3347] transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  )
}
