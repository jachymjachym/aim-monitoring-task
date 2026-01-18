"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MonitoringTask } from "@/lib/types";
import { useState, useMemo } from "react";
import { ExternalLink } from "lucide-react";

interface MonitoringTaskPreviewProps {
  task: MonitoringTask;
}

export function MonitoringTaskPreview({ task }: MonitoringTaskPreviewProps) {
  // Group sources by type
  const sourcesByType = useMemo(() => {
    const grouped: Record<string, typeof task.sources> = {};
    task.sources.forEach((source) => {
      if (!grouped[source.type]) {
        grouped[source.type] = [];
      }
      grouped[source.type].push(source);
    });
    return grouped;
  }, [task.sources]);

  const types = Object.keys(sourcesByType);
  const [selectedType, setSelectedType] = useState<string | "all">("all");

  // Filter sources based on selected type
  const displayedSources =
    selectedType === "all" ? task.sources : sourcesByType[selectedType] || [];

  return (
    <div className="h-full flex flex-col p-6">
      <h2 className="text-lg font-semibold mb-4">Monitoring Task</h2>

      {/* Monitoring Scope - Fixed at top */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Monitoring Scope
        </h3>
        {task.scope ? (
          <p className="text-sm leading-relaxed">{task.scope}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            Not defined yet
          </p>
        )}
      </div>

      <Separator className="mb-4" />

      {/* Sources - Scrollable section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Sources ({displayedSources.length})
          </h3>
        </div>

        {/* Type filter tabs */}
        {types.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedType === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              All ({task.sources.length})
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  selectedType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {type} ({sourcesByType[type].length})
              </button>
            ))}
          </div>
        )}

        {displayedSources.length > 0 ? (
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {displayedSources.map((source, idx) => {
              const CardWrapper = source.url ? "a" : "div";
              const cardProps = source.url
                ? {
                    href: source.url,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className:
                      "block border rounded-lg p-3 bg-muted/30 space-y-2 hover:bg-muted/50 transition-colors cursor-pointer",
                  }
                : {
                    className: "border rounded-lg p-3 bg-muted/30 space-y-2",
                  };

              return (
                <CardWrapper key={idx} {...cardProps}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate">
                          {source.name}
                        </p>
                        {source.url && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                      {source.url && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {source.url}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {source.type}
                    </Badge>
                  </div>
                  {source.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {source.description}
                    </p>
                  )}
                </CardWrapper>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No sources added yet
          </p>
        )}
      </div>
    </div>
  );
}
