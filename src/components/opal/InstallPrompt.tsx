"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Share,
  Smartphone,
  PlusSquare,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    nav.standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

/** Install state shared across the app. */
export function useInstallState() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIOS());

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unsupported" as const;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setDeferred(null);
    return choice.outcome;
  }, [deferred]);

  return {
    canInstall: !!deferred,
    installed,
    ios,
    promptInstall,
  };
}

export function InstallPrompt({
  className,
  variant = "icon",
}: {
  className?: string;
  variant?: "icon" | "full" | "card";
}) {
  const { canInstall, installed, ios, promptInstall } = useInstallState();
  const [sheet, setSheet] = useState(false);

  if (installed) {
    if (variant === "card") {
      return (
        <div
          className={cn(
            "surface-glass flex items-center gap-3 rounded-2xl p-3.5",
            className
          )}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#68d391]/12">
            <Check className="size-4 text-[#68d391]" strokeWidth={3} />
          </span>
          <div>
            <p className="text-[13.5px] font-semibold text-foreground">
              Opal is installed
            </p>
            <p className="text-[11.5px] text-muted-foreground">
              Running as a standalone app
            </p>
          </div>
        </div>
      );
    }
    return null;
  }

  /* Chromium / Android: native install prompt */
  if (canInstall) {
    if (variant === "card") {
      return (
        <Button
          className={cn("h-12 w-full rounded-2xl", className)}
          onClick={() => void promptInstall()}
        >
          <Download className="size-4" />
          Install Opal — offline-ready app
        </Button>
      );
    }
    if (variant === "full") {
      return (
        <Button
          variant="secondary"
          className={cn("h-11 w-full rounded-2xl", className)}
          onClick={() => void promptInstall()}
        >
          <Download className="size-4" />
          Install app
        </Button>
      );
    }
    return (
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label="Install app"
        className={cn("rounded-full", className)}
        onClick={() => void promptInstall()}
      >
        <Download className="size-4" />
      </Button>
    );
  }

  /* iOS Safari: manual Add-to-Home-Screen flow */
  const showIOS = ios || variant === "card";

  if (!showIOS) return null;

  if (variant === "card") {
    return (
      <>
        <Button
          variant="secondary"
          className={cn("h-12 w-full rounded-2xl", className)}
          onClick={() => setSheet(true)}
        >
          <PlusSquare className="size-4" />
          Add to Home Screen
        </Button>
        <IOSSheet open={sheet} onOpenChange={setSheet} />
      </>
    );
  }

  if (variant === "full") {
    return (
      <>
        <Button
          variant="secondary"
          className={cn("h-11 w-full rounded-2xl", className)}
          onClick={() => setSheet(true)}
        >
          <PlusSquare className="size-4" />
          Add to Home Screen
        </Button>
        <IOSSheet open={sheet} onOpenChange={setSheet} />
      </>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        size="icon-sm"
        aria-label="Add to Home Screen"
        className={cn("rounded-full", className)}
        onClick={() => setSheet(true)}
      >
        <Share className="size-4" />
      </Button>
      <IOSSheet open={sheet} onOpenChange={setSheet} />
    </>
  );
}

function IOSSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg">
        <SheetHeader>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary/12">
              <Smartphone className="size-4 text-primary" />
            </span>
            <SheetTitle>Install Opal on this device</SheetTitle>
          </div>
          <SheetDescription>
            Two taps and Opal runs fullscreen from your home screen — same as a
            native app.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 px-5 pb-2">
          <Step
            n={1}
            icon={<Share className="size-4" />}
            title="Tap the Share button"
            body="In Safari it's the square-with-up-arrow icon in the toolbar."
          />
          <Step
            n={2}
            icon={<PlusSquare className="size-4" />}
            title="Choose “Add to Home Screen”"
            body="Scroll down in the share sheet if you don't see it."
          />
          <Step
            n={3}
            icon={<Check className="size-4" />}
            title="Open Opal from your home screen"
            body="It launches fullscreen, offline-capable, and keeps your session."
          />
        </div>

        <div className="px-5 pb-4">
          <Button
            variant="outline"
            className="h-11 w-full rounded-2xl"
            onClick={() => onOpenChange(false)}
          >
            <ExternalLink className="size-4" />
            Got it
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Step({
  n,
  icon,
  title,
  body,
}: {
  n: number;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: n * 0.05 }}
      className="surface-sunken flex items-start gap-3 rounded-2xl p-3.5"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--surface-strong)] text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
          {body}
        </p>
      </div>
      <Badge variant="secondary" size="sm" className="ml-auto shrink-0">
        {n}
      </Badge>
    </motion.div>
  );
}
