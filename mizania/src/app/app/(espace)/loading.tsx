export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement">
      <div className="h-8 w-48 animate-pulse rounded bg-line" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-line/60" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-line/60" />
    </div>
  );
}
