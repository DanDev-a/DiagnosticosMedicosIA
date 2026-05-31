import { useState, useRef, useEffect } from 'react'
import { Search, Loader2, X, Stethoscope, Syringe } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Diagnosis } from '../types'
import { useNavigate } from 'react-router-dom'

type SearchTab = 'diagnosticos' | 'procedimientos' | 'todos'

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Diagnosis[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [tab, setTab] = useState<SearchTab>('diagnosticos')

  const isSelecting = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

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
    isSelecting.current = true
    setQuery(`${item.clave} - ${item.descripcion}`)
    setIsOpen(false)
    navigate('/', { state: { selectedDiagnosis: item } })
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
    <div className="flex-1 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-2xl px-6 py-12 md:py-20">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-gray-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900">
            Explorador Manual CIE-10
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            Busca diagnósticos y procedimientos por código o descripción
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg transition-all ${
                tab === t.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            placeholder="Buscar por código o descripción..."
            className="w-full pl-11 pr-11 py-3.5 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <X className="w-4.5 h-4.5" />
              )}
            </button>
          )}
        </div>

        {/* Results */}
        {isOpen && results.length > 0 && (
          <div
            ref={dropdownRef}
            className="mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {results.map((item, index) => (
                <button
                  key={`${item.tipo}-${item.clave}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className={`w-full text-left px-4 py-3.5 transition-colors ${
                    index === selectedIndex
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                      item.tipo === 'procedimiento'
                        ? 'bg-purple-50 text-purple-700'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      {item.clave}
                    </span>
                    <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">
                      {item.descripcion}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 text-gray-400 bg-gray-100">
                      {item.tipo === 'procedimiento' ? 'Proc.' : 'Diag.'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
          <div className="mt-2 bg-white border border-gray-200 rounded-xl shadow-xl p-10 text-center">
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium">No se encontraron resultados</p>
            <p className="text-xs text-gray-400 mt-1">Intentá con otros términos</p>
          </div>
        )}

        {!supabase && (
          <p className="mt-3 text-xs text-amber-600 text-center">
            Base de datos no configurada. Revisá las variables de entorno.
          </p>
        )}

        {/* Help text */}
        {query.length < 2 && results.length === 0 && (
          <div className="mt-12 text-center">
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-mono font-bold text-gray-700 mb-1">A90</p>
                <p className="text-[11px] text-gray-500">Dengue</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-mono font-bold text-gray-700 mb-1">J10.1</p>
                <p className="text-[11px] text-gray-500">Influenza con otras manifestaciones</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-mono font-bold text-gray-700 mb-1">R50.9</p>
                <p className="text-[11px] text-gray-500">Fiebre no especificada</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-mono font-bold text-gray-700 mb-1">I10</p>
                <p className="text-[11px] text-gray-500">Hipertensión esencial</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-6">Escribí al menos 2 caracteres para empezar</p>
          </div>
        )}
      </div>
    </div>
  )
}
