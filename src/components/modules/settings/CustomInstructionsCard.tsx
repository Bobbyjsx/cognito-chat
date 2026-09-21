"use client";

import { useState } from "react";
import { Lock, Sliders, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import {
  useProfile,
  useUpdateCustomInstructions,
} from "@/hooks/data/useAuth/useAuth";
import { normalizeTier } from "@/lib/plans";
import { cn } from "@/lib/utils";

const MAX_INSTRUCTION_CHARS = 1500;

interface CustomInstructionsCardProps {
  onUpgradeClick: () => void;
}

export function CustomInstructionsCard({
  onUpgradeClick,
}: CustomInstructionsCardProps) {
  const { data: profile } = useProfile();
  const updateMutation = useUpdateCustomInstructions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [instructionsText, setInstructionsText] = useState("");

  const isPremium = normalizeTier(profile?.tier) === "premium";
  const currentInstructions = profile?.customInstructions?.trim() || "";

  const handleOpenDialog = () => {
    if (!isPremium) {
      onUpgradeClick();
      return;
    }
    setInstructionsText(currentInstructions);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmed = instructionsText.trim();
    if (trimmed.length > MAX_INSTRUCTION_CHARS) {
      toast.error(
        `Custom instructions must be ${MAX_INSTRUCTION_CHARS} characters or fewer.`,
      );
      return;
    }

    try {
      await updateMutation.mutateAsync(trimmed || null);
      toast.success(
        trimmed ? "Custom instructions saved" : "Custom instructions cleared",
      );
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save custom instructions. Please try again.");
    }
  };

  const charCount = instructionsText.length;
  const isOverLimit = charCount > MAX_INSTRUCTION_CHARS;

  return (
    <>
      <Card className="border-[rgba(0,0,0,0.06)] bg-white p-5 shadow-2xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-1.5 pr-2">
            <div className="flex items-center gap-2">
              <h3 className="text-on-surface text-sm font-semibold">
                Custom Instructions
              </h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-semibold tracking-wide",
                  isPremium
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {!isPremium && <Lock className="mr-1 inline h-3 w-3" />}
                Premium
              </Badge>
            </div>
            <p className="text-gray-medium text-xs leading-relaxed">
              Tailor Cognito&apos;s responses to your needs. These custom
              preferences and rules are automatically attached to every request.
            </p>

            {isPremium && currentInstructions ? (
              <div className="mt-3 rounded-lg border border-[rgba(0,0,0,0.05)] bg-neutral-50/70 p-3 text-xs text-neutral-700">
                <p className="text-on-surface mb-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active Instructions
                </p>
                <p className="line-clamp-3 font-mono text-[11px] whitespace-pre-wrap text-neutral-600">
                  {currentInstructions}
                </p>
              </div>
            ) : isPremium ? (
              <p className="mt-2 text-[11px] text-neutral-400 italic">
                No custom instructions configured yet. Click configure to add
                your default preferences.
              </p>
            ) : (
              <p className="mt-2 text-[11px] font-medium text-amber-700">
                Upgrade to Premium to unlock custom instructions on every
                message.
              </p>
            )}
          </div>

          <div className="shrink-0 self-end pt-1 sm:self-auto">
            <Button
              variant={isPremium ? "outline" : "default"}
              size="sm"
              onClick={handleOpenDialog}
              className="text-xs font-medium"
            >
              {isPremium ? (
                <>
                  <Sliders className="mr-1.5 h-3.5 w-3.5" />
                  {currentInstructions ? "Edit Instructions" : "Configure"}
                </>
              ) : (
                "Upgrade to Unlock"
              )}
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sliders className="text-primary h-4 w-4" />
              Custom Instructions
            </DialogTitle>
            <DialogDescription className="text-xs">
              What would you like Cognito to know about your preferences, role,
              or preferred response style? These instructions apply to every
              prompt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Textarea
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              placeholder="e.g. Always respond in concise bullet points. Prefer TypeScript with strict typing. Keep explanations focused on practical implementation."
              rows={6}
              className={cn(
                "resize-none font-sans text-xs leading-relaxed",
                isOverLimit && "border-red-500 focus-visible:ring-red-500",
              )}
            />
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-medium">
                Applied automatically across all models and tools.
              </span>
              <span
                className={cn(
                  "font-mono font-medium",
                  isOverLimit ? "font-bold text-red-600" : "text-gray-medium",
                )}
              >
                {charCount} / {MAX_INSTRUCTION_CHARS}
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {currentInstructions && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setInstructionsText("")}
                disabled={updateMutation.isPending}
                className="mr-auto text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                Clear
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={updateMutation.isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isOverLimit || updateMutation.isPending}
              className="ml-2 text-xs"
            >
              {updateMutation.isPending && (
                <Spinner className="mr-1.5 h-3.5 w-3.5" />
              )}
              Save Instructions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
