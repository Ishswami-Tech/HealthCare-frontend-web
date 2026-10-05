import { cva } from "class-variance-authority"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Main button: dark emerald. Use for every main action except book / pay / join video.
        default:
          "bg-primary text-primary-foreground font-bold shadow-brand hover:bg-[#065f46] dark:shadow-none dark:hover:bg-primary/90",
        // Amber: only for book, pay, order and join video.
        action:
          "bg-action text-[#0f1b2d] font-bold shadow-action hover:brightness-95 dark:shadow-none",
        // Mint: a quiet second action inside a card.
        soft: "bg-mint-soft text-brand font-bold hover:bg-mint",
        // Indigo: video actions that are not the main one (rejoin).
        video:
          "bg-[#eef2ff] text-[#4338ca] font-bold hover:bg-[#e0e7ff] dark:bg-indigo-500/15 dark:text-indigo-300 dark:hover:bg-indigo-500/25",
        // Red text on white: cancel, remove.
        danger:
          "border border-[#fecdd3] bg-card text-[#e11d48] font-bold hover:bg-[#fff1f2] dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-line bg-card text-ink hover:bg-mint-soft hover:text-ink dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-[10px] gap-1.5 px-3 has-[>svg]:px-2.5",
        // 44 px: the standard height for page and card actions.
        md: "h-11 px-[18px] has-[>svg]:px-4",
        lg: "h-10 px-6 has-[>svg]:px-4",
        // 50 px: the one main action of a screen or dialog.
        xl: "h-[50px] rounded-[14px] px-5 text-[15px]",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
