"use client";

import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";

const Journal = dynamic(() => import("./_journal"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner />
    </div>
  ),
});

export default function JournalPage() {
  return <Journal />;
}
