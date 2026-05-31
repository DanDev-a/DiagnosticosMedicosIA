import { Shield } from 'lucide-react'

interface DisclaimerProps {
  compact?: boolean
}

export default function Disclaimer({ compact = false }: DisclaimerProps) {
  if (compact) {
    return (
      <div className="flex items-start gap-2 bg-amber-50/50 rounded-lg p-3 border border-amber-100">
        <Shield className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[9px] text-amber-800 leading-relaxed">
          Apoyo administrativo CIE-10. No reemplaza el juicio clínico.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
      <Shield className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
      <p className="text-[11px] text-amber-800 leading-relaxed">
        <strong>Aviso importante:</strong> Esta herramienta es de apoyo administrativo y educativo basado en CIE-10.
        No reemplaza el juicio clínico de un profesional de la salud debidamente capacitado.
      </p>
    </div>
  )
}
