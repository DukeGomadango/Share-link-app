"use client";

interface LibraryHeaderProps {
  title: string;
  subtitle: string;
}

export function LibraryHeader({ title, subtitle }: LibraryHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
