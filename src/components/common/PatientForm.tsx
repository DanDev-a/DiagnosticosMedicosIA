import { User, Calendar } from 'lucide-react'
import type { PatientInfo } from '../../types'

interface PatientFormProps {
  patient: PatientInfo
  setPatient: (updater: PatientInfo | ((prev: PatientInfo) => PatientInfo)) => void
}

export default function PatientForm({ patient, setPatient }: PatientFormProps) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-7 sm:h-7 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-600" />
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Paciente
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-2 sm:mt-3">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1 font-medium">
              Nombre
            </label>
            <input
              type="text"
              value={patient.name}
              onChange={(e) => setPatient(p => ({ ...p, name: e.target.value }))}
              placeholder="Nombre del paciente"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1 font-medium">
              Edad
            </label>
            <input
              type="number"
              value={patient.age}
              onChange={(e) => setPatient(p => ({ ...p, age: e.target.value }))}
              placeholder="Edad"
              min="0"
              max="150"
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1 font-medium">
              Sexo
            </label>
            <select
              value={patient.gender}
              onChange={(e) => setPatient(p => ({ ...p, gender: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all text-gray-700"
            >
              <option value="">Seleccionar</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 mb-1 font-medium">
              <Calendar className="w-3 h-3 inline mr-1" />
              Fecha
            </label>
            <input
              type="date"
              value={patient.date}
              onChange={(e) => setPatient(p => ({ ...p, date: e.target.value }))}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-300 outline-none transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
