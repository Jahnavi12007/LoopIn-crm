import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDbAction, useSnapshot } from "@/hooks/useData";
import { todayISO } from "@/lib/format";
import * as db from "@/services/db";
import { FOLLOW_UP_REASON_LABELS } from "@/types";
import type { FollowUp, FollowUpPriority, FollowUpReason, FollowUpRecurrence } from "@/types";

const followUpSchema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  reason: z.enum(["payment", "order", "appointment", "enquiry", "feedback", "other"]),
  date: z.string().min(1, "Pick a date."),
  time: z.string().min(1, "Pick a time."),
  priority: z.enum(["low", "medium", "high"]),
  recurrence: z.enum(["none", "weekly", "monthly", "quarterly"]),
  notes: z.string().optional(),
});

type FollowUpFormValues = z.infer<typeof followUpSchema>;

interface FollowUpFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preselect a customer (e.g. opened from a customer profile). */
  customerId?: string;
  /** When set, the modal edits this follow-up instead of creating one. */
  followUp?: FollowUp | null;
}

const RECURRENCE_LABELS: Record<FollowUpRecurrence, string> = {
  none: "Does not repeat",
  weekly: "Every week",
  monthly: "Every 30 days",
  quarterly: "Every 3 months",
};

export function FollowUpFormModal({ open, onOpenChange, customerId, followUp }: FollowUpFormModalProps) {
  const isEdit = Boolean(followUp);
  const snapshot = useSnapshot();
  const [lockedCustomerId, setLockedCustomerId] = useState<string | undefined>(customerId);

  useEffect(() => {
    if (open) setLockedCustomerId(customerId);
  }, [open, customerId]);

  const activeCustomers = useMemo(
    () => snapshot.customers.filter((c) => !c.archived).sort((a, b) => a.name.localeCompare(b.name)),
    [snapshot.customers],
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      customerId: customerId ?? "",
      reason: "other",
      date: todayISO(),
      time: "10:00",
      priority: "medium",
      recurrence: "none",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        customerId: followUp?.customerId ?? customerId ?? "",
        reason: followUp?.reason ?? "other",
        date: followUp?.date ?? todayISO(),
        time: followUp?.time ?? "10:00",
        priority: followUp?.priority ?? "medium",
        recurrence: followUp?.recurrence ?? "none",
        notes: followUp?.notes ?? "",
      });
      setLockedCustomerId(followUp?.customerId ?? customerId);
    }
  }, [open, followUp, customerId, reset]);

  const createFollowUp = useDbAction(db.addFollowUp, { successMessage: "Follow-up created" });
  const updateFollowUp = useDbAction(
    (businessId: string, updated: FollowUp) => db.updateFollowUp(businessId, updated),
    { successMessage: "Follow-up updated" },
  );

  const values = watch();

  const onSubmit = handleSubmit(async (form) => {
    try {
      if (isEdit && followUp) {
        await updateFollowUp({ ...followUp, ...form, notes: form.notes || undefined });
      } else {
        await createFollowUp({
          customerId: form.customerId,
          reason: form.reason,
          date: form.date,
          time: form.time,
          priority: form.priority,
          notes: form.notes || undefined,
          recurrence: form.recurrence,
        });
      }
      onOpenChange(false);
    } catch {
      // surfaced via toast
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Edit Follow-up" : "Add Follow-up"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Change the details of this follow-up." : "Who should you contact, and why?"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="fu-customer">Customer *</Label>
            {lockedCustomerId || isEdit ? (
              <Input
                id="fu-customer"
                value={activeCustomers.find((c) => c.id === values.customerId)?.name ?? ""}
                disabled
                aria-readonly
              />
            ) : (
              <Select value={values.customerId} onValueChange={(v) => setValue("customerId", v)}>
                <SelectTrigger id="fu-customer" aria-invalid={Boolean(errors.customerId)}>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {activeCustomers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.customerId ? <p className="text-xs text-destructive">{errors.customerId.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fu-reason">Reason</Label>
              <Select value={values.reason} onValueChange={(v) => setValue("reason", v as FollowUpReason)}>
                <SelectTrigger id="fu-reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(FOLLOW_UP_REASON_LABELS) as FollowUpReason[]).map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {FOLLOW_UP_REASON_LABELS[reason]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fu-priority">Priority</Label>
              <Select value={values.priority} onValueChange={(v) => setValue("priority", v as FollowUpPriority)}>
                <SelectTrigger id="fu-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="fu-date">Date *</Label>
              <Input id="fu-date" type="date" {...register("date")} aria-invalid={Boolean(errors.date)} />
              {errors.date ? <p className="text-xs text-destructive">{errors.date.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fu-time">Time *</Label>
              <Input id="fu-time" type="time" {...register("time")} aria-invalid={Boolean(errors.time)} />
              {errors.time ? <p className="text-xs text-destructive">{errors.time.message}</p> : null}
            </div>
          </div>

          {!isEdit ? (
            <div className="space-y-1.5">
              <Label htmlFor="fu-recurrence">Repeat</Label>
              <Select value={values.recurrence} onValueChange={(v) => setValue("recurrence", v as FollowUpRecurrence)}>
                <SelectTrigger id="fu-recurrence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RECURRENCE_LABELS) as FollowUpRecurrence[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {RECURRENCE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Repeating follow-ups automatically create the next one when you complete them.
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="fu-notes">Notes (optional)</Label>
            <Textarea id="fu-notes" rows={2} placeholder="What should you remember for this follow-up?" {...register("notes")} />
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Create Follow-up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
