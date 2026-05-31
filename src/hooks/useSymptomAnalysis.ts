import { useState, useRef, useEffect } from 'react'
import { callGroqAPI, SYSTEM_PROMPT_DIFFERENTIAL } from '../lib/groq'
import { supabase } from '../lib/supabase'
import type { Diagnosis } from '../types'

export interface DiagnosisSuggestion {
  clave: string
  descripcion: string
  probabilidad: number
  explicacion: string
  tipo: 'diagnostico' | 'procedimiento'
  certeza: 'Alta' | 'Media' | 'Baja'
  diferenciales: string[]
  nota_informativa: string
}

export function useSymptomAnalysis(onSelectDiagnosis: (d: Diagnosis) => void) {
  const [symptoms, setSymptoms] = useState('')
  const [suggestions, setSuggestions] = useState<DiagnosisSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [step, setStep] = useState<'idle' | 'analyzing' | 'searching' | 'done' | 'error'>('idle')

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setIsAnalyzing(true)
    setSuggestions([])
    setStep('analyzing')

    try {
      setStep('analyzing')

      const response = await callGroqAPI([
        { role: 'system', content: SYSTEM_PROMPT_DIFFERENTIAL },
        { role: 'user', content: `Paciente: ${symptoms}\n\nDiagnóstico Diferencial CIE-10:` }
      ], undefined, { max_tokens: 4096, temperature: 0.1, signal: controller.signal })

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
      const procCodes = new Set<string>()

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
        if (procData) {
          procData.forEach(d => {
            foundMap.set(d.clave, d.descripcion)
            procCodes.add(d.clave)
          })
        }
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

  const handleSelect = (suggestion: DiagnosisSuggestion) => {
    onSelectDiagnosis({
      clave: suggestion.clave,
      descripcion: suggestion.descripcion,
      tipo: suggestion.tipo
    })
  }

  return {
    symptoms,
    setSymptoms,
    suggestions,
    isAnalyzing,
    step,
    analyzeSymptoms,
    handleSelect,
  }
}

/* ── Funciones puras helpers ── */
export function getCertezaBadge(certeza: string) {
  switch (certeza) {
    case 'Alta': return 'bg-green-100 text-green-800 border-green-300'
    case 'Media': return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'Baja': return 'bg-red-100 text-red-800 border-red-300'
    default: return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

export function getProbColor(prob: number) {
  if (prob >= 80) return 'from-green-500 to-green-600'
  if (prob >= 60) return 'from-emerald-500 to-emerald-600'
  if (prob >= 40) return 'from-yellow-500 to-yellow-600'
  if (prob >= 20) return 'from-orange-500 to-orange-600'
  return 'from-red-500 to-red-600'
}

export const stepMessages: Record<string, string> = {
  analyzing: 'IA analizando síntomas con diagnóstico diferencial...',
  searching: 'Verificando códigos en BD CIE-10...',
  done: 'Análisis completado',
  error: 'Error en el análisis'
}
