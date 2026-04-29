import { useState, useRef, useEffect } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export interface Diagnosis {
  clave: string
  descripcion: string
}

interface SearchBarProps {
  onSelectDiagnosis: (diagnosis: Diagnosis) => void
}

export default function SearchBar({ onSelectDiagnosis }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Diagnosis[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const searchDiagnoses = async () => {
      if (query.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('diagnosticos_cie10')
          .select('clave, descripcion')
          .or(`clave.ilike.%${query}%,descripcion.ilike.%${query}%`)
          .limit(10)

        if (error) throw error
        setResults(data || [])
        setIsOpen(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Error searching diagnoses:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    const debounce = setTimeout(searchDiagnoses, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSelect = (diagnosis: Diagnosis) => {
    setQuery(`${diagnosis.clave} - ${diagnosis.descripcion}`)
    setIsOpen(false)
    onSelectDiagnosis(diagnosis)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Buscar Diagnóstico CIE-10
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Buscar por clave o descripción..."
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5 animate-spin" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {results.map((diagnosis, index) => (
            <button
              key={diagnosis.clave}
              onClick={() => handleSelect(diagnosis)}
              className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : ''
              } ${index !== results.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-sm font-semibold text-blue-600">
                  {diagnosis.clave}
                </span>
                <span className="text-sm text-gray-700 flex-1">
                  {diagnosis.descripcion}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
          No se encontraron diagnósticos
        </div>
      )}
    </div>
  )
}
