import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DashboardPageHeader,
  DashboardPageShell,
} from "@/components/dashboard/DashboardPageShell";

export interface WorkspaceAction {
  label: string;
  href: string;
  description: string;
}

interface AssistantDoctorWorkspaceShellProps {
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  actions: WorkspaceAction[];
}

export function AssistantDoctorWorkspaceShell({
  eyebrow,
  title,
  description,
  note,
  actions,
}: AssistantDoctorWorkspaceShellProps) {
  return (
    <DashboardPageShell className="p-4 sm:p-6">
      <DashboardPageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        meta={<Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{note}</Badge>}
      />

      <Card className="border shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {actions.map((action) => (
              <Card key={action.href} className="border-border/60 bg-muted/20 shadow-none">
                <CardContent className="space-y-3 p-4">
                  <div className="space-y-1">
                    <h2 className="text-base font-semibold text-foreground">{action.label}</h2>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <Button asChild className="w-full gap-2">
                    <Link href={action.href} prefetch={false}>
                      Open workspace
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
