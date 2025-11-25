export function CityDetailViewSkeleton() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
              <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-muted animate-pulse ml-2" />
            </div>
          </div>

          <div className="relative mb-6 h-96 w-full overflow-hidden rounded-xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] bg-muted animate-pulse" />
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6">
            <div className="h-4 w-full rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-5/6 rounded-md bg-muted animate-pulse" />
            <div className="h-4 w-4/6 rounded-md bg-muted animate-pulse" />
          </div>

          <div className="bg-neo-bg-secondary rounded-xl p-6">
            <div className="h-6 w-32 rounded-md bg-muted animate-pulse mb-4" />
            <div className="h-4 w-full rounded-md bg-muted animate-pulse mb-4" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-24 rounded-md bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-6">
            <div className="h-6 w-48 rounded-md bg-muted animate-pulse mb-4" />
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 w-24 rounded-full bg-muted animate-pulse" />
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-6">
            <div className="h-6 w-48 rounded-md bg-muted animate-pulse mb-4" />
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 w-24 rounded-full bg-muted animate-pulse" />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-full bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
