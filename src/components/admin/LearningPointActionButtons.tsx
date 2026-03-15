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
      {pending ? "生成中..." : label}
    </button>
  );
}

export function GenerateDraftButton({
  action,
  learningPointId,
}: {
  action: (formData: FormData) => Promise<void>;
  learningPointId: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="learningPointId" value={learningPointId} />
      <SubmitButton
        label="LLMで問題草案生成"
        className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
      />
    </form>
  );
}