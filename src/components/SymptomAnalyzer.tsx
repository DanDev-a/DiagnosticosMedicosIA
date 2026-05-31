import { Stethoscope } from 'lucide-react'
import EmptyState from './common/EmptyState'
import Loader from './common/Loader'
import ErrorBox from './common/ErrorBox'
import { stepMessages } from '../hooks/useSymptomAnalysis'
import type { DiagnosisSuggestion } from '../hooks/useSymptomAnalysis'

interface SymptomAnalyzerProps {
  suggestions: DiagnosisSuggestion[]
  isAnalyzing: boolean
  step: string
}

export default function SymptomAnalyzer({
  suggestions,
  isAnalyzing,
  step,
}: SymptomAnalyzerProps) {
  const hasError = suggestions.length > 0 && suggestions[0]?.clave === 'ERROR'
  const isIdle = suggestions.length === 0 && !isAnalyzing

  // Still analyzing
  if (isAnalyzing) {
    return (
      <Loader
        title="Analizando síntomas..."
        subtitle={stepMessages[step]}
      />
    )
  }

  // Error
  if (hasError) {
    return (
      <ErrorBox
        message={suggestions[0].descripcion}
        hint="Revisá la consola del navegador (F12) para más detalles."
      />
    )
  }

  // Idle
  if (isIdle) {
    return (
      <EmptyState
        icon={<Stethoscope className="w-8 h-8 text-gray-400" />}
        title="¿Qué síntomas presenta el paciente?"
        description="Describí el cuadro clínico y el asistente analizará posibles diagnósticos CIE-10"
      />
    )
  }

  // Analysis done — results are in RightPanel
  return null
}
