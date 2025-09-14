interface ActionButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "blue" | "green" | "purple" | "yellow";
  className?: string;
}

const variantClasses = {
  blue: "bg-primary hover:bg-primary/90 focus:ring-primary/20",
  green: "bg-primary hover:bg-primary/90 focus:ring-primary/20",
  purple: "bg-primary hover:bg-primary/90 focus:ring-primary/20",
  yellow: "bg-primary hover:bg-primary/90 focus:ring-primary/20",
};

export function ActionButton({
  label,
  onClick,
  variant = "blue",
  className,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full ${
        variantClasses[variant]
      } text-primary-foreground px-4 py-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 ${
        className || ""
      }`}
    >
      {label}
    </button>
  );
}
