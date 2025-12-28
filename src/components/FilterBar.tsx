import { FILTER_OPTIONS, FilterOption } from '@/types/alert';

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  activeCount: number;
}

export function FilterBar({ activeFilter, onFilterChange, activeCount }: FilterBarProps) {
  return (
    <div className="bg-card/95 backdrop-blur-md border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Counter */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            {activeCount} {activeCount === 1 ? 'alerta ativo' : 'alertas ativos'}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-primary rounded-full" />
          <span>Ativo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-alert-expired rounded-full" />
          <span>Expirado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 bg-success rounded-full" />
          <span>Resolvido</span>
        </div>
      </div>
    </div>
  );
}
