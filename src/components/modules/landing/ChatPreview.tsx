export function ChatPreview() {
  return (
    <div
      aria-hidden="true"
      className="bg-background ambient-shadow-lg border-border-subtle flex aspect-[16/10] overflow-hidden rounded-xl border"
    >
      <aside className="bg-surface-container-low border-border-subtle hidden w-[34%] flex-col border-r p-4 sm:flex">
        <p className="text-on-surface mb-4 text-sm font-semibold tracking-tight">
          Cognito
        </p>
        <ul className="text-on-surface-variant space-y-2.5 text-xs">
          <li className="bg-surface-container text-on-surface rounded-md px-2 py-1.5">
            Brand voice workshop
          </li>
          <li className="px-2 py-1.5">Q3 financial notes</li>
          <li className="px-2 py-1.5">Product roadmap</li>
          <li className="px-2 py-1.5">Tax questions</li>
        </ul>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-border-subtle flex items-center justify-between border-b px-4 py-3">
          <p className="text-on-surface text-sm font-medium">
            Brand voice workshop
          </p>
          <span className="text-on-surface-variant bg-surface-container rounded-md px-2 py-0.5 text-[11px]">
            Claude
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="bg-surface-container text-on-surface ml-auto max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed">
            Compare Claude and Gemini on this brief without leaving the chat.
          </div>
          <div className="text-on-surface border-border-subtle max-w-[90%] rounded-lg border px-3 py-2 text-xs leading-relaxed">
            Claude holds structure. Gemini is faster on a first draft. Stay here
            and switch the picker when you want the other take.
          </div>
        </div>
        <div className="border-border-subtle border-t px-4 py-3">
          <div className="text-on-surface-variant border-border-subtle rounded-lg border px-3 py-2 text-xs">
            Continue the comparison
          </div>
        </div>
      </div>
    </div>
  );
}
