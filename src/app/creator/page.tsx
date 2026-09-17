import { Suspense } from "react";
import CreatorProfile from "@/components/CreatorProfile";

export default function CreatorPage() {
  return (
    <Suspense
      fallback={<div className="p-8 text-center text-neutral-500">Loading…</div>}
    >
      <CreatorProfile />
    </Suspense>
  );
}
