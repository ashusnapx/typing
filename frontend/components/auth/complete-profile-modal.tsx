'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { useAuthStore, missingProfileFields } from '@/store/auth-store';
import { useCompleteProfile } from '@/lib/queries';
import {
  completeProfileSchema,
  type CompleteProfileFormData,
} from '@/lib/schemas';
import { PhoneField } from '@/components/ui/phone-field';
import { LogoSpinner } from '@/components/ui/loading-logo';

/**
 * Collects what an older account never supplied.
 *
 * Phone and father's name were added after people had already signed up, and
 * an account created before that is not broken — it simply predates the
 * question. Rather than block those candidates at a wall or silently carry an
 * incomplete record, they are asked once, on their next visit, and only for
 * the fields actually missing.
 *
 * It has no dismiss control on purpose: the answers are needed to proceed. It
 * is deliberately NOT shown during an exam, because interrupting a timed skill
 * test to ask for a phone number would cost someone their attempt — the exam
 * screen hides the site chrome, and this follows the same rule.
 */
export function CompleteProfileModal() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // The session-derived user carries no father_name or phone — those live only
  // on the profile row. Opening on that would flash this modal at everyone on
  // every refresh, for the second or two before the row arrives.
  const isProfileLoaded = useAuthStore((s) => s.isProfileLoaded);
  const complete = useCompleteProfile();
  const panelRef = useRef<HTMLDivElement>(null);

  const missing = missingProfileFields(user);
  const open = isAuthenticated && isProfileLoaded && !!user && missing.length > 0;

  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors },
  } = useForm<CompleteProfileFormData>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      father_name: user?.father_name ?? '',
      phone: user?.phone ?? '',
    },
  });

  // defaultValues are captured on first render, when the user is usually still
  // loading — so a field that is NOT being asked for would submit an empty
  // hidden value and fail validation for something invisible. Re-seed once the
  // profile lands.
  useEffect(() => {
    if (!user) return;
    reset({
      father_name: user.father_name ?? '',
      phone: user.phone ?? '',
    });
  }, [user?.id, user?.father_name, user?.phone, reset]);

  useEffect(() => {
    if (!open) return;
    // Land on the first thing actually being asked for.
    setFocus(missing[0] === 'phone' ? 'phone' : 'father_name');
  }, [open, missing, setFocus]);

  // A modal that cannot be dismissed must still trap the tab key, or focus
  // walks out into the page behind it.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
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
  }, [open]);

  if (!open) return null;

  const onSubmit = async (data: CompleteProfileFormData) => {
    try {
      await complete.mutateAsync({
        father_name: String(data.father_name).trim(),
        phone: String(data.phone),
      });
      toast.success('Details saved');
    } catch (err: any) {
      toast.error(err?.message || 'Could not save your details. Try again.');
    }
  };

  const needsFather = missing.includes('father_name');
  const needsPhone = missing.includes('phone');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-vast/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-profile-title"
      aria-describedby="complete-profile-desc"
    >
      <div ref={panelRef} className="card my-auto w-full max-w-md p-6 sm:p-7">
        <p className="eyebrow">One more thing</p>
        <h2 id="complete-profile-title" className="mt-3 text-3xl">
          Finish your <em>profile</em>
        </h2>
        <p id="complete-profile-desc" className="mt-3 text-base text-vast/60">
          {needsFather && needsPhone
            ? 'We now ask for these on sign-up, and your account was created before that.'
            : 'One detail is missing from your account.'}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-6" noValidate>
          {/* Only ask for what is actually missing — a filled field re-asked
              reads as though the earlier answer was lost. */}
          {needsFather && (
            <div>
              <label
                htmlFor="cp-father"
                className="mb-1.5 block text-sm font-medium text-vast/70"
              >
                Father&rsquo;s name
              </label>
              <input
                id="cp-father"
                type="text"
                {...register('father_name')}
                className="field-line"
                placeholder="Rajesh Sharma"
                autoComplete="off"
                disabled={complete.isPending}
                aria-invalid={!!errors.father_name}
                aria-describedby={errors.father_name ? 'cp-father-error' : undefined}
              />
              {errors.father_name && (
                <p id="cp-father-error" role="alert" className="mt-2 text-sm text-err">
                  {errors.father_name.message}
                </p>
              )}
            </div>
          )}

          {needsPhone && (
            <PhoneField
              id="cp-phone"
              registration={register('phone')}
              error={errors.phone}
              disabled={complete.isPending}
            />
          )}

          {/* A hidden field still has to carry a valid value, or the schema
              rejects the submit for something the user cannot see. */}
          {!needsFather && (
            <input type="hidden" {...register('father_name')} />
          )}
          {!needsPhone && <input type="hidden" {...register('phone')} />}

          <button
            type="submit"
            disabled={complete.isPending}
            className="btn btn-primary btn-lg w-full"
          >
            {complete.isPending ? <LogoSpinner text="Saving…" /> : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
