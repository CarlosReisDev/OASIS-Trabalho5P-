import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  CalendarClock,
  CalendarPlus,
  ClipboardList,
  Database,
  ListChecks,
  LogOut,
  Menu,
  Stethoscope,
} from 'lucide-react'
import { CADASTROS } from '@/cadastros/configs'
import { PERFIS, usePerfil, type Perfil } from '@/context/PerfilContext'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ItemNav {
  to: string
  label: string
  icon: typeof Activity
  perfis: Perfil[]
}

const ITENS: ItemNav[] = [
  { to: '/requisicao', label: 'Requisicao', icon: ClipboardList, perfis: ['Clinico', 'Cirurgiao', 'Gestor'] },
  { to: '/agendamento', label: 'Agendamento direto', icon: CalendarPlus, perfis: ['Cirurgiao', 'Gestor'] },
  { to: '/fila', label: 'Fila de requisicoes', icon: ListChecks, perfis: ['Gestor'] },
  { to: '/reagendar', label: 'Reagendar / Cancelar', icon: CalendarClock, perfis: ['Gestor'] },
  { to: '/ocupacao', label: 'Painel de ocupacao', icon: Activity, perfis: ['Gestor'] },
  { to: '/relatorios', label: 'Relatorios', icon: BarChart3, perfis: ['Gestor'] },
]

export function AppShell() {
  const { perfil, sair } = usePerfil()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuMobile, setMenuMobile] = useState(false)

  // Modo foco (T02): esconde a sidebar na tela de agendamento direto.
  const modoFoco = location.pathname.startsWith('/agendamento')

  if (!perfil) return null

  const itensVisiveis = ITENS.filter((i) => i.perfis.includes(perfil))
  const rotuloPerfil = PERFIS.find((p) => p.valor === perfil)?.rotulo ?? perfil

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
      isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
    )

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card px-4 h-14">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMenuMobile((v) => !v)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 font-semibold text-primary">
          <Stethoscope className="h-5 w-5" />
          OASIS
        </div>
        <span className="hidden sm:inline rounded bg-status-atencao/15 text-status-atencao text-xs px-2 py-0.5">
          Dados sinteticos — nao use informacoes reais de pacientes
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{rotuloPerfil}</span>
          <Button variant="outline" size="sm" onClick={() => { sair(); navigate('/login') }}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        {!modoFoco && (
          <aside
            className={cn(
              'w-60 shrink-0 border-r bg-card p-3 space-y-1',
              'md:block',
              menuMobile ? 'block absolute z-20 h-full' : 'hidden',
            )}
          >
            {itensVisiveis.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setMenuMobile(false)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}

            {perfil === 'Gestor' && (
              <div className="pt-3">
                <p className="flex items-center gap-2 px-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">
                  <Database className="h-3.5 w-3.5" /> Cadastros
                </p>
                {CADASTROS.map((c) => (
                  <NavLink
                    key={c.slug}
                    to={`/cadastros/${c.slug}`}
                    className={linkClass}
                    onClick={() => setMenuMobile(false)}
                  >
                    {c.titulo}
                  </NavLink>
                ))}
              </div>
            )}
          </aside>
        )}

        <main className="flex-1 p-4 md:p-6 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
