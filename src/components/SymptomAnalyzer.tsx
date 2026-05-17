import { useState, useRef, useEffect } from 'react'
import { Activity, Loader2, Brain, Check, AlertCircle, Shield, ListTree, Info } from 'lucide-react'
import { callGroqAPI } from '../lib/groq'
import { supabase } from '../lib/supabase'
import type { Diagnosis } from './SearchBar'

interface DiagnosisSuggestion {
  clave: string
  descripcion: string
  probabilidad: number
  explicacion: string
  tipo: 'diagnostico' | 'procedimiento'
  certeza: 'Alta' | 'Media' | 'Baja'
  diferenciales: string[]
  nota_informativa: string
}

interface SymptomAnalyzerProps {
  onSelectDiagnosis: (diagnosis: Diagnosis) => void
}

const SYSTEM_PROMPT = `Actúas como un Especialista Sénior en Codificación Clínica y Diagnóstico Diferencial con 20+ años de experiencia.

Tu misión es convertir descripciones de salud en códigos CIE-10 exactos siguiendo estas reglas:

1. INTERPRETACIÓN: Identifica si la entrada es de un médico (técnico) o paciente (coloquial). Traduce lenguaje coloquial a términos médicos precisos.

2. JERARQUÍA: Asigna el código más específico posible (3, 4 o 5 caracteres). Prefiere el código más específico sobre el genérico.

3. VALIDACIÓN: Aplica criterio clínico y reglas de inclusión/exclusión CIE-10.

4. Responde ÚNICAMENTE con un array JSON válido. Mínimo 3 diagnósticos, máximo 8.
   Cada objeto del array debe tener esta estructura EXACTA:

{
  "clave": "A90",
  "descripcion": "Dengue [nombre oficial CIE-10]",
  "probabilidad": 95,
  "explicacion": "Cuadro clásico: fiebre alta + cefalea retroocular + mialgias + artralgias + exantema",
  "certeza": "Alta",
  "diferenciales": ["A91 - Fiebre del dengue hemorrágico", "A92 - Otras fiebres virales por mosquitos"],
  "nota_informativa": "Explicación breve en lenguaje sencillo pero con rigor médico"
}

REGLAS PARA CADA CAMPO:
- "clave": Código CIE-10 exacto (ej: A90, A01.0, J10.1, R50.9)
- "descripcion": Nombre oficial del diagnóstico
- "probabilidad": Número entero del 1 al 100, CADA UNO DIFERENTE
- "explicacion": Correlación clínica breve de por qué este diagnóstico explica los síntomas
- "certeza": "Alta" (90-100%), "Media" (50-89%), "Baja" (1-49%) según qué tan específicos sean los síntomas
- "diferenciales": Array de 2-3 strings con código y nombre de diagnósticos que podrían confundirse
- "nota_informativa": Explicación en lenguaje claro para un paciente, pero con rigor profesional

CRÍTICO: Sin texto antes ni después del JSON. Solo el array.`

