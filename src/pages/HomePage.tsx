import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Activity } from 'lucide-react'
import SymptomAnalyzer from '../components/SymptomAnalyzer'
import SymptomInput from '../components/common/SymptomInput'
import PatientForm from '../components/common/PatientForm'
import RightPanel from '../components/RightPanel'
import PrescriptionView from '../components/PrescriptionView'
import { useSymptomAnalysis } from '../hooks/useSymptomAnalysis'
import type { Diagnosis, PatientInfo } from '../types'
import type { DiagnosisSuggestion } from '../hooks/useSymptomAnalysis'

export default function HomePage() {
  const location = useLocation()
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<Diagnosis | null>(
    location.state?.selectedDiagnosis ?? null
  )
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false)

  // Sync when navigating from ExplorePage
  useEffect(() => {
    if (location.state?.selectedDiagnosis) {
      setSelectedDiagnosis(location.state.selectedDiagnosis)
    }
  }, [location.state])

  // Patient data — shared between PatientForm and PrescriptionView
  const [patient, setPatient] = useState<PatientInfo>({
    name: '',
    age: '',
    gender: '',
    date: new Date().toISOString().split('T')[0]
  })

  const handleSelectDiagnosis = useCallback((diagnosis: Diagnosis) => {
    setSelectedDiagnosis(diagnosis)
  }, [])

  const {
    symptoms,
    setSymptoms,
    suggestions,
    isAnalyzing,
    step,
    analyzeSymptoms,
    handleSelect,
  } = useSymptomAnalysis(handleSelectDiagnosis)

  // Close mobile panel when a diagnosis is selected
  const handleSelectAndClose = useCallback((suggestion: DiagnosisSuggestion) => {
    handleSelect(suggestion)
    setIsMobilePanelOpen(false)
  }, [handleSelect])

  return (
    <div className="flex-1 flex h-full">
      {/* ── Center column ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top: Patient data form */}
        <PatientForm patient={patient} setPatient={setPatient} />

        {/* Middle: Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {selectedDiagnosis ? (
              <PrescriptionView
                selectedDiagnosis={selectedDiagnosis}
                patient={patient}
              />
            ) : (
              <SymptomAnalyzer
                suggestions={suggestions}
                isAnalyzing={isAnalyzing}
                step={step}
              />
            )}
          </div>
        </div>

        {/* Bottom: Fixed symptom input */}
        <SymptomInput
          symptoms={symptoms}
          setSymptoms={setSymptoms}
          isAnalyzing={isAnalyzing}
          onAnalyze={analyzeSymptoms}
        />
      </div>

      {/* ── Right sidebar (desktop fijo + mobile overlay) ── */}
      <RightPanel
        suggestions={suggestions}
        isAnalyzing={isAnalyzing}
        step={step}
        selectedDiagnosis={selectedDiagnosis}
        onSelect={handleSelectAndClose}
        isOpen={isMobilePanelOpen}
        onClose={() => setIsMobilePanelOpen(false)}
      />

      {/* ── Mobile: Floating button to open panel ── */}
      {suggestions.length > 0 && !isAnalyzing && !isMobilePanelOpen && (
        <button
          onClick={() => setIsMobilePanelOpen(true)}
          className="lg:hidden fixed bottom-28 right-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white rounded-full shadow-lg hover:bg-gray-800 active:scale-95 transition-all text-[11px] font-semibold"
        >
          <Activity className="w-3.5 h-3.5" />
          {suggestions.length} diagnóstico{suggestions.length !== 1 ? 's' : ''}
        </button>
      )}
    </div>
  )
}
