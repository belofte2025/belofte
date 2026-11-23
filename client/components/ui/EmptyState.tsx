import React from 'react'

interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card flex flex-col items-center justify-center gap-4 py-14">
      <div className="size-12 rounded-xl bg-blue-50 flex items-center justify-center">
        <Icon className="size-6 text-blue-700" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}
