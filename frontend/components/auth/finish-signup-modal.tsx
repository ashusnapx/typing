'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { z } from 'zod';
import { fatherNameSchema, phoneSchema } from '@/lib/schemas';
import { IdentityFields, type IdentityValues } from './identity-fields';
import { LogoSpinner } from '@/components/ui/loading-logo';

/** The email and password were already typed on the sign-in form, so this asks
 *  only for what is left. */
const finishSignupSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long'),
  father_name: fatherNameSchema,
  phone: phoneSchema,
});

/**
 * Shown when someone signs in with an email that has no account.
 *
 * Supabase answers a failed sign-in with one message whether the password was
 * wrong or the account never existed, so the screen used to dead-end on "Wrong
 * email or password" — which is exactly the wrong thing to tell someone who
 * simply had not signed up yet. The sign-in form now checks which of the two
 * it was, and when there is no account it offers to finish the job here rather
 * than sending the candidate off to retype an email and password they have
 * already entered.
 *
 * Dismissible, unlike the profile-completion modal: this one interrupts a
 * sign-in attempt that may simply have been a typo in the email, and trapping
 * someone in a sign-up they did not ask for would be worse than the dead end
 * it replaces.
 */
export function FinishSignupModal({
  email,
  submitting,
  onSubmit,
  onClose,
}: {
  email: string;
  submitting: boolean;
  onSubmit: (values: IdentityValues) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm<IdentityValues>({
    resolver: zodResolver(finishSignupSchema),
    defaultValues: { full_name: '', father_name: '', phone: '' },
  });

  useEffect(() => {
    setFocus('full_name');
  }, [setFocus]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), a[href]'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, submitting]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-vast/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="finish-signup-title"
      aria-describedby="finish-signup-desc"
    >
      <div ref={panelRef} className="card relative my-auto w-full max-w-md p-6 sm:p-7">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close and go back to sign in"
          className="btn btn-outline btn-sm absolute right-4 top-4 w-9 px-0"
        >
          <X className="h-4 w-4" strokeWidth={2.5} />
        </button>

        <p className="eyebrow">No account yet</p>
        <h2 id="finish-signup-title" className="mt-3 pr-12 text-3xl">
          Let&rsquo;s <em>create one</em>
        </h2>
        <p id="finish-signup-desc" className="mt-3 text-base text-vast/60">
          Nothing is registered to{' '}
          <strong className="font-semibold text-vast">{email}</strong>. Your
          email and password are already in — we just need these three.
        </p>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-7 space-y-6"
          noValidate
        >
          <IdentityFields
            register={register}
            errors={errors}
            disabled={submitting}
            idPrefix="fs"
          />

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-lg w-full"
          >
            {submitting ? (
              <LogoSpinner text="Creating your account…" />
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="btn btn-ghost btn-sm mt-4 w-full"
        >
          Wrong email? Go back
        </button>
      </div>
    </div>
  );
}
