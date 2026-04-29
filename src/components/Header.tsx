import { Stethoscope } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Asistencia Medica por IA</h1>
            <p className="text-sm text-gray-500">CIE-10 Diagnósticos y Recetas Inteligentes</p>
          </div>
        </div>
      </div>
    </header>
  )
}
