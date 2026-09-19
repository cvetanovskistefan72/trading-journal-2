"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export type Account = { id: string; name: string; createdAt: string };

type AccountsResponse = { accounts: Account[]; activeId: string | null };

async function fetchAccounts(): Promise<AccountsResponse> {
  const res = await fetch("/api/accounts");
  if (!res.ok) throw new Error("Failed to fetch accounts");
  return res.json();
}

async function setActiveAccount(accountId: string) {
  const res = await fetch("/api/accounts/active", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId }),
  });
  if (!res.ok) throw new Error("Failed to set active account");
}

export function useActiveAccount() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AccountsResponse>({
    queryKey: ["accounts"],
    queryFn: fetchAccounts,
    staleTime: 0,
  });

  const accounts = data?.accounts ?? [];
  const activeAccount = accounts.find((a) => a.id === data?.activeId) ?? accounts[0] ?? null;

  const switchMutation = useMutation({
    mutationFn: setActiveAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });

  return {
    accounts,
    activeAccount,
    isLoading,
    switchAccount: (accountId: string) => switchMutation.mutate(accountId),
    isSwitching: switchMutation.isPending,
  };
}
