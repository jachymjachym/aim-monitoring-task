"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ChatOption {
  label: string;
  value: string;
}

interface OptionChipsProps {
  options: ChatOption[];
  onSelect: (value: string) => void;
}

export function OptionChips({ options, onSelect }: OptionChipsProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (value: string) => {
    setSelected(value);
    onSelect(value);
  };

  return (
    <div className="flex flex-wrap gap-2 my-3">
      {options.map((option, idx) => (
        <Button
          key={idx}
          variant={selected === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(option.value)}
          disabled={selected !== null && selected !== option.value}
          className="rounded-full"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
