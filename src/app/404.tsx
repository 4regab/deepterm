import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f0f0ea] flex items-center justify-center">
      <div className="text-center px-4">
        <Image
          src="/assets/sad.webp"
          alt="Sad bird"
          width={200}
          height={200}
          className="mx-auto mb-6"
        />
        <h1 className="text-6xl font-sora font-bold text-[#171d2b] mb-4">404</h1>
        <h2 className="text-xl font-semibold text-[#171d2b] mb-2">
          Page not found
        </h2>
        <p className="text-[#171d2b]/60 mb-6 max-w-md">
          The page you are looking for does not exist or has been moved.
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
