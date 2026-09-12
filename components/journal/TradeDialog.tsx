"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Strategy, StrategyQuestion } from "@/types/strategy";
import type { Trade, CreateTradeInput, TradeDirection, TradeSession, TradeResult, TradeGrade, TradeAnswer } from "@/types/trade";
import { getImageUrl } from "@/services/image.service";

type FormValues = {
  date: string;
  instrument: string;
  direction: TradeDirection | "";
  session: TradeSession | "";
  entryTime: string;
  exitTime: string;
  pnl: string;
  riskAmount: string;
  grade: TradeGrade | "";
  notes: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTradeInput, newImages: File[], removedImageIds: string[]) => void;
  loading?: boolean;
  strategies: Strategy[];
  initial?: Trade;
};

const INSTRUMENTS = ["ES", "NQ", "GC", "YM", "CL", "RTY"];
const SESSIONS: TradeSession[] = ["New York", "London", "Asia"];
const GRADES: TradeGrade[] = ["B", "B+", "A-", "A", "A+", "A+++"];

function pnlToResult(pnl: number): TradeResult {
  if (pnl > 0) return "win";
  if (pnl < 0) return "loss";
  return "breakeven";
}

const RESULT_STYLES: Record<TradeResult, string> = {
  win:       "bg-[color-mix(in_oklch,var(--color-chart-1)_10%,transparent)] text-[var(--color-chart-1)]",
  loss:      "bg-[color-mix(in_oklch,var(--color-chart-2)_10%,transparent)] text-[var(--color-chart-2)]",
  breakeven: "bg-[color-mix(in_oklch,var(--color-chart-3)_10%,transparent)] text-[var(--color-chart-3)]",
};