export default function SymptomAnalyzer({ onSelectDiagnosis }: SymptomAnalyzerProps) {
  const [symptoms, setSymptoms] = useState('')
  const [suggestions, setSuggestions] = useState<DiagnosisSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [step, setStep] = useState<'idle' | 'analyzing' | 'searching' | 'done' | 'error'>('idle')

  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (suggestions.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [suggestions])

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return

    setIsAnalyzing(true)
    setSuggestions([])
    setSelectedIndex(null)
    setStep('analyzing')

    try {
      setStep('analyzing')

      const response = await callGroqAPI([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Paciente: ${symptoms}\n\nDiagnóstico Diferencial CIE-10:` }
      ], undefined, { max_tokens: 4096, temperature: 0.1 })

      const rawText = response.choices[0]?.message?.content || ''

      let jsonStr = rawText.trim()
      const start = jsonStr.indexOf('[')
      const end = jsonStr.lastIndexOf(']')
      if (start !== -1 && end !== -1) jsonStr = jsonStr.substring(start, end + 1)

      jsonStr = jsonStr.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}')
      const parsed: any[] = JSON.parse(jsonStr)

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Respuesta IA inválida')
      }

      const codes = parsed.map((d: any) => d.clave).filter(Boolean)

      setStep('searching')

      const codeSet = [...new Set(codes as string[])]
      let foundMap = new Map<string, string>()

      if (supabase && codeSet.length > 0) {
        const { data: diagData } = await supabase
          .from('diagnosticos_cie10')
          .select('clave, descripcion')
          .in('clave', codeSet)

        const { data: procData } = await supabase
          .from('procedimientos_cie10')
          .select('clave, descripcion')
          .in('clave', codeSet)

        if (diagData) diagData.forEach(d => foundMap.set(d.clave, d.descripcion))
        if (procData) procData.forEach(d => foundMap.set(d.clave, d.descripcion))
      }

      const procCodes = new Set<string>()
      if (supabase && codeSet.length > 0) {
        const { data: procCheck } = await supabase
          .from('procedimientos_cie10')
          .select('clave')
          .in('clave', codeSet)
        if (procCheck) procCheck.forEach(d => procCodes.add(d.clave))
      }

      const finalResults: DiagnosisSuggestion[] = parsed
        .filter((d: any) => d.clave && d.descripcion)
        .map((d: any, idx: number) => ({
          clave: d.clave,
          descripcion: foundMap.get(d.clave) || d.descripcion,
          probabilidad: Math.min(100, Math.max(1, Number(d.probabilidad) || (95 - idx * 9))),
          explicacion: d.explicacion || 'Diagnóstico sugerido por IA',
          tipo: procCodes.has(d.clave) ? 'procedimiento' as const : 'diagnostico' as const,
          certeza: ['Alta', 'Media', 'Baja'].includes(d.certeza) ? d.certeza as 'Alta' | 'Media' | 'Baja' :
            d.probabilidad >= 80 ? 'Alta' : d.probabilidad >= 50 ? 'Media' : 'Baja',
          diferenciales: Array.isArray(d.diferenciales) ? d.diferenciales.slice(0, 3) : [],
          nota_informativa: d.nota_informativa || ''
        }))
        .sort((a: DiagnosisSuggestion, b: DiagnosisSuggestion) => b.probabilidad - a.probabilidad)
        .slice(0, 8)

      if (finalResults.length === 0) throw new Error('No se pudieron generar diagnósticos')

      setSuggestions(finalResults)
      setStep('done')
    } catch (error: any) {
      setSuggestions([{
        clave: 'ERROR',
        descripcion: `Error: ${error.message}`,
        probabilidad: 0,
        explicacion: '',
        tipo: 'diagnostico',
        certeza: 'Baja',
        diferenciales: [],
        nota_informativa: 'Revisa la consola del navegador (F12) para más detalles.'
      }])
      setStep('error')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSelect = (suggestion: DiagnosisSuggestion, index: number) => {
    setSelectedIndex(index)
    onSelectDiagnosis({
      clave: suggestion.clave,
      descripcion: suggestion.descripcion,
      tipo: suggestion.tipo
    })
  }

  const getCertezaBadge = (certeza: string) => {
    switch (certeza) {
      case 'Alta': return 'bg-green-100 text-green-800 border-green-300'
      case 'Media': return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'Baja': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getProbColor = (prob: number) => {
    if (prob >= 80) return 'from-green-500 to-green-600'
    if (prob >= 60) return 'from-emerald-500 to-emerald-600'
    if (prob >= 40) return 'from-yellow-500 to-yellow-600'
    if (prob >= 20) return 'from-orange-500 to-orange-600'
    return 'from-red-500 to-red-600'
  }

  const stepMessages: Record<string, string> = {
    analyzing: 'IA analizando síntomas con diagnóstico diferencial...',
    searching: 'Verificando códigos en BD CIE-10...',
    done: 'Análisis completado',
    error: 'Error en el análisis'
  }

  return (
    <div className="space-y-12">
      <div>
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-[#191C1C]">
            ¿Qué síntomas presenta el paciente?
          </h2>
          <p className="text-slate-500 text-sm font-medium">Asistente clínico inteligente con codificación CIE-10</p>
        </div>

        <div className="group relative bg-white border border-slate-200 rounded-2xl p-2 shadow-sm transition-all focus-within:shadow-md focus-within:border-slate-300">
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Describa el cuadro clínico aquí..."
            rows={2}
            className="w-full px-4 py-3 bg-transparent outline-none resize-none text-lg md:text-xl placeholder:text-slate-300 transition-all font-medium"
          />
          <div className="flex items-center justify-end px-3 py-2">
            <button
              onClick={analyzeSymptoms}
              disabled={isAnalyzing || !symptoms.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#202124] text-white rounded-full hover:bg-black disabled:opacity-20 transition-all font-bold text-sm"
            >
              {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              <span>{isAnalyzing ? 'Analizando' : 'Analizar'}</span>
            </button>
          </div>
        </div>
      </div>

      {isAnalyzing && (
        <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm flex items-center gap-5">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <div className="flex-1">
            <p className="text-base font-semibold text-blue-900">Procesando...</p>
            <p className="text-xs text-blue-700">{stepMessages[step]}</p>
          </div>
        </div>
      )}

      {suggestions.length > 0 && !isAnalyzing && (
        <div ref={resultsRef} className="space-y-5">
          {suggestions[0]?.clave === 'ERROR' || suggestions[0]?.clave === 'CONFIG' ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <p className="text-base font-bold text-red-900">Error</p>
                  <p className="text-sm text-red-700 mt-1">{suggestions[0].descripcion}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-slate-700 tracking-tight">
                  Fuentes y Probabilidades
                </h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                  {suggestions.length} resultados
                </span>
              </div>

              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={`${suggestion.clave}-${index}`}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                      selectedIndex === index
                        ? 'border-blue-500 ring-4 ring-blue-500/5 shadow-md'
                        : 'border-slate-200/60 hover:border-blue-300'
                    }`}
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                              suggestion.tipo === 'procedimiento'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-600'
                            }`}>
                              {suggestion.clave}
                            </span>
                            <span className="text-xs text-slate-400">CIE-10</span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getCertezaBadge(suggestion.certeza)}`}>{suggestion.certeza}
                            </span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                              {suggestion.probabilidad}%
                            </span>
                          </div>
                          <p className="text-base text-slate-800 font-bold mt-2">
                            {suggestion.descripcion}
                          </p>
                          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                            {suggestion.explicacion}
                          </p>

                          {suggestion.diferenciales.length > 0 && (
                            <div className="mt-3 flex items-start gap-2">
                              <ListTree className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                              <div className="flex flex-wrap gap-2">
                                {suggestion.diferenciales.map((diff, i) => (
                                  <span key={i} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                                    {diff}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {suggestion.nota_informativa && (
                            <div className="mt-3 flex items-start gap-2">
                              <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                              <p className="text-xs text-slate-500 italic">
                                {suggestion.nota_informativa}
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleSelect(suggestion, index)}
                          className={`shrink-0 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                            selectedIndex === index
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200'
                          }`}
                        >
                          {selectedIndex === index ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-4 h-4" />
                              <span className="hidden sm:inline">Seleccionado</span>
                            </span>
                          ) : (
                            'Seleccionar'
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="h-1 w-full bg-slate-100">
                      <div
                        className={`h-full rounded-r bg-linear-to-r ${getProbColor(suggestion.probabilidad)} transition-all duration-500`}
                        style={{ width: `${suggestion.probabilidad}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mt-4">
                <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Aviso importante:</strong> Esta herramienta es de apoyo administrativo y educativo basado en CIE-10.
                  No reemplaza el juicio clínico de un profesional de la salud debidamente capacitado.
                  Todo diagnóstico debe ser confirmado por un médico colegiado mediante evaluación presencial.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
