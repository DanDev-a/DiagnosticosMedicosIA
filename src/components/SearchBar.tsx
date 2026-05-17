import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, X, Stethoscope, Syringe } from 'lucide-react'
import { supabase } from '../lib/supabase'

export interface Diagnosis {
  clave: string
  descripcion: string
  tipo: 'diagnostico' | 'procedimiento'
}

interface SearchBarProps {
  onSelectDiagnosis: (diagnosis: Diagnosis) => void
}

type SearchTab = 'diagnosticos' | 'procedimientos' | 'todos'

export default function SearchBar({ onSelectDiagnosis }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Diagnosis[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [tab, setTab] = useState<SearchTab>('diagnosticos')
  
  // Evita búsquedas en la base de datos cuando acabamos de seleccionar un ítem
  const isSelecting = useRef(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const searchAll = async () => {
      if (isSelecting.current) {
        isSelecting.current = false
        return
      }

      if (!supabase || query.length < 2) {
        setResults([])
        setIsOpen(false)
        return
      }

      setIsLoading(true)
      try {
        const filter = `clave.ilike.%${query}%,descripcion.ilike.%${query}%`
        let allResults: Diagnosis[] = []

        if (tab === 'diagnosticos' || tab === 'todos') {
          const { data, error } = await supabase
            .from('diagnosticos_cie10')
            .select('clave, descripcion')
            .or(filter)
            .limit(tab === 'todos' ? 8 : 12)

          if (!error && data) {
            allResults.push(...data.map(d => ({ ...d, tipo: 'diagnostico' as const })))
          }
        }

        if (tab === 'procedimientos' || tab === 'todos') {
          const { data, error } = await supabase
            .from('procedimientos_cie10')
            .select('clave, descripcion')
            .or(filter)
            .limit(tab === 'todos' ? 8 : 12)

          if (!error && data) {
            allResults.push(...data.map(d => ({ ...d, tipo: 'procedimiento' as const })))
          }
        }

        allResults.sort((a, b) => a.clave.localeCompare(b.clave))
        setResults(allResults.slice(0, 15))
        setIsOpen(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Error searching:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    if (!supabase) {
      setResults([])
      setIsOpen(false)
      return
    }

    const debounce = setTimeout(searchAll, 300)
    return () => clearTimeout(debounce)
  }, [query, tab])

  const handleSelect = (item: Diagnosis) => {
    isSelecting.current = true // Activamos la bandera
    setQuery(`${item.clave} - ${item.descripcion}`)
    setIsOpen(false)
    onSelectDiagnosis(item)
  }

  const clearQuery = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    inputRef.current?.focus()
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

  const tabs: { key: SearchTab; label: string; icon: typeof Stethoscope }[] = [
    { key: 'diagnosticos', label: 'Diagnósticos', icon: Stethoscope },
    { key: 'procedimientos', label: 'Procedimientos', icon: Syringe },
    { key: 'todos', label: 'Todos', icon: Search },
  ]

  return (
    <div className="relative">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
        Explorador Manual CIE-10
      </label>

      <div className="flex gap-4 mb-6 border-b border-slate-100">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Buscar por código o descripción..."
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={clearQuery}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 overflow-y-auto"
        >
          {results.map((item, index) => (
            <button
              key={`${item.tipo}-${item.clave}`}
              type="button"
              onClick={() => handleSelect(item)}
              className={`w-full text-left px-4 py-3 transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 border-l-2 border-blue-500'
                  : 'hover:bg-gray-50'
              } ${index !== results.length - 1 ? 'border-b border-gray-100' : ''}`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                  item.tipo === 'procedimiento'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  {item.clave}
                </span>
                <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">
                  {item.descripcion}
                </span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                  item.tipo === 'procedimiento'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {item.tipo === 'procedimiento' ? 'Proc.' : 'Diag.'}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-6 text-center">
          <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No se encontraron resultados</p>
          <p className="text-xs text-gray-400 mt-1">Intenta con otros términos</p>
        </div>
      )}

      {!supabase && (
        <p className="mt-1 text-xs text-amber-600">
          Base de datos no configurada. Revisa las variables de entorno.
        </p>
      )}
    </div>
  )
}