import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e8e8e0] to-[#f0f0ea] flex items-center justify-center overflow-hidden relative">
      {/* Floating clouds */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-24 h-12 bg-white/40 rounded-full blur-xl" />
        <div className="absolute top-[25%] right-[15%] w-32 h-16 bg-white/30 rounded-full blur-xl" />
        <div className="absolute bottom-[30%] left-[20%] w-20 h-10 bg-white/35 rounded-full blur-xl" />
        <div className="absolute top-[40%] right-[25%] w-16 h-8 bg-white/25 rounded-full blur-xl" />
      </div>

      <div className="text-center px-4 relative z-10">
        {/* Sad bird */}
        <div className="relative inline-block mb-8">
          {/* Tear drops */}
          <div className="absolute left-[25%] top-[45%] w-2 h-3 bg-blue-400/70 rounded-full" />
          <div className="absolute right-[25%] top-[45%] w-2 h-3 bg-blue-400/70 rounded-full" />
          
          {/* Bird image */}
          <Image
            src="/assets/sad.webp"
            alt="Sad bird"
            width={280}
            height={280}
            className="mx-auto drop-shadow-2xl"
            priority
          />
          
          {/* Subtle shadow under bird */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-40 h-6 bg-black/10 rounded-full blur-md" />
        </div>

        {/* 404 text */}
        <h1 className="text-8xl md:text-9xl font-sora font-bold text-[#171d2b] mb-4">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-semibold text-[#171d2b] mb-3">
          Oops! Page not found
        </h2>
        
        <p className="text-[#171d2b]/60 mb-8 max-w-md mx-auto text-lg">
          Our little bird looked everywhere but couldn&apos;t find this page. It might have flown away!
        </p>
        
        <Link 
          href="/"
          className="inline-block px-8 py-4 bg-[#171d2b] text-white rounded-2xl font-medium text-lg hover:bg-[#2a3347] hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Take me home
        </Link>
      </div>
    </div>
  )
}
