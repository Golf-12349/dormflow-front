"use client";

import { useEffect, useActionState, useRef, useState } from "react";
import { CheckCircle2, Loader2, LogOut, MoreVertical, User } from "lucide-react";

import { checkOutTenantAction } from "@/lib/actions/tenants";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { CheckOutTenantFormState, Tenant } from "@/types";

const INITIAL_CHECK_OUT_STATE: CheckOutTenantFormState = {
  status: "idle",
  message: null,
};

/** Must match the popup's `w-60` (240px) — used to right-align it to the kebab. */
const MENU_WIDTH_PX = 240;

/**
 * 6.6 — per-row overflow (kebab) menu: "View profile" opens the 6.3 drawer;
 * "Check out" (active tenants with a room only) flips the menu into its own
 * confirmation + form, so a row can be checked out without opening the drawer
 * — never a bare destructive button.
 *
 * Plain React/Tailwind dropdown (no new dependencies). Closes on outside
 * pointer-down and on Escape (focus returns to the trigger). Clicks inside
 * are stopped before they reach the keyboard-activatable row underneath, so
 * using the menu never opens the drawer by accident.
 */
export function TenantRowMenu({
  tenant,
  onOpen,
}: {
  tenant: Tenant;
  /** Opens the 6.3 drawer; the kebab button is the focus-restore target. */
  onOpen: (tenantId: string, trigger: HTMLElement) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  /**
   * Viewport coordinates for the popup, sampled from the trigger's rect when
   * it opens (event handlers may read the DOM; render may not). The menu
   * renders `fixed` because its row lives inside `overflow-hidden`/
   * `overflow-x-auto` table wrappers — an `absolute` popup would be clipped
   * for the bottom rows.
   */
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [state, formAction, isPending] = useActionState(
    checkOutTenantAction,
    INITIAL_CHECK_OUT_STATE,
  );

  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  /** Close on outside pointer-down; Escape closes and re-focuses the trigger. */
  useEffect(() => {
    if (!isOpen) return;

    function close() {
      setIsOpen(false);
      setConfirming(false);
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      close();
      triggerRef.current?.focus();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    // The popup is viewport-anchored from a rect sampled at open time, so it
    // closes on scroll/resize instead of drifting away from its row.
    window.addEventListener("scroll", close, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  /** Only active tenants occupying a room can be checked out (6.5 rule). */
  const canCheckOut = tenant.status === "active" && tenant.roomId !== null;

  function toggleMenu() {
    const next = !isOpen;
    setIsOpen(next);
    // A stale confirmation/result from the previous open must not flash.
    if (next) {
      setConfirming(false);
      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setAnchor({
          top: rect.bottom + 4,
          left: Math.max(8, rect.right - MENU_WIDTH_PX),
        });
      }
    }
  }

  function viewProfile() {
    setIsOpen(false);
    setConfirming(false);
    if (triggerRef.current) onOpen(tenant.id, triggerRef.current);
  }

  return (
    <div
      ref={rootRef}
      className="relative inline-block text-left"
      // Menu interactions must not reach the row's click-to-open handler.
      onClick={(event) => event.stopPropagation()}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t.tenants.rowMenu.triggerLabel(tenant.fullName)}
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreVertical className="size-4" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label={t.tenants.rowMenu.triggerLabel(tenant.fullName)}
          style={{ top: anchor?.top, left: anchor?.left }}
          className="fixed z-50 w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {confirming ? (
            <form action={formAction} className="space-y-2.5 p-2.5">
              <input type="hidden" name="tenantId" value={tenant.id} />

              <p className="text-xs text-slate-600">
                {t.tenants.checkOut.confirmPrompt(tenant.fullName)}
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  {t.tenants.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? (
                    <>
                      <Loader2
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                      <span>{t.tenants.checkOut.saving}</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="size-3.5" aria-hidden="true" />
                      <span>{t.tenants.checkOut.confirm}</span>
                    </>
                  )}
                </button>
              </div>

              {state.status !== "idle" && state.message ? (
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "rounded-lg border p-2 text-xs",
                    state.status === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-700",
                  )}
                >
                  {state.status === "success" ? (
                    <CheckCircle2
                      className="size-3.5 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : null}
                  <p>{state.message}</p>
                </div>
              ) : null}
            </form>
          ) : (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={viewProfile}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <User className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                {t.tenants.rowMenu.viewProfile}
              </button>

              {canCheckOut ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => setConfirming(true)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-700 transition hover:bg-rose-50"
                >
                  <LogOut className="size-4 shrink-0" aria-hidden="true" />
                  {t.tenants.checkOut.trigger}
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}