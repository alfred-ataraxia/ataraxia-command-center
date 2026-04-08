export default function TaskSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-4 rounded-xl border border-ax-border bg-ax-panel animate-pulse"
        >
          <div className="w-4 h-4 bg-ax-muted rounded shrink-0" />
          <div className="flex-1 w-full space-y-2">
            <div className="flex gap-2">
              <div className="h-3 w-16 bg-ax-muted rounded" />
              <div className="h-5 w-40 bg-ax-muted rounded" />
            </div>
            <div className="h-3 w-32 bg-ax-muted rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-ax-muted rounded-md" />
              <div className="h-6 w-24 bg-ax-muted rounded-md" />
            </div>
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0">
            <div className="h-6 w-16 bg-ax-muted rounded-full" />
            <div className="h-4 w-12 bg-ax-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
