"use client";

import { Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
  buttonText: string;
}

export function DashboardHeader({ title, buttonText }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-6 shadow-lg shadow-emerald-500/20 transition-all hover:scale-105">
        <Gift className="w-4 h-4 mr-2" />
        {buttonText}
      </Button>
    </div>
  );
}
