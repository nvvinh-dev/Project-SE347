"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MedicalRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/medical/health");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

