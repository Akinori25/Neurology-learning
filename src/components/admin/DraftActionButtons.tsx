"use client";

import { useFormStatus } from "react-dom";

function SubmitButton({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${className} disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {pending ? "処理中..." : label}
    </button>
  );
}

export function ActionButton({
  action,
  id,
  label,
  className,
  confirmMessage,
  redirectTo,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label: string;
  className: string;
  confirmMessage?: string;
  redirectTo?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirmMessage && !confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <SubmitButton label={label} className={className} />
    </form>
  );
}