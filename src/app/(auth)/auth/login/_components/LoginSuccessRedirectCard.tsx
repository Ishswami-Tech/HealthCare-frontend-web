"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

export function LoginSuccessRedirectCard() {
  return (
    <div className="mx-auto w-full max-w-[380px]">
      <Card className="overflow-hidden rounded-lg border-0 bg-white shadow-lg dark:bg-slate-900">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-10">
          <div className="relative">
            <div className="flex size-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="size-7 text-green-600 dark:text-green-400" />
            </div>
            <Loader2 className="absolute inset-0 m-auto size-18 animate-spin text-green-500/30" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900 dark:text-white">Signed in!</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Redirecting…</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
