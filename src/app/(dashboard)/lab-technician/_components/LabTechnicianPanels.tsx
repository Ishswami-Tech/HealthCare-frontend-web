"use client";

import { AlertCircle, CheckCircle, Clock, FileText, TestTube2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

type LabTestSummary = {
  id: string;
  patientName: string;
  testType: string;
  priority?: string;
  requestedAt?: string;
  status?: string;
  completedAt?: string;
};

interface LabTechnicianPanelsProps {
  pendingTests: LabTestSummary[];
  recentResults: LabTestSummary[];
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

export function LabTechnicianPanels({
  pendingTests,
  recentResults,
  getPriorityColor,
  getStatusColor,
}: LabTechnicianPanelsProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="size-5 text-orange-600" />
            Test Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTests.length === 0 ? (
            <Empty className="min-h-[220px] border-border/70 bg-muted/20">
              <EmptyContent>
                <EmptyMedia variant="icon">
                  <Clock className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No pending lab tests</EmptyTitle>
                <EmptyDescription>Tests waiting for processing will appear here.</EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="gap-y-4">
              {pendingTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-orange-100">
                      <TestTube2 className="size-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold leading-none">{test.patientName}</h4>
                      <p className="text-sm text-muted-foreground">{test.testType}</p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {test.requestedAt}
                      </p>
                    </div>
                  </div>
                  <Badge className={getPriorityColor(test.priority || "normal")}>
                    {(test.priority || "normal").toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="size-5 text-green-600" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentResults.length === 0 ? (
            <Empty className="min-h-[220px] border-border/70 bg-muted/20">
              <EmptyContent>
                <EmptyMedia variant="icon">
                  <FileText className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No recent lab reports</EmptyTitle>
                <EmptyDescription>Reported results will appear here once finalized.</EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="gap-y-4">
              {recentResults.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-green-100">
                      <FileText className="size-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold leading-none">{result.patientName}</h4>
                      <p className="text-sm text-muted-foreground">{result.testType}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Reported: {result.completedAt}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(result.status || "")}>
                    {(result.status || "").toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
