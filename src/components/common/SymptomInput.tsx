import { Send, Loader2 } from 'lucide-react'

interface SymptomInputProps {
  symptoms: string
  setSymptoms: (s: string) => void
  isAnalyzing: boolean
  onAnalyze: () => Promise<void>
}

export default function SymptomInput({ symptoms, setSymptoms, isAnalyzing, onAnalyze }: SymptomInputProps) {
  return (
    <div className="border-t border-gray-100 bg-white">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-3 sm:py-4">
        <div className="relative">
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describí el cuadro clínico..."
            rows={2}
            className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none text-xs sm:text-sm placeholder:text-gray-400 transition-all focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-gray-100 pr-28"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!isAnalyzing && symptoms.trim()) onAnalyze()
              }
            }}
          />
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || !symptoms.trim()}
            className="absolute right-1.5 sm:right-2 bottom-2 sm:bottom-2.5 flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-30 transition-all text-[11px] sm:text-xs font-semibold shadow-sm"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{isAnalyzing ? 'Analizando...' : 'Analizar'}</span>
          </button>
        </div>
        <p className="text-[9px] sm:text-[10px] text-gray-400 mt-2 text-center">
          Apoyo administrativo CIE-10 ES 2026 — Siempre verificar con un profesional de la salud
        </p>
      </div>
    </div>
  )
}
