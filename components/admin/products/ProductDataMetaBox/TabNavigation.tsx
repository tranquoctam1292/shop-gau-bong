'use client';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

/**
 * Tab Navigation - Vertical tabs on desktop, horizontal on mobile
 * Features:
 * - Active tab indicator (border-left on desktop, underline on mobile)
 * - Smooth transitions
 * - Responsive design
 */
export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all
              md:border-l-3 md:border-l-transparent
              border-b-2 md:border-b-0 border-b-transparent
              whitespace-nowrap
              ${
                isActive
                  ? 'md:border-l-primary bg-background text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
              ${isActive ? 'md:border-l-primary border-b-primary' : ''}
            `}
            aria-selected={isActive}
            role="tab"
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
