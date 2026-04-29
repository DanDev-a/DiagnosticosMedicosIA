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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <SymptomAnalyzer onSelectDiagnosis={handleSelectDiagnosis} />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <SearchBar onSelectDiagnosis={handleSelectDiagnosis} />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Instrucciones</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Describe tus síntomas y usa la IA para sugerencias</li>
                <li>• O busca diagnósticos manualmente por código o descripción</li>
                <li>• Selecciona un diagnóstico de cualquiera de las dos opciones</li>
                <li>• Haz clic en "Generar Receta" para crear una prescripción</li>
                <li>• Copia la receta generada al portapapeles</li>
              </ul>
            </div>
          </div>

          <div>
            <PrescriptionView selectedDiagnosis={selectedDiagnosis} />
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-4">
          <p className="text-center text-sm text-gray-500">
            Medical Prescription System - Powered by AI (Groq) & Supabase
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
