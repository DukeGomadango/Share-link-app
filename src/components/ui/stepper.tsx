"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("relative flex justify-between w-full max-w-2xl mx-auto px-4", className)}>
      {/* Background Line */}
      <div className="absolute top-5 left-8 right-8 h-0.5 bg-border/30 -z-10" />
      
      {/* Active Line Progress */}
      <div 
        className="absolute top-5 left-8 h-0.5 bg-emerald-500/50 transition-all duration-500 ease-out -z-10"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step) => {
        const isCompleted = step.id < currentStep;
        const isActive = step.id === currentStep;

        return (
          <div key={step.id} className="flex flex-col items-center group">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-lg",
                isCompleted
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20"
                  : isActive
                  ? "bg-background border-emerald-500 text-emerald-500 ring-4 ring-emerald-500/10"
                  : "bg-background border-border/50 text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <Check className="w-5 h-5 animate-in zoom-in duration-300" />
              ) : (
                <span className="text-sm font-bold">{step.id}</span>
              )}
            </div>
            <span
              className={cn(
                "mt-2 text-xs font-medium transition-colors duration-300",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
