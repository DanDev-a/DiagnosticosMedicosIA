import { NavLink } from 'react-router-dom'
import { Stethoscope, Search, MessageSquare } from 'lucide-react'

const links = [
  { to: '/', label: 'Analizar Síntomas', icon: MessageSquare },
  { to: '/explorar', label: 'Explorar CIE-10', icon: Search },
]

export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-16 lg:w-64 border-r border-gray-200 bg-white flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3 justify-center lg:justify-start">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div className="hidden lg:block min-w-0">
            <h1 className="text-base font-bold text-gray-900 tracking-tight leading-none truncate">
              MedAssist
            </h1>
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
              CIE-10 ES 2026
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-center lg:justify-start gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gray-100 text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
            title={link.label}
          >
            <link.icon className="w-4.5 h-4.5 shrink-0" />
            <span className="hidden lg:inline">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer — only on desktop */}
      <div className="hidden lg:block p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
          <p className="text-[11px] text-gray-500 leading-relaxed italic">
            Apoyo administrativo basado en CIE-10 ES 2026. No reemplaza el juicio clínico.
          </p>
        </div>
      </div>
    </aside>
  )
}
