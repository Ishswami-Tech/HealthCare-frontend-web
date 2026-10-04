"use client";

import type { FormEvent } from "react";
import { Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { IconBox } from "@/components/tbd";

/** Type the code printed under the clinic QR, for when the camera cannot be used. */
export function ManualCodeDrawer({
  open,
  onOpenChange,
  code,
  onCodeChange,
  onSubmit,
  isProcessing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
  onCodeChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isProcessing: boolean;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-[22px] border bg-background">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="mt-2 items-start gap-1.5 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left">
            <IconBox icon={QrCode} tone="mint" size={44} className="mb-2" />
            <DrawerTitle className="text-xl font-extrabold text-ink">Enter the desk code</DrawerTitle>
            <DrawerDescription className="text-sm text-ink-muted">
              Type the code printed under the QR at the reception desk. We check the code, your visit and your
              location before you are checked in.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <form id="manual-checkin-form" onSubmit={onSubmit} className="flex flex-col gap-2">
              <label htmlFor="manual-checkin-code" className="text-xs font-bold text-ink-muted">
                Desk code
              </label>
              <Input
                id="manual-checkin-code"
                placeholder="Enter the code"
                value={code}
                onChange={(event) => onCodeChange(event.target.value.toUpperCase())}
                className="h-[50px] text-center text-base font-bold uppercase tracking-[2px]"
                maxLength={160}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
              />
            </form>
          </div>
          <DrawerFooter className="pb-6 pt-5">
            <Button
              type="submit"
              form="manual-checkin-form"
              size="xl"
              className="w-full"
              disabled={code.length < 4 || isProcessing}
              aria-busy={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Checking you in…
                </>
              ) : (
                "Check in"
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" size="md" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
