import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        {icon}
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
          {description}
        </p>
      )}
    </div>
  )
}
