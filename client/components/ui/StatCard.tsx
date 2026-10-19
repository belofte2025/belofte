import React from 'react'
import Link from 'next/link'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ElementType
  accent?: string
  iconColor?: string
  href?: string
  valueColor?: string
  className?: string
}

export function StatCard({
  label, value, sub, icon: Icon, accent = 'bg-gray-100',
  iconColor = 'text-gray-500', href, valueColor = 'text-gray-900', className = '',
}: StatCardProps) {
  const inner = (
    <div className={`bg-white rounded-xl shadow-sm ring-1 ring-slate-900/5 p-5 flex flex-col gap-3
      min-w-0 overflow-hidden transition-all duration-200 ${
      href ? 'hover:shadow-md hover:ring-slate-900/10 hover:-translate-y-0.5 cursor-pointer' : ''
    } ${className}`}>
      {Icon && (
        <div className={`w-9 h-9 rounded-lg ${accent} flex items-center justify-center`}>
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} strokeWidth={1.75} />
        </div>
      )}
      <div className="min-w-0">
        {/* Shares the fluid sizing used by .stat-card so a long currency figure
            shrinks to fit instead of spilling out of the card on a phone. */}
        <p className={`stat-value tracking-tight ${valueColor}`}>{value}</p>
        <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      </div>
      {sub && <p className="text-xs text-gray-400 border-t border-gray-100 pt-2.5">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}
