interface ActionButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "blue" | "green" | "purple" | "yellow";
  className?: string;
}

const variantClasses = {
  blue: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-200",
  green: "bg-green-500 hover:bg-green-600 focus:ring-green-200",
  purple: "bg-purple-500 hover:bg-purple-600 focus:ring-purple-200",
  yellow: "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-200",
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
      } text-white px-4 py-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 ${
        className || ""
      }`}
    >
      {label}
    </button>
  );
}
