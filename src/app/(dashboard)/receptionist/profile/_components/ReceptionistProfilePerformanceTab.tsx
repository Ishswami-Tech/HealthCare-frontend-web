"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export function ReceptionistProfilePerformanceTab() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="py-12 text-center text-muted-foreground">
          <TrendingUp className="mx-auto mb-4 size-12 opacity-30" />
          <p className="font-medium">Performance analytics not yet available</p>
          <p className="mt-1 text-sm">Stats will appear here once the analytics backend is configured.</p>
        </div>
      </CardContent>
    </Card>
  );
}
