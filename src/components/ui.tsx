import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

interface ButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
}

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-700 text-white hover:bg-indigo-800',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100',
  success: 'bg-emerald-700 text-white hover:bg-emerald-800',
  danger: 'bg-red-700 text-white hover:bg-red-800',
  ghost: 'text-slate-800 hover:bg-slate-100',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition focus-visible:outline-3 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50',
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
});

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={clsx('rounded-2xl border border-slate-200 bg-white p-5 shadow-sm', className)}>{children}</section>;
}

interface FieldProps extends ComponentPropsWithoutRef<'input'> {
  label: string;
  hint?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, hint, id, className, ...props }, ref) {
  const fieldId = id ?? `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <label htmlFor={fieldId} className="block space-y-1">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      <input
        id={fieldId}
        ref={ref}
        className={clsx(
          'w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-500 focus-visible:outline-3 focus-visible:outline-indigo-500',
          className,
        )}
        {...props}
      />
      {hint ? <span className="text-xs text-slate-600">{hint}</span> : null}
    </label>
  );
});

export function StatePanel({
  kind,
  title,
  description,
  action,
}: {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const palette = {
    loading: 'border-blue-200 bg-blue-50 text-blue-900',
    empty: 'border-slate-200 bg-slate-50 text-slate-900',
    error: 'border-red-200 bg-red-50 text-red-900',
  }[kind];

  return (
    <div className={clsx('rounded-2xl border p-5', palette)} role={kind === 'error' ? 'alert' : 'status'} aria-live="polite">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-1 text-sm">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