export function TradeDialog({ open, onClose, onSubmit, loading, strategies, initial }: Props) {
  const [strategyId, setStrategyId] = useState("");
  const [confluences, setConfluences] = useState<string[]>([]);
  const [answers, setAnswers] = useState<TradeAnswer[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; thumbnailKey: string }[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const selectedStrategy = strategies.find((s) => s.id === strategyId) ?? null;

  const { control, register, handleSubmit, reset, watch } =
    useForm<FormValues>({
      defaultValues: {
        date: new Date().toISOString().split("T")[0],
        instrument: "",
        direction: "",
        session: "",
        entryTime: "",
        exitTime: "",
        pnl: "",
        riskAmount: "",
        grade: "",
        notes: "",
      },
    });

  const instrument = watch("instrument");
  const direction = watch("direction");
  const session = watch("session");
  const grade = watch("grade");
  const pnlValue = watch("pnl");
  const entryTime = watch("entryTime");
  const exitTime = watch("exitTime");

  const pnlNum = parseFloat(pnlValue);
  const result: TradeResult | null = isNaN(pnlNum) || pnlValue === "" ? null : pnlToResult(pnlNum);

  useEffect(() => {
    if (open) {
      reset({
        date: initial ? initial.date.split("T")[0] : new Date().toISOString().split("T")[0],
        instrument: initial?.instrument ?? "",
        direction: initial?.direction ?? "",
        session: initial?.session ?? "",
        entryTime: initial?.entryTime ?? "",
        exitTime: initial?.exitTime ?? "",
        pnl: initial?.pnl?.toString() ?? "",
        riskAmount: initial?.riskAmount?.toString() ?? "",
        grade: initial?.grade ?? "",
        notes: initial?.notes ?? "",
      });
      setStrategyId(initial?.strategyId ?? "");
      setConfluences(initial?.confluences ?? []);
      setAnswers(initial?.answers ?? []);
      setImages([]);
      setExistingImages(initial?.images ?? []);
      setRemovedIds([]);
      setNewFiles([]);
    }
  }, [open, initial, reset]);

  useEffect(() => {
    if (!initial && selectedStrategy) {
      setConfluences([]);
      setAnswers(
        selectedStrategy.questions.map((q) => ({ questionId: q.id, selectedOptions: [] }))
      );
    } else if (!initial && !selectedStrategy) {
      setConfluences([]);
      setAnswers([]);
    }
  }, [strategyId, selectedStrategy, initial]);

  function toggleConfluence(c: string) {
    setConfluences((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function toggleAnswer(question: StrategyQuestion, opt: string) {
    setAnswers((prev) =>
      prev.map((a) => {
        if (a.questionId !== question.id) return a;
        if (question.type === "single") return { ...a, selectedOptions: [opt] };
        const has = a.selectedOptions.includes(opt);
        return {
          ...a,
          selectedOptions: has
            ? a.selectedOptions.filter((o) => o !== opt)
            : [...a.selectedOptions, opt],
        };
      })
    );
  }

  function getAnswer(questionId: string): string[] {
    return answers.find((a) => a.questionId === questionId)?.selectedOptions ?? [];
  }

  const allQuestionsAnswered =
    !selectedStrategy ||
    selectedStrategy.questions.every((q) => getAnswer(q.id).length > 0);

  const timesValid = !entryTime || !exitTime || entryTime < exitTime;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const wrongType = picked.find((f) => !["image/jpeg", "image/png", "image/webp"].includes(f.type));
    if (wrongType) {
      toast.error("Only JPEG, PNG and WebP images are allowed");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (images.length + picked.length > 3) {
      toast.error("You can attach up to 3 screenshots per trade");
      return;
    }
    const totalBytes = [...images, ...picked].reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > 10 * 1024 * 1024) {
      toast.error("Total size of screenshots cannot exceed 10 MB");
      return;
    }
    const invalid = picked.find((f) => f.size === 0);
    if (invalid) {
      toast.error("One or more selected files are empty");
      return;
    }
    setImages((prev) => [...prev, ...picked]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    const wrongType = picked.find((f) => !["image/jpeg", "image/png", "image/webp"].includes(f.type));
    if (wrongType) {
      toast.error("Only JPEG, PNG and WebP images are allowed");
      if (editFileInputRef.current) editFileInputRef.current.value = "";
      return;
    }
    const totalSlots = existingImages.length + newFiles.length + picked.length;
    if (totalSlots > 3) {
      toast.error("You can attach up to 3 screenshots per trade");
      return;
    }
    const newTotalBytes = [...newFiles, ...picked].reduce((sum, f) => sum + f.size, 0);
    if (newTotalBytes > 10 * 1024 * 1024) {
      toast.error("New screenshots cannot exceed 10 MB combined");
      return;
    }
    const invalid = picked.find((f) => f.size === 0);
    if (invalid) {
      toast.error("One or more selected files are empty");
      return;
    }
    setNewFiles((prev) => [...prev, ...picked]);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  }

  function removeExistingImage(id: string) {
    setExistingImages((prev) => prev.filter((img) => img.id !== id));
    setRemovedIds((prev) => [...prev, id]);
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const onValid = (values: FormValues) => {
    if (!values.instrument || !values.direction || !values.session ||
        !values.grade || !strategyId || !result) return;

    const input: CreateTradeInput = {
      strategyId,
      date: values.date,
      instrument: values.instrument,
      direction: values.direction as TradeDirection,
      session: values.session as TradeSession,
      entryTime: values.entryTime,
      exitTime: values.exitTime,
      result,
      pnl: pnlNum,
      riskAmount: parseFloat(values.riskAmount),
      grade: values.grade as TradeGrade,
      confluences,
      answers,
      notes: values.notes || undefined,
    };

    if (initial) {
      onSubmit(input, newFiles, removedIds);
    } else {
      onSubmit(input, images, []);
    }
  };

  const canSubmit =
    !!instrument && !!direction && !!session && !!grade && !!result &&
    !!strategyId && allQuestionsAnswered && timesValid && !loading;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <DialogTitle>{initial ? "Edit trade" : "Log a trade"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onValid)} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

            {/* Date + Instrument */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" {...register("date", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Instrument</Label>
                <Controller control={control} name="instrument" rules={{ required: true }}
                  render={({ field }) => (
                    <ToggleGroup options={INSTRUMENTS} value={field.value as string} onChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            {/* Direction + Session */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Direction</Label>
                <Controller control={control} name="direction" rules={{ required: true }}
                  render={({ field }) => (
                    <ToggleGroup options={["long", "short"] as TradeDirection[]} value={field.value}
                      onChange={field.onChange} renderLabel={(v) => v.toUpperCase()} />
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>Session</Label>
                <Controller control={control} name="session" rules={{ required: true }}
                  render={({ field }) => (
                    <ToggleGroup options={SESSIONS} value={field.value}
                      onChange={field.onChange} renderLabel={(v) => v.toUpperCase()} />
                  )}
                />
              </div>
            </div>

            {/* Entry / Exit Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entryTime">Entry Time</Label>
                <Input id="entryTime" type="time" {...register("entryTime", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exitTime">
                  Exit Time
                  {entryTime && exitTime && !timesValid && (
                    <span className="ml-2 text-xs text-destructive">must be after entry</span>
                  )}
                </Label>
                <Input id="exitTime" type="time" {...register("exitTime", { required: true })}
                  className={cn(entryTime && exitTime && !timesValid && "border-destructive")} />
              </div>
            </div>

            {/* P&L + Risk + auto Result badge */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pnl">
                  P&L ($)
                  {result && (
                    <span className={cn("ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold", RESULT_STYLES[result])}>
                      {result === "breakeven" ? "BE" : result.toUpperCase()}
                    </span>
                  )}
                </Label>
                <Input id="pnl" type="number" step="0.01" placeholder="e.g. 250.00 or -100.00"
                  {...register("pnl", { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="riskAmount">Risk ($)</Label>
                <Input id="riskAmount" type="number" step="0.01" placeholder="e.g. 200"
                  {...register("riskAmount", { required: true })} />
              </div>
            </div>

            {/* Strategy */}
            <div className="space-y-2">
              <Label>Strategy</Label>
              <select
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a strategy...</option>
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Confluences */}
            {selectedStrategy && selectedStrategy.confluences.length > 0 && (
              <div className="space-y-2">
                <Label>Which confluences applied?</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedStrategy.confluences.map((c) => (
                    <Button key={c} type="button"
                      variant={confluences.includes(c) ? "default" : "outline"}
                      onClick={() => toggleConfluence(c)}>
                      {c}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Post-trade questions */}
            {selectedStrategy && selectedStrategy.questions.length > 0 && (
              <div className="space-y-4">
                <Label>Post-trade questions</Label>
                {selectedStrategy.questions.map((q, i) => (
                  <div key={q.id} className="space-y-2 rounded-lg border border-border p-3">
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground mr-2">{i + 1}.</span>
                      {q.text}
                      <span className={cn(
                        "ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                        q.type === "multi" ? "bg-blue-500/10 text-blue-500" : "bg-primary/10 text-primary"
                      )}>
                        {q.type === "multi" ? "multi" : "single"}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt) => (
                        <Button key={opt} type="button"
                          variant={getAnswer(q.id).includes(opt) ? "default" : "outline"}
                          onClick={() => toggleAnswer(q, opt)}>
                          {opt}
                        </Button>
                      ))}
                    </div>
                    {getAnswer(q.id).length === 0 && (
                      <p className="text-xs text-destructive">Required</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Grade */}
            <div className="space-y-2">
              <Label>Grade</Label>
              <Controller control={control} name="grade" rules={{ required: true }}
                render={({ field }) => (
                  <ToggleGroup options={GRADES} value={field.value}
                    onChange={field.onChange} renderLabel={(v) => v} />
                )}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                Notes <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Textarea id="notes" placeholder="Setup, mistakes, what went right..."
                rows={3} {...register("notes")} />
            </div>

            {/* Screenshots */}
            {initial ? (
              <div className="space-y-2">
                <Label>
                  Screenshots <span className="text-muted-foreground text-xs">(optional, up to 3)</span>
                </Label>
                <input
                  ref={editFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleEditFileChange}
                />
                {existingImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getImageUrl(img.id)}
                          alt="Trade screenshot"
                          className="h-16 w-24 object-cover rounded border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute top-0.5 right-0.5 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {newFiles.length > 0 && (
                  <ul className="space-y-1">
                    {newFiles.map((file, i) => (
                      <li key={i} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm">
                        <span className="truncate text-muted-foreground">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeNewFile(i)}
                          className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {existingImages.length + newFiles.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editFileInputRef.current?.click()}
                  >
                    Choose files
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>
                  Screenshots <span className="text-muted-foreground text-xs">(optional, up to 3)</span>
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                {images.length < 3 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose files
                  </Button>
                )}
                {images.length > 0 && (
                  <ul className="space-y-1">
                    {images.map((file, i) => (
                      <li key={i} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm">
                        <span className="truncate text-muted-foreground">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {loading ? "Saving..." : initial ? "Save changes" : "Add Trade"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
