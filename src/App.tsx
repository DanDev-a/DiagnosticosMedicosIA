import { useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import SymptomAnalyzer from './components/SymptomAnalyzer'
import PrescriptionView from './components/PrescriptionView'
import type { Diagnosis } from './components/SearchBar'

function App() {
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(null)

  const handleSelectDiagnosis = (diagnosis: Diagnosis) => {
    setSelectedDiagnosis(diagnosis)
  }

  return (
    <div className="flex min-h-screen bg-[#F3F3F3] text-[#191C1C] font-sans selection:bg-blue-100">
      {/* Sidebar delgada estilo Perplexity */}
      <aside className="w-16 lg:w-64 border-r border-slate-200 bg-white flex flex-col sticky top-0 h-screen transition-all">
        <div className="p-4 mb-8">
          <Header />
        </div>
        <nav className="flex-1 px-3 space-y-2">
          <div className="p-3 text-xs font-bold text-slate-400 uppercase tracking-widest hidden lg:block">Biblioteca</div>
          <div className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-100 text-blue-600 font-semibold cursor-pointer">
            <div className="w-5 h-5 bg-blue-600 rounded-md flex-shrink-0 shadow-sm" />
            <span className="hidden lg:block">Nuevo Análisis</span>
          </div>
        </nav>
        <div className="p-4 border-t border-slate-100 space-y-4">
           <div className="hidden lg:block bg-slate-50 rounded-xl p-4 border border-slate-100 text-[11px] text-slate-500 leading-relaxed italic">
             Apoyo administrativo basado en CIE-10 ES 2026.
           </div>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 flex flex-col items-center overflow-y-auto">
        <div className="w-full max-w-4xl px-4 md:px-12 py-12 md:py-20 space-y-16">
          {/* Sección Hero: Analizador de Síntomas */}
          <section className="w-full">
            <SymptomAnalyzer onSelectDiagnosis={handleSelectDiagnosis} />
          </section>

          {/* Sección Secundaria: Búsqueda y Resultados */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-12 space-y-12">
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <SearchBar onSelectDiagnosis={handleSelectDiagnosis} />
              </section>
              
              <PrescriptionView selectedDiagnosis={selectedDiagnosis} />
            </div>
          </div>
        </div>

        <footer className="w-full border-t border-slate-200 bg-white/50 mt-auto">
          <div className="max-w-4xl mx-auto px-12 py-6 flex justify-between items-center text-[11px] text-slate-400 font-medium tracking-wide">
            <span>MEDASSIST IA SYSTEM</span>
            <div className="flex gap-4 uppercase">
              <span>Groq Pro</span>
              <span>Supabase Cloud</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App
