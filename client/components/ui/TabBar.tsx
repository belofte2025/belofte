import React from 'react'

interface Tab<T extends string> {
  value: T
  label: string
  count?: number
  countVariant?: 'red' | 'blue' | 'green' | 'amber'
}

interface TabBarProps<T extends string> {
  tabs: Tab<T>[]
  active: T
  onChange: (v: T) => void
}

const COUNT_COLORS = {
  red:   'bg-red-500 text-white',
  blue:  'bg-blue-500 text-white',
  green: 'bg-emerald-500 text-white',
  amber: 'bg-amber-500 text-white',
}

export function TabBar<T extends string>({ tabs, active, onChange }: TabBarProps<T>) {
  return (
    <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-100 p-1">
      {tabs.map(tab => (
        <button
          key={tab.value}
          type="button"
          aria-pressed={active === tab.value}
          onClick={() => onChange(tab.value)}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ${
            active === tab.value
              ? 'bg-white text-blue-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {tab.label}
          {tab.count != null && tab.count > 0 && (
            <span className={`text-xs px-1.5 py-0.5 font-semibold ${
              COUNT_COLORS[tab.countVariant ?? 'blue']
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
