import { useMemo, useState } from "react";
import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
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
import { useAuth } from "@/context/AuthContext";
import { useDbAction, useSnapshot } from "@/hooks/useData";
import { TEMPLATE_PLACEHOLDERS } from "@/lib/whatsapp";
import * as db from "@/services/db";
import type { MessageTemplate, TemplateCategory } from "@/types";

const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  payment: "Payment Reminder",
  "follow-up": "Follow-up",
  appointment: "Appointment Reminder",
  "thank-you": "Thank You",
  custom: "Custom",
};

export default function Templates() {
  const snapshot = useSnapshot();
  const templates = useMemo(
    () => [...snapshot.templates].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [snapshot.templates],
  );

  const [editing, setEditing] = useState<MessageTemplate | "new" | null>(null);
  const [deleting, setDeleting] = useState<MessageTemplate | null>(null);

  const remove = useDbAction((businessId: string, id: string) => db.deleteTemplate(businessId, id), {
    successMessage: "Template deleted",
  });

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="WhatsApp Templates"
        description="Reusable messages with smart placeholders like {{name}} and {{amount}}."
        actions={
          <Button onClick={() => setEditing("new")}>
            <MessageSquarePlus className="mr-2 h-4 w-4" aria-hidden="true" />
            New Template
          </Button>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={MessageSquarePlus}
          title="No templates yet."
          description="Templates save you typing the same WhatsApp messages again and again."
          action={<Button onClick={() => setEditing("new")}>Create Template</Button>}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{template.name}</h2>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[template.category]}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Edit ${template.name}`} onClick={() => setEditing(template)}>
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${template.name}`}
                    onClick={() => setDeleting(template)}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-cream-50 p-3.5 text-sm leading-relaxed text-foreground/90">
                {template.body}
              </p>
            </div>
          ))}
        </div>
      )}

      <TemplateEditor template={editing} onDone={() => setEditing(null)} />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Delete template?</DialogTitle>
            <DialogDescription>"{deleting?.name}" will be removed. Existing messages are not affected.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (deleting) await remove(deleting.id);
                setDeleting(null);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplateEditor({ template, onDone }: { template: MessageTemplate | "new" | null; onDone: () => void }) {
  const { business } = useAuth();
  const snapshot = useSnapshot();
  const isNew = template === "new";
  const existing = template && template !== "new" ? template : null;

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState<TemplateCategory>(existing?.category ?? "custom");
  const [body, setBody] = useState(existing?.body ?? "");
  const [error, setError] = useState<string | null>(null);

  // Reset fields when a different template opens
  const [lastKey, setLastKey] = useState<string | null>(null);
  const key = existing?.id ?? (isNew ? "new" : null);
  if (key !== lastKey) {
    setLastKey(key);
    setName(existing?.name ?? "");
    setCategory(existing?.category ?? "custom");
    setBody(existing?.body ?? "");
    setError(null);
  }

  const save = useDbAction(db.saveTemplate, { successMessage: isNew ? "Template created" : "Template updated" });

  const handleSave = async () => {
    if (name.trim().length < 3) return setError("Give the template a clear name.");
    if (body.trim().length < 10) return setError("The message body is too short.");
    if (!isNew && snapshot.templates.filter((t) => t.id !== existing?.id).some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) {
      return setError("A template with this name already exists.");
    }
    await save({
      id: existing?.id,
      name: name.trim(),
      category,
      body: body.trim(),
      isDefault: existing?.isDefault ?? false,
    });
    onDone();
  };

  return (
    <Dialog open={template !== null} onOpenChange={(open) => !open && onDone()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{isNew ? "New Template" : "Edit Template"}</DialogTitle>
          <DialogDescription>Use placeholders to personalize each message automatically.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Name</Label>
              <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Festival Offer" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-category">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TemplateCategory)}>
                <SelectTrigger id="tpl-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_LABELS) as TemplateCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-body">Message</Label>
            <Textarea id="tpl-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div className="rounded-xl bg-forest-50/70 p-3.5">
            <p className="text-xs font-semibold text-forest-800">Placeholders</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {TEMPLATE_PLACEHOLDERS.map((p) => (
                <button
                  key={p.token}
                  type="button"
                  title={p.description}
                  onClick={() => setBody((b) => `${b}${p.token}`)}
                  className="rounded-full border border-forest-200 bg-white px-2.5 py-1 font-mono text-[11px] text-forest-700 transition-colors hover:bg-forest-100 focus-ring"
                >
                  {p.token}
                </button>
              ))}
            </div>
          </div>

          {business?.name && body.includes("{{name}}") ? (
            <div className="rounded-xl border border-border bg-cream-50 p-3.5">
              <p className="text-xs font-semibold text-muted-foreground">Preview</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm">
                {body
                  .replaceAll("{{name}}", "Ravi")
                  .replaceAll("{{business}}", business.name)
                  .replaceAll("{{amount}}", "₹4,500")
                  .replaceAll("{{date}}", "Sep 20, 2026")
                  .replaceAll("{{time}}", "10:00 AM")
                  .replaceAll("{{reference}}", "INV-1041")}
              </p>
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()}>Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
