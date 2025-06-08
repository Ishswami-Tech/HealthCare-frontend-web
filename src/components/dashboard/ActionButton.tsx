interface ActionButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'blue' | 'green' | 'purple' | 'yellow';
}

const variantClasses = {
  blue: 'bg-blue-500 hover:bg-blue-600',
  green: 'bg-green-500 hover:bg-green-600',
  purple: 'bg-purple-500 hover:bg-purple-600',
  yellow: 'bg-yellow-500 hover:bg-yellow-600',
};

export function ActionButton({
  label,
  onClick,
  variant = 'blue',
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full ${variantClasses[variant]} text-white px-4 py-2 rounded transition-colors`}
    >
      {label}
    </button>
  );
}
