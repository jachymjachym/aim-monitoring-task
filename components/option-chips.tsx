"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Send } from "lucide-react";

interface ChatOption {
  label: string;
  value: string;
}

interface OptionChipsProps {
  options: ChatOption[];
  onSelect: (value: string) => void;
}

// Check if a value contains placeholders like [City], [State], etc.
const hasPlaceholders = (text: string): boolean => {
  return /\[([^\]]+)\]/.test(text);
};

// Extract placeholders from text
const extractPlaceholders = (text: string): string[] => {
  const matches = text.match(/\[([^\]]+)\]/g);
  return matches ? matches.map((m) => m.slice(1, -1)) : [];
};

export function OptionChips({ options, onSelect }: OptionChipsProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [showInputForm, setShowInputForm] = useState(false);
  const [activeOption, setActiveOption] = useState<ChatOption | null>(null);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const handleSelect = (option: ChatOption) => {
    if (hasPlaceholders(option.value)) {
      // Show input form for this option
      setActiveOption(option);
      setShowInputForm(true);
      const placeholders = extractPlaceholders(option.value);
      const initialValues: Record<string, string> = {};
      placeholders.forEach((p) => (initialValues[p] = ""));
      setInputValues(initialValues);
    } else {
      // Send directly
      setSelected(option.value);
      onSelect(option.value);
    }
  };

  const handleSubmitWithInput = () => {
    if (!activeOption) return;

    let finalValue = activeOption.value;
    // Replace all placeholders with user input
    Object.entries(inputValues).forEach(([placeholder, value]) => {
      finalValue = finalValue.replace(`[${placeholder}]`, value.trim());
    });

    setSelected(finalValue);
    onSelect(finalValue);
    setShowInputForm(false);
    setActiveOption(null);
  };

  const handleCancel = () => {
    setShowInputForm(false);
    setActiveOption(null);
    setInputValues({});
  };

  const allInputsFilled = Object.values(inputValues).every((v) => v.trim());

  if (showInputForm && activeOption) {
    const placeholders = extractPlaceholders(activeOption.value);

    return (
      <div className="my-2 md:my-3 p-3 md:p-4 border rounded-lg bg-muted/30 space-y-2 md:space-y-3">
        <p className="text-xs md:text-sm font-medium">{activeOption.label}</p>
        <div className="space-y-2">
          {placeholders.map((placeholder) => (
            <div key={placeholder}>
              <label className="text-xs text-muted-foreground block mb-1">
                {placeholder}
              </label>
              <Input
                value={inputValues[placeholder] || ""}
                onChange={(e) =>
                  setInputValues((prev) => ({
                    ...prev,
                    [placeholder]: e.target.value,
                  }))
                }
                placeholder={`Enter ${placeholder.toLowerCase()}`}
                className="text-xs md:text-sm"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSubmitWithInput}
            disabled={!allInputsFilled}
            className="flex-1 text-xs md:text-sm"
          >
            <Send className="h-3 w-3 mr-1" />
            Submit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="flex-1 text-xs md:text-sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 md:gap-2 my-2 md:my-3">
      {options.map((option, idx) => (
        <Button
          key={idx}
          variant={selected === option.value ? "default" : "outline"}
          size="sm"
          onClick={() => handleSelect(option)}
          disabled={selected !== null && selected !== option.value}
          className="rounded-full text-xs md:text-sm"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
