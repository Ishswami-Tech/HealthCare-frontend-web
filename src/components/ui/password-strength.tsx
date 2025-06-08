import React from "react";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const calculateStrength = (pwd: string): number => {
    let strength = 0;

    // Length check
    if (pwd.length >= 8) strength += 1;
    if (pwd.length >= 12) strength += 1;

    // Character type checks
    if (/[A-Z]/.test(pwd)) strength += 1;
    if (/[a-z]/.test(pwd)) strength += 1;
    if (/[0-9]/.test(pwd)) strength += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1;

    // Cap the strength at 5
    return Math.min(strength, 5);
  };

  const strength = calculateStrength(password);
  const strengthText = ["Very Weak", "Weak", "Fair", "Good", "Strong"][
    Math.max(0, strength - 1)
  ];
  const strengthColor = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
  ][Math.max(0, strength - 1)];

  if (!password) {
    return null;
  }

  return (
    <div className="mt-1">
      <div className="flex gap-1 h-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-full w-full rounded-full transition-colors ${
              i < strength ? strengthColor : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs mt-1 ${
          strength < 2 ? "text-red-500" : "text-gray-500"
        }`}
      >
        {strengthText}
      </p>
    </div>
  );
}
