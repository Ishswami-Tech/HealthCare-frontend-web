"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export function AutomaticInvoiceGenerator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatic Invoice Generator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Automatic generation is available from billing workflows and backend cron jobs.
        </p>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Configure Templates
        </Button>
      </CardContent>
    </Card>
  );
}
