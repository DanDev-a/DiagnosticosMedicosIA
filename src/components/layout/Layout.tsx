import { NavLink, Outlet } from 'react-router-dom'
import { Stethoscope, MessageSquare, Search } from 'lucide-react'
import Sidebar from './Sidebar'

const links = [
  { to: '/', label: 'Analizar', icon: MessageSquare },
  { to: '/explorar', label: 'Explorar', icon: Search },
]

export default function Layout() {
  return (
    <div className="flex h-screen bg-white text-gray-900 antialiased">
      <Sidebar />

      {/* Mobile top nav */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 h-14">
        <div className="h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-gray-900">MedAssist</span>
          </div>

          <div className="flex gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`
                }
              >
                <link.icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
