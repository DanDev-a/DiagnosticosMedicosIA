import { Stethoscope } from 'lucide-react'

export default function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
        <Stethoscope className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 hidden lg:block">
        <h1 className="text-lg font-bold text-slate-900 tracking-tighter leading-none">
          MedAssist <span className="text-blue-600 italic">AI</span>
        </h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">
          CIE-10 Expert
        </p>
      </div>
    </div>
  )
}
