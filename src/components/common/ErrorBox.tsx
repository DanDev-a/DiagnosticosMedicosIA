import { AlertCircle } from 'lucide-react'

interface ErrorBoxProps {
  title?: string
  message: string
  hint?: string
}

export default function ErrorBox({ title = 'Error', message, hint }: ErrorBoxProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-red-900">{title}</p>
          <p className="text-xs text-red-700 mt-1">{message}</p>
          {hint && <p className="text-[11px] text-red-500 mt-1">{hint}</p>}
        </div>
      </div>
    </div>
  )
}
