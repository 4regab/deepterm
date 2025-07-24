import { cva, type VariantProps } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-md text-sm sm:text-base font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 sm:[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-2 border-[#1a1a1a] bg-[#FFC225] text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] sm:shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-y-[1px] hover:translate-x-[1px] sm:hover:translate-y-[2px] sm:hover:translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] sm:active:translate-y-[4px] sm:active:translate-x-[4px] active:shadow-none",
        destructive:
          "border-2 border-[#1a1a1a] bg-red-500 text-[#ffffff] shadow-[3px_3px_0px_#1a1a1a] sm:shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-y-[1px] hover:translate-x-[1px] sm:hover:translate-y-[2px] sm:hover:translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] sm:active:translate-y-[4px] sm:active:translate-x-[4px] active:shadow-none",
        outline:
          "border-2 border-[#1a1a1a] bg-white shadow-[3px_3px_0px_#1a1a1a] sm:shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-y-[1px] hover:translate-x-[1px] sm:hover:translate-y-[2px] sm:hover:translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] sm:active:translate-y-[4px] sm:active:translate-x-[4px] active:shadow-none",
        secondary:
          "border-2 border-[#1a1a1a] bg-[#e6f1ff] text-[#1a1a1a] shadow-[3px_3px_0px_#1a1a1a] sm:shadow-[4px_4px_0px_#1a1a1a] hover:shadow-[2px_2px_0px_#1a1a1a] hover:translate-y-[1px] hover:translate-x-[1px] sm:hover:translate-y-[2px] sm:hover:translate-x-[2px] active:translate-y-[2px] active:translate-x-[2px] sm:active:translate-y-[4px] sm:active:translate-x-[4px] active:shadow-none",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 sm:h-10 px-3 sm:px-4 py-1.5 sm:py-2",
        sm: "h-7 sm:h-8 rounded-md px-2.5 sm:px-3 text-xs sm:text-sm",
        lg: "h-10 sm:h-12 rounded-md px-6 sm:px-8",
        icon: "h-8 w-8 sm:h-10 sm:w-10",
        xs: "h-6 sm:h-7 rounded px-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
