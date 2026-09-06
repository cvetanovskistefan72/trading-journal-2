"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Strategy, CreateStrategyInput, StrategyQuestion, QuestionType } from "@/types/strategy";

type FormValues = {
  name: string;
  description: string;
  confluenceInput: string;
  questionInput: string;
  confluences: string[];
  questions: StrategyQuestion[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateStrategyInput) => void;
  loading?: boolean;
  initial?: Strategy;
};

function QuestionEditor({
  question,
  index,
  onChange,
  onRemove,
}: {
  question: StrategyQuestion;
  index: number;
  onChange: (q: StrategyQuestion) => void;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [optionInput, setOptionInput] = useState("");
  const optionInputRef = useRef<HTMLInputElement>(null);

  function addOption() {
    const val = optionInput.trim();
    if (!val || question.options.includes(val)) return;
    onChange({ ...question, options: [...question.options, val] });
    setOptionInput("");
    optionInputRef.current?.focus();
  }

  function removeOption(opt: string) {
    onChange({ ...question, options: question.options.filter((o) => o !== opt) });
  }

  function setType(type: QuestionType) {
    onChange({ ...question, type });
  }

  return (
    <li className="rounded-lg border border-border bg-muted/30 overflow-hidden">
      {/* Question header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-muted-foreground text-xs w-5 shrink-0">{index + 1}.</span>
        <span className="flex-1 text-sm font-medium min-w-0 break-all">{question.text}</span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive cursor-pointer shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
          {/* Type toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Answer type:</span>
            <div className="flex rounded-md border border-border overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setType("single")}
                className={`px-3 py-1 cursor-pointer transition-colors ${
                  question.type === "single"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Single choice
              </button>
              <button
                type="button"
                onClick={() => setType("multi")}
                className={`px-3 py-1 cursor-pointer transition-colors border-l border-border ${
                  question.type === "multi"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Multi choice
              </button>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground">Answer options:</span>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Yes"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                ref={optionInputRef}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                className="h-8 text-sm"
              />
              <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={addOption}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            {question.options.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {question.options.map((opt) => (
                  <span
                    key={opt}
                    className="flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs"
                  >
                    {opt}
                    <button
                      type="button"
                      onClick={() => removeOption(opt)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {question.options.length < 2 && (
              <p className="text-xs text-muted-foreground/60">Add at least 2 options.</p>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export function StrategyDialog({ open, onClose, onSubmit, loading, initial }: Props) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: {
        name: "",
        description: "",
        confluenceInput: "",
        questionInput: "",
        confluences: [],
        questions: [],
      },
    });

  const confluenceInputRef = useRef<HTMLInputElement | null>(null);
  const questionInputRef = useRef<HTMLInputElement | null>(null);

  const confluences = watch("confluences");
  const questions = watch("questions");
  const confluenceInput = watch("confluenceInput");
  const questionInput = watch("questionInput");

  useEffect(() => {
    if (open) {
      reset({
        name: initial?.name ?? "",
        description: initial?.description ?? "",
        confluenceInput: "",
        questionInput: "",
        confluences: initial?.confluences ?? [],
        questions: initial?.questions ?? [],
      });
    }
  }, [open, initial, reset]);

  function addConfluence() {
    const val = confluenceInput.trim();
    if (!val || confluences.includes(val)) return;
    setValue("confluences", [...confluences, val]);
    setValue("confluenceInput", "");
    confluenceInputRef.current?.focus();
  }

  function removeConfluence(val: string) {
    setValue("confluences", confluences.filter((c) => c !== val));
  }

  function addQuestion() {
    const val = questionInput.trim();
    if (!val || questions.some((q) => q.text === val)) return;
    setValue("questions", [
      ...questions,
      { id: crypto.randomUUID(), text: val, type: "single", options: [] },
    ]);
    setValue("questionInput", "");
    questionInputRef.current?.focus();
  }

  function removeQuestion(id: string) {
    setValue("questions", questions.filter((q) => q.id !== id));
  }

  function updateQuestion(updated: StrategyQuestion) {
    setValue("questions", questions.map((q) => (q.id === updated.id ? updated : q)));
  }

  const onValid = (values: FormValues) => {
    onSubmit({
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      confluences: values.confluences,
      questions: values.questions,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit strategy" : "New strategy"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onValid)} className="space-y-5 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g. Break & Retest"
              {...register("name", { required: true })}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && (
              <p className="text-xs text-destructive">Name is required</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe the setup rules..."
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Confluences */}
          <div className="space-y-2">
            <Label>Confluences</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Trend aligned"
                {...register("confluenceInput")}
                ref={(el) => {
                  register("confluenceInput").ref(el);
                  confluenceInputRef.current = el;
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addConfluence}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {confluences.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {confluences.map((c) => (
                  <span
                    key={c}
                    className="flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => removeConfluence(c)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Questions */}
          <div className="space-y-2">
            <Label>
              Post-trade questions{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Did you follow your plan?"
                {...register("questionInput")}
                ref={(el) => {
                  register("questionInput").ref(el);
                  questionInputRef.current = el;
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addQuestion())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addQuestion}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {questions.length > 0 && (
              <ul className="space-y-2 pt-1">
                {questions.map((q, i) => (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    index={i}
                    onChange={updateQuestion}
                    onRemove={() => removeQuestion(q.id)}
                  />
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || confluences.length === 0}>
              {loading ? "Saving..." : initial ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
