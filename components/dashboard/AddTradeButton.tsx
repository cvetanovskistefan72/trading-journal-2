"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TradeDialog } from "@/components/journal/TradeDialog";
import { getStrategies } from "@/services/strategies.service";
import { createTrade } from "@/services/trades.service";
import type { CreateTradeInput } from "@/types/trade";

export function AddTradeButton() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: strategies = [] } = useQuery({
    queryKey: ["strategies"],
    queryFn: getStrategies,
  });

  const mutation = useMutation({
    mutationFn: (input: CreateTradeInput) => createTrade(input),
    onSuccess: () => {
      toast.success("Trade logged");
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
    },
    onError: () => toast.error("Failed to log trade"),
  });

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        disabled={strategies.length === 0 || mutation.isPending}
        className="gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Trade
      </Button>

      <TradeDialog
        open={open}
        onClose={() => setOpen(false)}
        strategies={strategies}
        onSubmit={(input) => mutation.mutate(input)}
        loading={mutation.isPending}
      />
    </>
  );
}
