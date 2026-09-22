import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { useAuth } from "@/context/AuthContext";
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
import { formatAmount, todayISO } from "@/lib/format";
import { computeCustomerStats, invoiceBreakdown } from "@/services/selectors";
import * as db from "@/services/db";
import { PAYMENT_METHOD_LABELS } from "@/types";
import type { PaymentMethod } from "@/types";

const paymentSchema = z.object({
  customerId: z.string().min(1, "Choose a customer."),
  invoiceId: z.string().optional(),
  amount: z
    .string()
    .min(1, "Enter an amount.")
    .refine((v) => Number(v) > 0, "Amount must be more than zero."),
  date: z.string().min(1, "Pick a date."),
  method: z.enum(["cash", "upi", "bank", "card", "other"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
}

export function PaymentFormModal({ open, onOpenChange, customerId }: PaymentFormModalProps) {
  const snapshot = useSnapshot();
  const { business } = useAuth();
  const currency = business?.currency ?? "INR";

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
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { customerId: customerId ?? "", invoiceId: "none", amount: "", date: todayISO(), method: "upi", reference: "", notes: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ customerId: customerId ?? "", invoiceId: "none", amount: "", date: todayISO(), method: "upi", reference: "", notes: "" });
    }
  }, [open, customerId, reset]);

  const values = watch();
  const selectedCustomerId = values.customerId;

  const pendingInvoices = useMemo(() => {
    if (!selectedCustomerId) return [];
    return snapshot.invoices
      .filter((i) => i.customerId === selectedCustomerId)
      .map((i) => invoiceBreakdown(snapshot, i))
      .filter(({ pending }) => pending > 0)
      .sort((a, b) => (a.invoice.dueDate ?? "9999").localeCompare(b.invoice.dueDate ?? "9999"));
  }, [snapshot, selectedCustomerId]);

  // Keep amount in sync with the selected invoice until the user edits it.
  useEffect(() => {
    const selected = pendingInvoices.find(({ invoice }) => invoice.id === values.invoiceId);
    if (selected) setValue("amount", String(selected.pending));
  }, [values.invoiceId, pendingInvoices, setValue]);

  const stats = useMemo(
    () => (selectedCustomerId ? computeCustomerStats(snapshot, selectedCustomerId) : null),
    [snapshot, selectedCustomerId],
  );

  const selectedPending = values.invoiceId && values.invoiceId !== "none"
    ? pendingInvoices.find(({ invoice }) => invoice.id === values.invoiceId)?.pending ?? null
    : null;
  const enteredAmount = Number(values.amount);
  const overpayment = selectedPending != null && enteredAmount > selectedPending ? enteredAmount - selectedPending : 0;

  const addPayment = useDbAction(db.addPayment, { successMessage: "Payment recorded" });

  const onSubmit = handleSubmit(async (form) => {
    try {
      await addPayment({
        customerId: form.customerId,
        invoiceId: form.invoiceId && form.invoiceId !== "none" ? form.invoiceId : undefined,
        amount: Number(form.amount),
        date: form.date,
        method: form.method,
        reference: form.reference || undefined,
        notes: form.notes || undefined,
      });
      onOpenChange(false);
    } catch {
      // surfaced via toast
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Record Payment</DialogTitle>
          <DialogDescription>Log money received — customer balances update automatically.</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="pay-customer">Customer *</Label>
            <Select
              value={selectedCustomerId}
              onValueChange={(v) => {
                setValue("customerId", v);
                setValue("invoiceId", "none");
                setValue("amount", "");
              }}
            >
              <SelectTrigger id="pay-customer" aria-invalid={Boolean(errors.customerId)}>
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
            {errors.customerId ? <p className="text-xs text-destructive">{errors.customerId.message}</p> : null}
            {stats && stats.pending > 0 ? (
              <p className="text-xs text-muted-foreground">
                Pending balance: <span className="font-semibold text-foreground">{formatAmount(stats.pending, currency)}</span>
              </p>
            ) : null}
            {stats && stats.credit > 0 ? (
              <p className="rounded-lg bg-gold-50 px-2.5 py-1.5 text-xs font-medium text-gold-800">
                This customer has {formatAmount(stats.credit, currency)} in credit/advance. It isn't applied
                automatically — apply it from their profile.
              </p>
            ) : null}
          </div>

          {pendingInvoices.length > 0 ? (
            <div className="space-y-1.5">
              <Label htmlFor="pay-invoice">Apply to</Label>
              <Select value={values.invoiceId} onValueChange={(v) => setValue("invoiceId", v)}>
                <SelectTrigger id="pay-invoice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific invoice (kept as customer credit)</SelectItem>
                  {pendingInvoices.map(({ invoice, pending }) => (
                    <SelectItem key={invoice.id} value={invoice.id}>
                      {invoice.reference} — {formatAmount(pending, currency)} pending
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {values.invoiceId === "none" ? (
                <p className="text-xs text-muted-foreground">
                  The amount is recorded as customer credit/advance — it won't reduce any invoice until you apply it.
                </p>
              ) : overpayment > 0 ? (
                <p className="text-xs font-medium text-forest-700">
                  {formatAmount(overpayment, currency)} more than pending — the invoice will be marked Paid and the rest
                  becomes customer credit.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">Amount *</Label>
              <Input
                id="pay-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="e.g. 2000"
                {...register("amount")}
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount ? <p className="text-xs text-destructive">{errors.amount.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-date">Payment date *</Label>
              <Input id="pay-date" type="date" {...register("date")} aria-invalid={Boolean(errors.date)} />
              {errors.date ? <p className="text-xs text-destructive">{errors.date.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pay-method">Method</Label>
              <Select value={values.method} onValueChange={(v) => setValue("method", v as PaymentMethod)}>
                <SelectTrigger id="pay-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-reference">Reference (optional)</Label>
              <Input id="pay-reference" placeholder="UPI / NEFT / receipt no." {...register("reference")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-notes">Notes (optional)</Label>
            <Textarea id="pay-notes" rows={2} placeholder="e.g. Balance for bridal package" {...register("notes")} />
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Record Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
