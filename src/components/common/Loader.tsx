import { Loader2 } from 'lucide-react'

interface LoaderProps {
  title: string
  subtitle?: string
}

export default function Loader({ title, subtitle }: LoaderProps) {
  return (
    <div className="flex items-center gap-4 bg-gray-50 rounded-2xl p-6 border border-gray-100">
      <Loader2 className="w-6 h-6 text-gray-600 animate-spin shrink-0" />
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
