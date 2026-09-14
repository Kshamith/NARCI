export function NewBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block bg-blood px-2 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-bone ${className}`}
    >
      New
    </span>
  );
}
