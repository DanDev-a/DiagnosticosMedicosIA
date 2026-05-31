import { useCallback } from 'react'
import { Activity, Loader2, AlertCircle, X } from 'lucide-react'
import DiagnosisCard from './common/DiagnosisCard'
import Disclaimer from './common/Disclaimer'
import { stepMessages } from '../hooks/useSymptomAnalysis'
import type { DiagnosisSuggestion } from '../hooks/useSymptomAnalysis'
import type { Diagnosis } from '../types'

interface RightPanelProps {
  suggestions: DiagnosisSuggestion[]
  isAnalyzing: boolean
  step: string
  selectedDiagnosis: Diagnosis | null
  onSelect: (suggestion: DiagnosisSuggestion) => void
  /** Mobile overlay state */
  isOpen?: boolean
  onClose?: () => void
}

export default function RightPanel({
  suggestions, isAnalyzing, step, selectedDiagnosis, onSelect,
  isOpen = false, onClose
}: RightPanelProps) {
  const hasError = suggestions.length > 0 && suggestions[0]?.clave === 'ERROR'
  const hasContent = suggestions.length > 0 || isAnalyzing

  // Close panel after selecting a diagnosis
  const handleSelect = useCallback((suggestion: DiagnosisSuggestion) => {
    onSelect(suggestion)
    onClose?.()
  }, [onSelect, onClose])

  // ── Panel content ──
  const PanelContent = () => (
    <>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-gray-900">Diagnósticos</h2>
            <p className="text-[11px] text-gray-500">
              {isAnalyzing
                ? 'Analizando...'
                : `${suggestions.length} resultado${suggestions.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>
          {/* Close button (mobile only) */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading — skeleton cards */}
        {isAnalyzing && (
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
              <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
              <div>
                <p className="text-xs font-semibold text-gray-800">Analizando síntomas...</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{stepMessages[step] || step}</p>
              </div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-16 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {hasError && !isAnalyzing && (
          <div className="p-5">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-900">Error en el análisis</p>
                  <p className="text-[11px] text-red-700 mt-0.5">{suggestions[0].descripcion}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Diagnosis Cards */}
        {!isAnalyzing && suggestions.length > 0 && !hasError && (
          <div className="p-3 space-y-2">
            {suggestions.map((suggestion, index) => (
              <DiagnosisCard
                key={`${suggestion.clave}-${index}`}
                suggestion={suggestion}
                isSelected={selectedDiagnosis?.clave === suggestion.clave}
                onGeneratePrescription={handleSelect}
              />
            ))}

            <div className="pt-2 px-1">
              <Disclaimer compact />
            </div>
          </div>
        )}
      </div>
    </>
  )

  // Nothing to show
  if (!hasContent) return null

  return (
    <>
      {/* ── Desktop: permanent sidebar ── */}
      <aside className="hidden lg:flex w-96 border-l border-gray-200 bg-white flex-col h-full shrink-0">
        <PanelContent />
      </aside>

      {/* ── Mobile/Tablet: overlay drawer ── */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          {/* Drawer */}
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
            <PanelContent />
          </div>
        </div>
      )}
    </>
  )
}
