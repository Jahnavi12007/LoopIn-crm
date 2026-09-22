import { useState } from "react";
import { Check, Clock, Pencil, Phone, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PriorityBadge } from "@/components/common/Badges";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useQuickActions } from "@/components/modals/QuickActions";
import { useDbAction } from "@/hooks/useData";
import { formatAmount, formatDueLabel } from "@/lib/format";
import { buildCallLink } from "@/lib/whatsapp";
import * as db from "@/services/db";
import { FOLLOW_UP_REASON_LABELS } from "@/types";
import type { Customer, CurrencyCode, FollowUp } from "@/types";
import { cn } from "@/lib/utils";

interface FollowUpCardProps {
  followUp: FollowUp;
  customer: Customer | undefined;
  currency: CurrencyCode;
  pendingAmount?: number;
  showEditActions?: boolean;
  className?: string;
}

/** The central action card: who to contact, why, and one-tap WhatsApp / Call / Complete. */
export function FollowUpCard({
  followUp,
  customer,
  currency,
  pendingAmount,
  showEditActions = false,
  className,
}: FollowUpCardProps) {
  const quickActions = useQuickActions();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const complete = useDbAction(
    (businessId: string, id: string) => db.completeFollowUp(businessId, id),
    { successMessage: "Follow-up completed 🎉" },
  );
  const reschedule = useDbAction(
    (businessId: string, id: string, date: string, time: string) => db.rescheduleFollowUp(businessId, id, date, time),
    { successMessage: "Follow-up rescheduled" },
  );
  const logCall = useDbAction(
    (businessId: string, customerId: string) => db.logContactActivity(businessId, customerId, "call"),
    { successMessage: null },
  );

  if (!customer) return null;

  const handleCall = () => {
    window.open(buildCallLink(customer.phone), "_self");
    void logCall(customer.id);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-lifted",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => quickActions.openMessageComposer({ customer, followUp })}
            className="focus-ring truncate rounded font-semibold text-foreground hover:text-forest-700"
          >
            {customer.name}
          </button>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {FOLLOW_UP_REASON_LABELS[followUp.reason]}
            {followUp.notes ? ` · ${followUp.notes}` : ""}
          </p>
        </div>
        <PriorityBadge priority={followUp.priority} className="shrink-0" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDueLabel(followUp.date, followUp.time)}
        </span>
        {pendingAmount && pendingAmount > 0 ? (
          <span className="font-semibold text-rose-600">{formatAmount(pendingAmount, currency)} pending</span>
        ) : null}
        {followUp.recurrence !== "none" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-semibold text-forest-700">
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Repeats
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="h-9 bg-forest-600 hover:bg-forest-700"
          onClick={() => quickActions.openMessageComposer({ customer, followUp })}
        >
          <WhatsAppIcon className="mr-1.5 h-3.5 w-3.5" />
          WhatsApp
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-9" onClick={handleCall}>
          <Phone className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Call
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 border-forest-300 text-forest-700 hover:bg-forest-50 hover:text-forest-800"
          onClick={() => void complete(followUp.id)}
        >
          <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Complete
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 text-muted-foreground"
          onClick={() => setRescheduleOpen(true)}
        >
          <Clock className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Reschedule
        </Button>
        {showEditActions ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9 text-muted-foreground"
              onClick={() => quickActions.openFollowUpForm({ followUp })}
              aria-label="Edit follow-up"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <DeleteFollowUpButton followUpId={followUp.id} />
          </>
        ) : null}
      </div>

      <RescheduleDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        defaultDate={followUp.date}
        defaultTime={followUp.time}
        onSave={async (date, time) => {
          await reschedule(followUp.id, date, time);
        }}
      />
    </div>
  );
}

export function RescheduleDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultTime,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate: string;
  defaultTime: string;
  onSave: (date: string, time: string) => Promise<void>;
}) {
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState(defaultTime);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(date, time);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Reschedule</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reschedule-date">Date</Label>
            <Input id="reschedule-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reschedule-time">Time</Label>
            <Input id="reschedule-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving || !date || !time}>
            {isSaving ? "Saving…" : "Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteFollowUpButton({ followUpId }: { followUpId: string }) {
  const [open, setOpen] = useState(false);
  const remove = useDbAction((businessId: string, id: string) => db.deleteFollowUp(businessId, id), {
    successMessage: "Follow-up deleted",
  });

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-9 text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
        aria-label="Delete follow-up"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Delete follow-up?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This follow-up will be removed permanently.</p>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                await remove(followUpId);
                setOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
