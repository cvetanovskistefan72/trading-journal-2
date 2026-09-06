"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Plus, Trash2, X } from "lucide-react";

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
import type { Strategy, CreateStrategyInput, StrategyQuestion } from "@/types/strategy";

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
    setValue("questions", [...questions, { id: crypto.randomUUID(), text: val }]);
    setValue("questionInput", "");
    questionInputRef.current?.focus();
  }

  function removeQuestion(id: string) {
    setValue("questions", questions.filter((q) => q.id !== id));
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
            <Label>
              Confluences{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
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
                      className="text-muted-foreground hover:text-foreground"
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
              Pre-trade questions{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Is the trend aligned?"
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
              <ul className="space-y-1 pt-1">
                {questions.map((q, i) => (
                  <li key={q.id} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground w-5 shrink-0">{i + 1}.</span>
                    <span className="flex-1 break-all min-w-0">{q.text}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.id)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : initial ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
