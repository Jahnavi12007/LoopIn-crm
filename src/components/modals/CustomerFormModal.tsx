import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuth } from "@/context/AuthContext";
import { useDbAction, useSnapshot } from "@/hooks/useData";
import { isValidPhone } from "@/lib/format";
import * as db from "@/services/db";
import { CUSTOMER_TAG_LABELS, FREE_CUSTOMER_LIMIT } from "@/types";
import type { Customer, CustomerTag, CustomerType } from "@/types";
import { cn } from "@/lib/utils";

const ALL_TAGS: CustomerTag[] = ["new", "vip", "regular", "follow-up", "payment-due", "completed"];

const customerSchema = z.object({
  name: z.string().trim().min(2, "Please enter the customer's name."),
  phone: z
    .string()
    .trim()
    .refine((v) => isValidPhone(v), "Enter a valid phone number (with country code if possible)."),
  email: z.string().trim().email("Enter a valid email or leave it empty.").optional().or(z.literal("")),
  type: z.enum(["lead", "customer", "repeat"]),
  notes: z.string().optional(),
  firstInvoiceAmount: z.string().optional(),
  firstInvoiceDueDate: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the modal edits this customer instead of creating a new one. */
  customer?: Customer | null;
  onSaved?: (customer: Customer) => void;
}

export function CustomerFormModal({ open, onOpenChange, customer, onSaved }: CustomerFormModalProps) {
  const isEdit = Boolean(customer);
  const { business } = useAuth();
  const snapshot = useSnapshot();
  const [tags, setTags] = useState<CustomerTag[]>(customer?.tags ?? ["new"]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? "",
      phone: customer?.phone ?? "",
      email: customer?.email ?? "",
      type: customer?.type ?? "customer",
      notes: customer?.notes ?? "",
      firstInvoiceAmount: "",
      firstInvoiceDueDate: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: customer?.name ?? "",
        phone: customer?.phone ?? "",
        email: customer?.email ?? "",
        type: customer?.type ?? "customer",
        notes: customer?.notes ?? "",
        firstInvoiceAmount: "",
        firstInvoiceDueDate: "",
      });
      setTags(customer?.tags ?? ["new"]);
    }
  }, [open, customer, reset]);

  const activeCount = useMemo(() => snapshot.customers.filter((c) => !c.archived).length, [snapshot.customers]);
  const willHitLimit = !isEdit && business?.plan === "free" && activeCount >= FREE_CUSTOMER_LIMIT;
  const typeValue = watch("type");

  const addCustomer = useDbAction(db.addCustomer, { successMessage: "Customer added" });
  const updateCustomerAction = useDbAction(
    (businessId: string, updated: Customer) => db.updateCustomer(businessId, updated),
    { successMessage: "Customer updated" },
  );

  const onSubmit = handleSubmit(async (values) => {
    if (!business) return;
    try {
      let saved: Customer;
      if (isEdit && customer) {
        saved = { ...customer, ...values, email: values.email || undefined, notes: values.notes || undefined, tags };
        await updateCustomerAction(saved);
      } else {
        const amount = values.firstInvoiceAmount ? Number(values.firstInvoiceAmount) : undefined;
        saved = await addCustomer({
          name: values.name,
          phone: values.phone,
          email: values.email || undefined,
          type: values.type,
          notes: values.notes || undefined,
          tags,
          firstInvoiceAmount: amount && amount > 0 ? amount : undefined,
          firstInvoiceDueDate: values.firstInvoiceDueDate || undefined,
        });
        if (!saved) throw new Error("We couldn't save that customer right now. Please try again.");
      }
      onSaved?.(saved);
      onOpenChange(false);
    } catch {
      // errors surfaced via toast; form values preserved
    }
  });

  const toggleTag = (tag: CustomerTag) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">        <DialogHeader>
          <DialogTitle className="font-display">{isEdit ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this customer's details." : "Only a name and phone number are required."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="customer-name">Name *</Label>
            <Input
              id="customer-name"
              placeholder="e.g. Ravi Kumar"
              autoComplete="off"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="customer-phone">WhatsApp / Phone *</Label>
              <Input
                id="customer-phone"
                type="tel"
                inputMode="tel"
                placeholder="98765 43210"
                {...register("phone")}
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? <p className="text-xs text-destructive">{errors.phone.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customer-type">Customer type</Label>
              <Select value={typeValue} onValueChange={(v) => setValue("type", v as CustomerType)}>
                <SelectTrigger id="customer-type" aria-label="Customer type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead (not bought yet)</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="repeat">Repeat customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="customer-email">Email (optional)</Label>
            <Input id="customer-email" type="email" placeholder="name@example.com" {...register("email")} />
            {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_TAGS.map((tag) => (
                <label
                  key={tag}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    tags.includes(tag)
                      ? "border-forest-600 bg-forest-600 text-white"
                      : "border-border bg-card text-muted-foreground hover:border-forest-300",
                  )}
                >
                  <Checkbox
                    checked={tags.includes(tag)}
                    onCheckedChange={() => toggleTag(tag)}
                    className="sr-only"
                    aria-label={CUSTOMER_TAG_LABELS[tag]}
                  />
                  {CUSTOMER_TAG_LABELS[tag]}
                </label>
              ))}
            </div>
          </div>

          {!isEdit ? (
            <div className="grid gap-4 rounded-xl bg-cream-50 p-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="invoice-amount">Total amount (optional)</Label>
                <Input
                  id="invoice-amount"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="e.g. 4500"
                  {...register("firstInvoiceAmount")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invoice-due">Payment due date</Label>
                <Input id="invoice-due" type="date" {...register("firstInvoiceDueDate")} />
              </div>
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Adding an amount creates their first pending payment you can track and remind about.
              </p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="customer-notes">Notes (optional)</Label>
            <Textarea id="customer-notes" rows={2} placeholder="Preferences, history, anything useful…" {...register("notes")} />
          </div>

          {willHitLimit ? (
            <p className="rounded-lg bg-gold-50 px-3 py-2 text-xs font-medium text-gold-800">
              You've reached the Free plan limit of {FREE_CUSTOMER_LIMIT} customers. Upgrade to Pro in Settings to add more.
            </p>
          ) : null}

          <DialogFooter className="gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || willHitLimit}>
              {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
