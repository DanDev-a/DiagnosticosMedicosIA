import { useState } from 'react'
import { FileText, Loader2, Copy, Check, Sparkles } from 'lucide-react'
import { callGroqAPI, SYSTEM_PROMPT_PRESCRIPTION } from '../lib/groq'

interface Diagnosis {
  clave: string
  descripcion: string
}

interface PrescriptionViewProps {
  selectedDiagnosis: Diagnosis | null
}

export default function PrescriptionView({ selectedDiagnosis }: PrescriptionViewProps) {
  const [prescription, setPrescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const generatePrescription = async () => {
    if (!selectedDiagnosis) return

    setIsGenerating(true)
    setPrescription('')

    try {
      const data = await callGroqAPI([
        { role: 'system', content: SYSTEM_PROMPT_PRESCRIPTION },
        {
          role: 'user',
          content: `Genera una receta médica profesional para el siguiente diagnóstico CIE-10:
           
Código: ${selectedDiagnosis.clave}
Descripción: ${selectedDiagnosis.descripcion}

Proporciona una receta estructurada y profesional.`
        }
      ])

      const generatedText = data.choices[0]?.message?.content || ''
      setPrescription(generatedText)
    } catch (error: any) {
      console.error('Error generating prescription:', error)
      setPrescription(`Error al generar la receta: ${error?.message || 'Error desconocido'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prescription)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Receta Médica</h2>
          </div>
          {prescription && (
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {!selectedDiagnosis ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Selecciona un diagnóstico para comenzar</p>
            <p className="text-sm text-gray-400">
              Busca y selecciona un diagnóstico CIE-10 en el panel izquierdo
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">Diagnóstico Seleccionado</p>
                  <p className="text-sm font-mono font-semibold text-gray-900">
                    {selectedDiagnosis.clave}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    {selectedDiagnosis.descripcion}
                  </p>
                </div>
                <button
                  onClick={generatePrescription}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generar Receta
                    </>
                  )}
                </button>
              </div>
            </div>

            {isGenerating && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Generando receta médica...</p>
              </div>
            )}

            {prescription && !isGenerating && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-inner">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
                    {prescription}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
