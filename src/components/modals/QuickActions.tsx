import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { CustomerFormModal } from "@/components/modals/CustomerFormModal";
import { FollowUpFormModal } from "@/components/modals/FollowUpFormModal";
import { PaymentFormModal } from "@/components/modals/PaymentFormModal";
import { MessageComposerModal } from "@/components/modals/MessageComposerModal";
import type { Customer, FollowUp, Invoice } from "@/types";

/**
 * One provider that opens the shared Add Customer / Add Follow-up / Record
 * Payment / WhatsApp modals from anywhere in the app (dashboard, FAB, pages).
 */

interface QuickActionsValue {
  openCustomerForm: (customer?: Customer | null) => void;
  openFollowUpForm: (opts?: { customerId?: string; followUp?: FollowUp | null }) => void;
  openPaymentForm: (opts?: { customerId?: string }) => void;
  openMessageComposer: (opts: { customer: Customer; followUp?: FollowUp | null; invoice?: Invoice | null }) => void;
}

const QuickActionsContext = createContext<QuickActionsValue | null>(null);

export function QuickActionsProvider({ children }: { children: ReactNode }) {
  const [customerModal, setCustomerModal] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null,
  });
  const [followUpModal, setFollowUpModal] = useState<{
    open: boolean;
    customerId?: string;
    followUp: FollowUp | null;
  }>({ open: false, followUp: null });
  const [paymentModal, setPaymentModal] = useState<{ open: boolean; customerId?: string }>({ open: false });
  const [composerModal, setComposerModal] = useState<{
    open: boolean;
    customer: Customer | null;
    followUp: FollowUp | null;
    invoice: Invoice | null;
  }>({ open: false, customer: null, followUp: null, invoice: null });

  const openCustomerForm = useCallback((customer?: Customer | null) => {
    setCustomerModal({ open: true, customer: customer ?? null });
  }, []);

  const openFollowUpForm = useCallback((opts?: { customerId?: string; followUp?: FollowUp | null }) => {
    setFollowUpModal({ open: true, customerId: opts?.customerId, followUp: opts?.followUp ?? null });
  }, []);

  const openPaymentForm = useCallback((opts?: { customerId?: string }) => {
    setPaymentModal({ open: true, customerId: opts?.customerId });
  }, []);

  const openMessageComposer = useCallback(
    (opts: { customer: Customer; followUp?: FollowUp | null; invoice?: Invoice | null }) => {
      setComposerModal({
        open: true,
        customer: opts.customer,
        followUp: opts.followUp ?? null,
        invoice: opts.invoice ?? null,
      });
    },
    [],
  );

  const value = useMemo<QuickActionsValue>(
    () => ({ openCustomerForm, openFollowUpForm, openPaymentForm, openMessageComposer }),
    [openCustomerForm, openFollowUpForm, openPaymentForm, openMessageComposer],
  );

  return (
    <QuickActionsContext.Provider value={value}>
      {children}
      <CustomerFormModal
        open={customerModal.open}
        onOpenChange={(open) => setCustomerModal((s) => ({ ...s, open }))}
        customer={customerModal.customer}
      />
      <FollowUpFormModal
        open={followUpModal.open}
        onOpenChange={(open) => setFollowUpModal((s) => ({ ...s, open }))}
        customerId={followUpModal.customerId}
        followUp={followUpModal.followUp}
      />
      <PaymentFormModal
        open={paymentModal.open}
        onOpenChange={(open) => setPaymentModal((s) => ({ ...s, open }))}
        customerId={paymentModal.customerId}
      />
      {composerModal.customer ? (
        <MessageComposerModal
          open={composerModal.open}
          onOpenChange={(open) => setComposerModal((s) => ({ ...s, open }))}
          customer={composerModal.customer}
          followUp={composerModal.followUp}
          invoice={composerModal.invoice}
        />
      ) : null}
    </QuickActionsContext.Provider>
  );
}

export function useQuickActions(): QuickActionsValue {
  const ctx = useContext(QuickActionsContext);
  if (!ctx) throw new Error("useQuickActions must be used within QuickActionsProvider");
  return ctx;
}
