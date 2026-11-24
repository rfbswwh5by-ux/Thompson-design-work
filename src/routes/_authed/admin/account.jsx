import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, LogOut, Mail, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Field, inputClass } from "@/components/admin/FormKit";
import { PageHeading } from "@/components/admin/ui";
import { useAuth } from "@/lib/AuthContext";

export const Route = createFileRoute("/_authed/admin/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "Account & security — Thompson’s Design Work" }] }),
});

function AccountPage() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [state, setState] = useState({ status: "idle", message: "" });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const changePassword = async (e) => {
    e.preventDefault();
    if (form.next.length < 8) {
      setState({ status: "error", message: "Use at least 8 characters for the new password." });
      return;
    }
    if (form.next !== form.confirm) {
      setState({ status: "error", message: "The new passwords do not match." });
      return;
    }
    setState({ status: "saving", message: "" });
    try {
      await base44.auth.changePassword({
        userId: user.id,
        currentPassword: form.current,
        newPassword: form.next,
      });
      setForm({ current: "", next: "", confirm: "" });
      setState({ status: "saved", message: "Password updated." });
    } catch {
      setState({
        status: "error",
        message: "The current password was not accepted, so nothing was changed.",
      });
    }
  };

  const sendReset = async () => {
    setState({ status: "sending", message: "" });
    try {
      await base44.auth.resetPasswordRequest(user.email);
    } finally {
      setState({ status: "saved", message: `If ${user.email} is registered, a reset link is on its way.` });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeading title="Account & security" description="Your administrator sign-in, password and session." />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-sm border border-border bg-white">
          <h2 className="border-b border-border px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
            Signed in as
          </h2>
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
                <ShieldCheck className="h-4 w-4 text-brand" />
              </span>
              <div>
                <p className="text-[13px] font-medium">{user?.full_name || "Administrator"}</p>
                <p className="text-[11.5px] text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <p className="rounded-sm bg-secondary/60 px-3 py-2 text-[11.5px] text-muted-foreground">
              Role: <span className="font-medium text-foreground">{user?.role}</span>. Only administrators can open
              customer records — this is enforced by the database, not just the interface.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={sendReset}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-2 text-[11.5px] font-medium"
              >
                <Mail className="h-3.5 w-3.5" /> Email me a reset link
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 rounded-sm border border-border px-3 py-2 text-[11.5px] font-medium"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-sm border border-border bg-white">
          <h2 className="border-b border-border px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
            Change password
          </h2>
          <form onSubmit={changePassword} className="space-y-3 p-4">
            <Field label="Current password">
              <input type="password" className={inputClass} value={form.current} onChange={set("current")} autoComplete="current-password" />
            </Field>
            <Field label="New password" hint="At least 8 characters">
              <input type="password" className={inputClass} value={form.next} onChange={set("next")} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password">
              <input type="password" className={inputClass} value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
            </Field>
            {state.status === "saved" && (
              <p className="inline-flex items-center gap-1.5 text-[11.5px] text-emerald-600">
                <Check className="h-3.5 w-3.5" /> {state.message}
              </p>
            )}
            {state.status === "error" && <p className="text-[11.5px] text-destructive">{state.message}</p>}
            <button
              type="submit"
              disabled={state.status === "saving"}
              className="rounded-sm bg-obsidian px-4 py-2.5 text-[12px] font-medium text-white disabled:opacity-60"
            >
              {state.status === "saving" ? "Saving…" : "Save password"}
            </button>
          </form>
        </section>
      </div>

      <section className="rounded-sm border border-border bg-white p-4">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">Additional administrators</p>
        <p className="mt-2 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
          The platform already supports multiple administrators. Invite a teammate from the app’s App Users page and give
          them the admin role — every screen and permission in this dashboard then applies to them, and removing the role
          removes their access. No code changes are needed to add or remove administrators.
        </p>
      </section>
    </div>
  );
}