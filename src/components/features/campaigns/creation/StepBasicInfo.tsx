"use client";

import { Megaphone, Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface StepBasicInfoProps {
  name: string;
  description: string;
  tags: string[];
  onUpdate: (data: Partial<{ name: string; description: string; tags: string[] }>) => void;
  t: any;
}

export function StepBasicInfo({ name, description, tags, onUpdate, t }: StepBasicInfoProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      onUpdate({ tags: [...tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    onUpdate({ tags: tags.filter(t => t !== tag) });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-emerald-500 mb-2">
          <Megaphone className="w-5 h-5" />
          <h2 className="text-xl font-semibold">{t.campaigns.new.steps.step1}</h2>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80 ml-1">
            {t.campaigns.new.nameLabel} <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder={t.campaigns.searchPlaceholder}
            className="w-full px-5 py-4 bg-background/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all text-lg shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80 ml-1">
            {t.campaigns.new.descriptionLabel}
          </label>
          <textarea
            value={description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder={t.campaigns.new.descriptionPlaceholder}
            rows={3}
            className="w-full px-5 py-4 bg-background/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none shadow-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground/80 ml-1">
            {t.campaigns.new.tagsLabel}
          </label>
          <div className="relative group">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder={t.campaigns.new.tagsPlaceholder}
              className="w-full pl-11 pr-5 py-3 bg-background/30 border border-border/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map(tag => (
              <span key={tag} className="flex items-center pl-3 pr-1 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-semibold border border-emerald-500/20 animate-in zoom-in duration-200">
                {tag}
                <button 
                  onClick={() => removeTag(tag)} 
                  className="ml-1 p-1 hover:bg-emerald-500/20 rounded-full transition-colors group/tag"
                  aria-label={`Remove ${tag}`}
                >
                  <Plus className="w-3.5 h-3.5 rotate-45 text-emerald-600/70 group-hover/tag:text-emerald-600" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
