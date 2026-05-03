"use client";

import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function UserAvatar({ name, className, size = "md" }: UserAvatarProps) {
  // Generate a consistent color based on name
  const colors = [
    "from-pink-500 to-rose-500",
    "from-amber-500 to-orange-500",
    "from-emerald-500 to-teal-500",
    "from-sky-500 to-blue-500",
    "from-violet-500 to-purple-500",
    "from-fuchsia-500 to-pink-500",
    "from-indigo-500 to-blue-500",
  ];

  const charCode = name.charCodeAt(0) || 0;
  const colorClass = colors[charCode % colors.length];

  const sizeClasses = {
    sm: "h-8 w-8 text-xs rounded-xl",
    md: "h-10 w-10 text-sm rounded-2xl",
    lg: "h-16 w-16 text-xl rounded-3xl",
  };

  return (
    <div 
      className={cn(
        "flex items-center justify-center text-white font-bold shadow-lg ring-1 ring-white/20 select-none bg-gradient-to-br",
        colorClass,
        sizeClasses[size],
        className
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
