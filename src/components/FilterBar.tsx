import { FILTER_OPTIONS, FilterOption } from '@/types/alert';

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filterId: string) => void;
  activeCount: number;
}

export function FilterBar({ activeFilter, onFilterChange, activeCount }: FilterBarProps) {
  return (
    <div className="bg-card/90 backdrop-blur-xl border-b border-border/40 px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        {/* Filters */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {FILTER_OPTIONS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`
                relative px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium 
                whitespace-nowrap transition-all duration-200 touch-manipulation active:scale-95
                ${activeFilter === filter.id
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Counter + Legend row */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          {/* Active counter badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-semibold border border-primary/15">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            {activeCount} {activeCount === 1 ? 'ativo' : 'ativos'}
          </span>

          {/* Legend - Mobile compact */}
          <div className="flex items-center gap-2.5 sm:hidden text-[10px] text-muted-foreground">
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

      {/* Desktop legend */}
      <div className="hidden sm:flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-primary/20" />
          <span>Ativo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-alert-expired rounded-full ring-2 ring-alert-expired/20" />
          <span>Expirado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-success rounded-full ring-2 ring-success/20" />
          <span>Resolvido</span>
        </div>
      </div>
    </div>
  );
}
