import { useEffect, useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useAuth } from "@/context/AuthContext";
import { useDbAction, useSnapshot } from "@/hooks/useData";
import { buildWhatsAppLink, renderTemplate, templateVars } from "@/lib/whatsapp";
import { copyToClipboard } from "@/lib/clipboard";
import { formatAmount } from "@/lib/format";
import { computeCustomerStats, invoicePendingAmount } from "@/services/selectors";
import * as db from "@/services/db";
import type { Customer, FollowUp, Invoice } from "@/types";

interface MessageComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  /** Context used to prefill {{amount}}/{{date}}/{{time}} variables. */
  followUp?: FollowUp | null;
  invoice?: Invoice | null;
}

/**
 * WhatsApp-first workflow: pick a template, tweak the message, and open
 * wa.me with it pre-filled. No WhatsApp Business API is used — activity is
 * logged locally so an official API can replace this flow later.
 */
export function MessageComposerModal({ open, onOpenChange, customer, followUp, invoice }: MessageComposerModalProps) {
  const { business } = useAuth();
  const snapshot = useSnapshot();
  const currency = business?.currency ?? "INR";
  const [templateId, setTemplateId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const templates = snapshot.templates;

  // Default to the payment template when there is money pending, else follow-up.
  const defaultTemplate = useMemo(() => {
    if (templates.length === 0) return null;
    const paymentPending =
      (invoice && invoicePendingAmount(snapshot, invoice) > 0) || followUp?.reason === "payment";
    if (paymentPending) return templates.find((t) => t.category === "payment") ?? templates[0];
    if (followUp?.reason === "appointment") return templates.find((t) => t.category === "appointment") ?? templates[0];
    return templates.find((t) => t.category === "follow-up") ?? templates[0];
  }, [templates, snapshot, invoice, followUp]);

  useEffect(() => {
    if (open && defaultTemplate) {
      setTemplateId(defaultTemplate.id);
    }
  }, [open, defaultTemplate]);

  // {{amount}} must always be the CURRENT pending amount — never the original
  // invoice amount. It comes from the same selectors every other screen uses.
  const rendered = useMemo(() => {
    const template = templates.find((t) => t.id === templateId) ?? defaultTemplate;
    if (!template) return "";
    const stats = computeCustomerStats(snapshot, customer.id);
    const invoicePending = invoice ? invoicePendingAmount(snapshot, invoice) : null;
    const amount =
      invoicePending != null
        ? invoicePending > 0
          ? invoicePending
          : stats.pending
        : followUp?.reason === "payment"
          ? stats.pending
          : undefined;
    return renderTemplate(template.body, {
      ...templateVars(customer, business?.name ?? "us", { followUp, invoice: invoice ?? null, amount }),
      amountLabel: amount != null && amount > 0 ? formatAmount(amount, currency) : undefined,
    });
  }, [templates, templateId, defaultTemplate, customer, business, followUp, invoice, snapshot, currency]);

  useEffect(() => {
    if (open) setMessage(rendered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templateId, rendered]);

  const logWhatsApp = useDbAction(
    (businessId: string, customerId: string) => db.logContactActivity(businessId, customerId, "whatsapp"),
    { successMessage: null },
  );

  const handleSend = () => {
    window.open(buildWhatsAppLink(customer.phone, message), "_blank", "noopener,noreferrer");
    void logWhatsApp(customer.id);
    onOpenChange(false);
  };

  // Copies the exact current message text (edits included). Never opens
  // WhatsApp and never touches the saved template.
  const handleCopy = async () => {
    const ok = await copyToClipboard(message);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error("Couldn't copy automatically — select the message text and copy manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Message {customer.name.split(" ")[0]}</DialogTitle>
          <DialogDescription>
            Opens WhatsApp with your message pre-filled. Nothing is sent until you press send there.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="msg-template">Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="msg-template">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="msg-body">Message</Label>
            <Textarea id="msg-body" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => void handleCopy()}>
            {copied ? <Check className="mr-2 h-4 w-4 text-forest-600" aria-hidden="true" /> : <Copy className="mr-2 h-4 w-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSend} className="bg-forest-600 hover:bg-forest-700">
              <WhatsAppIcon className="mr-2 h-4 w-4" />
              Open WhatsApp
            </Button>
          </div>
        </DialogFooter>

        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          Templates can be customized in Settings → WhatsApp Templates.
        </p>
      </DialogContent>
    </Dialog>
  );
}
