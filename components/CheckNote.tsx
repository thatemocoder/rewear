import { Icon } from "./Icon";

/** Shows what Rewear's own check (not the AI) found in an AI answer, e.g. unknown item IDs. */
export function CheckNote({ warnings, retried }: { warnings?: string[]; retried?: boolean }) {
  if (!warnings?.length && !retried) return null;
  return (
    <p className="flex items-start gap-2 rounded-lg border border-hairline bg-card px-3 py-2 text-sm" role="status">
      <Icon name="shield" className="mt-0.5 size-4 text-graphite" />
      <span>
        <span className="font-semibold">Rewear checked this answer.</span>{" "}
        {warnings?.length
          ? `${warnings.join(" ")} Those items are marked “Not in your wardrobe”.`
          : "The AI first used an item that isn’t in your wardrobe, so Rewear asked it again. This is the corrected answer."}
      </span>
    </p>
  );
}
