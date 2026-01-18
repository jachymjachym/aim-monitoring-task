"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MonitoringTask } from "@/lib/types";

interface MonitoringTaskPreviewProps {
  task: MonitoringTask;
}

export function MonitoringTaskPreview({ task }: MonitoringTaskPreviewProps) {
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
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Sources ({task.sources.length})
        </h3>
        {task.sources.length > 0 ? (
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {task.sources.map((source, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-3 bg-muted/30 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {source.name}
                    </p>
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
              </div>
            ))}
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
