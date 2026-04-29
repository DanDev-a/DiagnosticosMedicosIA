import { useState } from 'react'
import { Activity, Loader2, Brain, ChevronDown, ChevronUp, Check, Database } from 'lucide-react'
import { callGroqAPI } from '../lib/groq'
import { supabase } from '../lib/supabase'
import type { Diagnosis } from './SearchBar'

interface DiagnosisSuggestion {
  clave: string
  descripcion: string
  probabilidad: number
  explicacion: string
}

interface SymptomAnalyzerProps {
  onSelectDiagnosis: (diagnosis: Diagnosis) => void
}

export default function SymptomAnalyzer({ onSelectDiagnosis }: SymptomAnalyzerProps) {
  const [symptoms, setSymptoms] = useState('')
  const [suggestions, setSuggestions] = useState<DiagnosisSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [message, setMessage] = useState('')

  const analyzeSymptoms = async () => {
    if (!symptoms.trim()) return

    setIsAnalyzing(true)
    setSuggestions([])
    setSelectedIndex(null)
    setMessage('')

    try {
      console.log('=== ANÁLISIS INICIADO ===')
      console.log('Síntomas:', symptoms)

      // PASO 1: IA interpreta síntomas y sugiere términos de búsqueda
      const termsResponse = await callGroqAPI([
        {
          role: 'system',
          content: `Eres un médico experto en CIE-10.
Dados los síntomas, extrae 5-8 términos médicos clave en español.
Responde SOLO con los términos separados por comas, en minúsculas.
Ejemplo: "gonorrea, uretritis, secreción, disuria, infección"`
        },
        {
          role: 'user',
          content: `Síntomas: ${symptoms}

Extrae términos médicos clave:`
        }
      ])

      const termsText = termsResponse.choices[0]?.message?.content || ''
      console.log('Términos IA:', termsText)

      const terms = termsText
        .split(/[,\n]/)
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 3)
        .slice(0, 10)

      if (terms.length === 0) {
        throw new Error('La IA no pudo interpretar los síntomas')
      }

      console.log('Términos a buscar:', terms)
      setMessage(`Términos IA: ${terms.join(', ')}`)

      // PASO 2: Buscar en base de datos usando los términos
      const orConditions = terms
        .map(term => `descripcion.ilike.%${term}%`)
        .join(',')

      console.log('Búsqueda:', orConditions)

      const { data: dbResults, error } = await supabase
        .from('diagnosticos_cie10')
        .select('clave, descripcion')
        .or(orConditions)
        .limit(30)

      if (error) {
        throw new Error(`Error BD: ${error.message}`)
      }

      console.log('Encontrados en BD:', dbResults?.length || 0)
      setMessage(prev => `${prev} | BD: ${dbResults?.length || 0} resultados`)

      if (!dbResults || dbResults.length === 0) {
        setSuggestions([{
          clave: 'NO_RESULTS',
          descripcion: 'No se encontraron diagnósticos relacionados',
          probabilidad: 0,
          explicacion: `Términos buscados: ${terms.join(', ')}`
        }])
        setIsExpanded(true)
        setIsAnalyzing(false)
        return
      }

      // PASO 3: IA analiza resultados y asigna probabilidades ÚNICAS
      const diagnosesList = dbResults
        .map(d => `${d.clave}: ${d.descripcion}`)
        .join('\n')

      const analysisResponse = await callGroqAPI([
        {
          role: 'system',
          content: `Eres un médico colegiado.
Asigna a CADA diagnóstico un porcentaje único (1-100).
CADA probabilidad debe ser DIFERENTE.
Usa valores variados: 95, 87, 73, 52, 28...

Responde SOLO con JSON:
[
  {"clave": "A540", "descripcion": "Gonorrea", "probabilidad": 95, "explicacion": "Coincide por secreción"},
  {"clave": "N341", "descripcion": "Uretritis", "probabilidad": 78, "explicacion": "Síntomas de uretra"}
]`
        },
        {
          role: 'user',
          content: `SÍNTOMAS: ${symptoms}

DIAGNÓSTICOS ENCONTRADOS (${dbResults.length}):
${diagnosesList}

Asigna probabilidades ÚNICAS a cada uno en JSON:`
        }
      ])

      const responseText = analysisResponse.choices[0]?.message?.content || ''
      console.log('Respuesta IA:', responseText)

      try {
        const responseText = analysisResponse.choices[0]?.message?.content || ''
        console.log('Respuesta IA:', responseText)

        // Extraer y limpiar el JSON de forma robusta
        let jsonString = responseText.trim()
        
        // Buscar el primer '[' y el último ']'
        const startIndex = jsonString.indexOf('[')
        const endIndex = jsonString.lastIndexOf(']')
        
        if (startIndex === -1 || endIndex === -1) {
          throw new Error('No se encontró JSON en la respuesta')
        }
        
        jsonString = jsonString.substring(startIndex, endIndex + 1)
        console.log('JSON extraído:', jsonString)
        
        // Limpiar problemas comunes de formato JSON
        jsonString = jsonString
          .replace(/,\s*]/g, ']') // Eliminar comas antes de ]
          .replace(/,\s*}/g, '}') // Eliminar comas antes de }
          .replace(/'/g, '"') // Cambiar comillas simples por dobles
          .replace(/($$\w+$$)/g, '"$1"') // Poner comillas en nombres de propiedades
        
        console.log('JSON limpio:', jsonString)
        
        const parsed = JSON.parse(jsonString) as DiagnosisSuggestion[]
        
        // Validar que las claves existan en la BD
        const validatedResults = parsed
          .filter(d => dbResults.some(db => db.clave === d.clave))
          .map((d, idx) => ({
            ...d,
            probabilidad: Math.min(100, Math.max(1, Number(d.probabilidad) || (99 - idx * 7)))
          }))
          .sort((a, b) => b.probabilidad - a.probabilidad)

        console.log('Resultados finales:', validatedResults)
        setSuggestions(validatedResults.length > 0 ? validatedResults : parsed)
        setIsExpanded(true)
      } catch (parseError) {
        console.error('Error parseando:', parseError)
        console.log('Texto completo IA:', responseText)
        
        // Intentar extraer información útil del texto
        const codeMatches = responseText.match(/[A-Z]\d{2,4}[A-Z]?/g) || []
        
        if (codeMatches.length > 0) {
          // Crear sugerencias basadas en el texto
          const fallbackSuggestions = codeMatches.slice(0, 5).map((code, idx) => ({
            clave: code,
            descripcion: `Diagnóstico ${code}`,
            probabilidad: 95 - idx * 10,
            explicacion: 'Extraído de la respuesta de la IA'
          }))
          setSuggestions(fallbackSuggestions)
          setIsExpanded(true)
        } else {
          setSuggestions([{
            clave: 'ERROR',
            descripcion: 'Error al procesar la respuesta de la IA',
            probabilidad: 0,
            explicacion: responseText.substring(0, 500)
          }])
          setIsExpanded(true)
        }
      }

    } catch (error: any) {
      console.error('Error general:', error)
      setSuggestions([{
        clave: 'ERROR',
        descripcion: `Error: ${error?.message || 'Error desconocido'}`,
        probabilidad: 0,
        explicacion: 'Verifica la consola del navegador (F12).'
      }])
      setIsExpanded(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSelect = (suggestion: DiagnosisSuggestion, index: number) => {
    setSelectedIndex(index)
    onSelectDiagnosis({
      clave: suggestion.clave,
      descripcion: suggestion.descripcion
    })
  }

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'bg-green-100 text-green-800 border-green-300'
    if (prob >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-red-100 text-red-800 border-red-300'
  }

  const getProbabilityLabel = (prob: number) => {
    return prob > 0 ? `${prob}%` : ''
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Analizador de Síntomas (IA Médica + CIE-10)
        </label>
        <div className="relative">
          <Activity className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <textarea
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Ejemplo: Paciente masculino, 25 años. Secreción uretral amarillenta, disuria leve, sin fiebre."
            rows={4}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
          />
        </div>
        <button
          onClick={analyzeSymptoms}
          disabled={isAnalyzing || !symptoms.trim()}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analizando síntomas con IA...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              Analizar con IA Médica
            </>
          )}
        </button>
      </div>

      {message && (
        <div className="text-xs text-gray-500 flex items-start gap-1 bg-gray-50 p-2 rounded">
          <Database className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 border-b border-gray-200 hover:bg-gray-100"
          >
            <span className="font-medium text-gray-900">
              Diagnósticos Sugeridos ({suggestions.length})
            </span>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          {isExpanded && (
            <div className="divide-y divide-gray-100">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 hover:bg-gray-50 ${
                    selectedIndex === index ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-sm font-semibold text-blue-600">
                          {suggestion.clave}
                        </span>
                        {suggestion.probabilidad > 0 && (
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${getProbabilityColor(suggestion.probabilidad)}`}>
                            {getProbabilityLabel(suggestion.probabilidad)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 font-medium">
                        {suggestion.descripcion}
                      </p>
                    </div>
                    {suggestion.clave !== 'ERROR' && suggestion.clave !== 'NO_RESULTS' && (
                      <button
                        onClick={() => handleSelect(suggestion, index)}
                        className={`ml-3 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          selectedIndex === index
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {selectedIndex === index ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Seleccionado
                          </span>
                        ) : (
                          'Seleccionar'
                        )}
                      </button>
                    )}
                  </div>
                  {suggestion.explicacion && suggestion.clave !== 'ERROR' && (
                    <p className="text-xs text-gray-500 mt-1">
                      {suggestion.explicacion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
