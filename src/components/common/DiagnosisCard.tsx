import { Check, FileText } from 'lucide-react'
import BadgeRow from './BadgeRow'
import ProbabilityBar from './ProbabilityBar'
import DifferentialTags from './DifferentialTags'
import type { DiagnosisSuggestion } from '../../hooks/useSymptomAnalysis'

interface DiagnosisCardProps {
  suggestion: DiagnosisSuggestion
  isSelected: boolean
  onGeneratePrescription: (suggestion: DiagnosisSuggestion) => void
}

export default function DiagnosisCard({ suggestion, isSelected, onGeneratePrescription }: DiagnosisCardProps) {
  return (
    <div
      className={`rounded-xl border transition-all bg-white ${
        isSelected
          ? 'border-gray-900 bg-gray-50 shadow-sm ring-1 ring-gray-900/10'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
      }`}
    >
      <div className="p-3.5">
        {/* Badges row */}
        <div className="mb-2">
          <BadgeRow
            code={suggestion.clave}
            type={suggestion.tipo}
            certainty={suggestion.certeza}
            probability={suggestion.probabilidad}
            size="sm"
          />
        </div>

        {/* Description */}
        <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">
          {suggestion.descripcion}
        </p>
        <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-2">
          {suggestion.explicacion}
        </p>

        {/* Differential tags */}
        <DifferentialTags tags={suggestion.diferenciales} max={2} size="sm" />

        {/* Probability bar */}
        <div className="mt-2.5">
          <ProbabilityBar probability={suggestion.probabilidad} size="sm" />
        </div>

        {/* Selected indicator + Generate button */}
        <div className="mt-3 flex items-center gap-2">
          {isSelected ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-900">
              <Check className="w-3 h-3" />
              Seleccionado
            </span>
          ) : (
            <button
              onClick={() => onGeneratePrescription(suggestion)}
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all text-[11px] font-semibold shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              Generar Receta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
