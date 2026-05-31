import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { FileText, Loader2, Copy, Check, Sparkles, Printer, Eye, Stethoscope, Syringe } from 'lucide-react'
import { callGroqAPI, SYSTEM_PROMPT_PRESCRIPTION } from '../lib/groq'
import type { Diagnosis, PatientInfo } from '../types'

interface PrescriptionViewProps {
  selectedDiagnosis: Diagnosis | null
  patient: PatientInfo
}

const PrescriptionView = memo(function PrescriptionView({ selectedDiagnosis, patient }: PrescriptionViewProps) {
  const [prescription, setPrescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const printRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const diagnosisKey = `${selectedDiagnosis?.clave}-${selectedDiagnosis?.tipo}`

  // Cancelar petición al desmontar
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  // Limpiar receta al cambiar de diagnóstico
  useEffect(() => {
    setPrescription('')
    setIsCopied(false)
  }, [diagnosisKey])

  // Generar receta
  const generatePrescription = useCallback(async () => {
    if (!selectedDiagnosis) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsGenerating(true)
    setPrescription('')

    const patientContext = [
      patient.name && `Paciente: ${patient.name}`,
      patient.age && `Edad: ${patient.age} años`,
      patient.gender && `Sexo: ${patient.gender}`,
      patient.date && `Fecha: ${patient.date}`
    ].filter(Boolean).join('\n')

    const isProcedure = selectedDiagnosis.tipo === 'procedimiento'
    const tipoLabel = isProcedure ? 'procedimiento' : 'diagnóstico CIE-10'

    try {
      const data = await callGroqAPI([
        { role: 'system', content: SYSTEM_PROMPT_PRESCRIPTION },
        {
          role: 'user',
          content: `Genera una receta médica profesional para el siguiente ${tipoLabel}:

Código: ${selectedDiagnosis.clave}
Descripción: ${selectedDiagnosis.descripcion}
${patientContext ? `\nDatos del paciente:\n${patientContext}` : ''}

Proporciona una receta estructurada y profesional:

RECETA MÉDICA
Dr. [Nombre del Médico] — Cédula Profesional: [XXXXXX]
Fecha: [fecha actual]

Paciente: [nombre del paciente]

${isProcedure ? 'Procedimiento' : 'Diagnóstico'} ${selectedDiagnosis.clave} - ${selectedDiagnosis.descripcion}

Medicamento(s):
1. [Nombre del medicamento] — [Dosis] — [Frecuencia] — [Duración]
   Instrucciones: [instrucciones detalladas]

2. [Nombre del medicamento] — [Dosis] — [Frecuencia] — [Duración]
   Instrucciones: [instrucciones detalladas]

Recomendaciones:
• [recomendación 1]
• [recomendación 2]
• [recomendación 3]

Advertencias:
• [advertencia 1]
• [advertencia 2]

Próximo control: [fecha sugerida]`
        }
      ], undefined, { signal: controller.signal })

      const generatedText = data.choices[0]?.message?.content || ''
      setPrescription(generatedText)
    } catch (error: any) {
      if (error.name === 'AbortError') return
      console.error('Error generating prescription:', error)
      setPrescription(`Error al generar la receta: ${error?.message || 'Error desconocido'}`)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedDiagnosis, patient])

  // Auto-generar cuando se selecciona un nuevo diagnóstico
  useEffect(() => {
    if (selectedDiagnosis) {
      generatePrescription()
    }
  }, [diagnosisKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const copyToClipboard = async () => {
    try {
      const textToCopy = prescription || `${selectedDiagnosis?.clave} - ${selectedDiagnosis?.descripcion}`
      await navigator.clipboard.writeText(textToCopy)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const content = prescription || `${selectedDiagnosis?.clave} - ${selectedDiagnosis?.descripcion}`
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receta Médica</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 40px; line-height: 1.6; color: #000; }
          pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <pre>${content}</pre>
        <script>window.print();<\/script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (!selectedDiagnosis) return null

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 sm:px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-900 truncate">Receta Médica</h2>
          </div>
          {prescription && !isGenerating && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                title="Imprimir"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    <span className="hidden sm:inline">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="space-y-5">
          {/* Loading state */}
          {isGenerating && (
            <div className="text-center py-6 bg-gray-50 border border-gray-200 rounded-xl">
              <Loader2 className="w-8 h-8 text-gray-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-700 font-medium">Generando receta médica...</p>
              <p className="text-xs text-gray-400 mt-1">La IA está preparando la prescripción</p>
            </div>
          )}

          {/* Result preview */}
          {prescription && !isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-xs font-medium text-gray-600">Vista previa</span>
                </div>
                {!prescription.startsWith('Error') && (
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                    Generado por IA
                  </span>
                )}
              </div>
              <div
                ref={printRef}
                className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-inner"
              >
                <pre className="whitespace-pre-wrap font-mono text-xs text-gray-700 leading-relaxed">
                  {prescription}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default PrescriptionView
