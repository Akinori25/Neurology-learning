"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "削除中..." : "削除"}
    </button>
  );
}

export function DeleteLearningPointButton({
  action,
  learningPointId,
}: {
  action: (formData: FormData) => Promise<void>;
  learningPointId: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const ok = confirm(
          "この論点を削除しますか？この操作は元に戻せません。"
        );
        if (!ok) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="learningPointId" value={learningPointId} />
      <SubmitButton />
    </form>
  );
}