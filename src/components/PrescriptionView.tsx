import { useState, useRef } from 'react'
import { FileText, Loader2, Copy, Check, Sparkles, Printer, User, Calendar, Hash, Eye, Stethoscope, Syringe } from 'lucide-react'
import { callGroqAPI, SYSTEM_PROMPT_PRESCRIPTION } from '../lib/groq'

interface Diagnosis {
  clave: string
  descripcion: string
  tipo: 'diagnostico' | 'procedimiento'
}

interface PatientInfo {
  name: string
  age: string
  gender: string
  date: string
}

interface PrescriptionViewProps {
  selectedDiagnosis: Diagnosis | null
}

export default function PrescriptionView({ selectedDiagnosis }: PrescriptionViewProps) {
  const [prescription, setPrescription] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [patient, setPatient] = useState<PatientInfo>({
    name: '',
    age: '',
    gender: '',
    date: new Date().toISOString().split('T')[0]
  })

  const printRef = useRef<HTMLDivElement>(null)

  const generatePrescription = async () => {
    if (!selectedDiagnosis) return

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

  return (
    <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden transition-all">
      <div className="bg-white border-b border-slate-100 px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Receta Médica</h2>
          </div>
          <div className="flex items-center gap-2">
            {prescription && !isGenerating && (
              <>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                  title="Imprimir"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="hidden sm:inline">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="hidden sm:inline">Copiar</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {!selectedDiagnosis ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-500 font-semibold mb-1 text-lg">Ningún elemento seleccionado</p>
            <p className="text-sm text-slate-400">
              Usa el analizador de síntomas o la búsqueda CIE-10
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    {selectedDiagnosis.tipo === 'procedimiento' ? (
                      <Syringe className="w-4 h-4 text-purple-600" />
                    ) : (
                      <Stethoscope className="w-4 h-4 text-blue-600" />
                    )}
                    <span className={selectedDiagnosis.tipo === 'procedimiento' ? 'text-purple-600' : 'text-blue-600'}>
                      {selectedDiagnosis.tipo === 'procedimiento' ? 'Procedimiento Seleccionado' : 'Diagnóstico Seleccionado'}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-mono text-base font-bold px-2 py-0.5 rounded ${
                      selectedDiagnosis.tipo === 'procedimiento'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedDiagnosis.clave}
                    </span>
                    <span className={`text-xs ${
                      selectedDiagnosis.tipo === 'procedimiento' ? 'text-purple-500' : 'text-blue-500'
                    }`}>
                      CIE-10
                    </span>
                  </div>
                  <p className="text-base text-slate-800 mt-2">
                    {selectedDiagnosis.descripcion}
                  </p>
                </div>
                <button
                  onClick={generatePrescription}
                  disabled={isGenerating}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition-all text-sm font-bold shadow-lg active:scale-95 flex-shrink-0"
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

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">
                Datos del Paciente <span className="text-slate-400 font-normal normal-case">(opcional)</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1 font-medium">
                    <User className="w-3 h-3 inline mr-1" />
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={patient.name}
                    onChange={(e) => setPatient(p => ({ ...p, name: e.target.value }))}
                    placeholder="Nombre del paciente"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1 font-medium">
                    <Hash className="w-3 h-3 inline mr-1" />
                    Edad
                  </label>
                  <input
                    type="number"
                    value={patient.age}
                    onChange={(e) => setPatient(p => ({ ...p, age: e.target.value }))}
                    placeholder="Edad en años"
                    min="0"
                    max="150"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1 font-medium">Sexo</label>
                  <select
                    value={patient.gender}
                    onChange={(e) => setPatient(p => ({ ...p, gender: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1 font-medium">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={patient.date}
                    onChange={(e) => setPatient(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {isGenerating && (
              <div className="text-center py-8 bg-gray-50 border border-gray-200 rounded-lg">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Generando receta médica...</p>
                <p className="text-sm text-gray-400 mt-1">La IA está preparando la prescripción</p>
                <div className="mt-4 flex justify-center gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {prescription && !isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Vista previa</span>
                  </div>
                  {prescription && !prescription.startsWith('Error') && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      Generado por IA
                    </span>
                  )}
                </div>
                <div
                  ref={printRef}
                  className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-inner"
                >
                  <pre className="whitespace-pre-wrap font-mono text-xs sm:text-sm text-gray-800 leading-relaxed">
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
