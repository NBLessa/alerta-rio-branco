import { FILTER_OPTIONS, FilterOption } from '@/types/alert';

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  activeCount: number;
}

export function FilterBar({ activeFilter, onFilterChange, activeCount }: FilterBarProps) {
  return (
    <div className="bg-card/95 backdrop-blur-md border-b border-border px-3 sm:px-4 py-2 sm:py-3">
      {/* Mobile: Stack layout / Desktop: Row layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        {/* Filters - Scrollable on mobile */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all touch-manipulation active:scale-95 ${
                activeFilter === filter.id
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Counter - Inline on mobile */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-semibold">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse" />
            {activeCount} {activeCount === 1 ? 'ativo' : 'ativos'}
          </span>
          
          {/* Legend - Mobile inline */}
          <div className="flex items-center gap-2 sm:hidden text-[10px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-primary rounded-full" />
              <span>Ativo</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-success rounded-full" />
              <span>OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend - Desktop only */}
      <div className="hidden sm:flex items-center gap-4 mt-3 text-xs text-muted-foreground">
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
