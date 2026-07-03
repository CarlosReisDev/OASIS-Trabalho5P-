import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Bell,
  CalendarClock,
  CalendarPlus,
  ClipboardCheck,
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
  { to: '/meus', label: 'Meus atendimentos', icon: ClipboardCheck, perfis: ['Clinico', 'Cirurgiao'] },
  { to: '/requisicao', label: 'Requisicao', icon: ClipboardList, perfis: ['Clinico', 'Cirurgiao', 'Gestor'] },
  { to: '/agendamento', label: 'Agendamento direto', icon: CalendarPlus, perfis: ['Cirurgiao', 'Gestor'] },
  { to: '/fila', label: 'Fila de requisicoes', icon: ListChecks, perfis: ['Gestor'] },
  { to: '/reagendar', label: 'Reagendar / Cancelar', icon: CalendarClock, perfis: ['Cirurgiao', 'Gestor'] },
  { to: '/ocupacao', label: 'Painel de ocupacao', icon: Activity, perfis: ['Gestor'] },
  { to: '/relatorios', label: 'Relatorios', icon: BarChart3, perfis: ['Gestor'] },
]

export function AppShell() {
  const { perfil, medico, sair } = usePerfil()
  const navigate = useNavigate()
  const [hover, setHover] = useState(false) // sidebar revelada por hover na borda
  const [fixada, setFixada] = useState(false) // toggle (toque/teclado) pelo hamburguer

  if (!perfil) return null

  const aberta = hover || fixada
  const itensVisiveis = ITENS.filter((i) => i.perfis.includes(perfil))
  const rotuloPerfil = PERFIS.find((p) => p.valor === perfil)?.rotulo ?? perfil

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
      isActive ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent',
    )

  const fecharNav = () => {
    setHover(false)
    setFixada(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Topbar */}
      <header className="sticky top-0 z-50 flex items-center gap-3 border-b bg-card px-4 h-14">
        <Button variant="ghost" size="icon" onClick={() => setFixada((v) => !v)} title="Menu">
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
          {perfil === 'Gestor' && (
            <Button variant="ghost" size="icon" title="Notificacoes"
              onClick={() => navigate('/cadastros/notificacoes')}>
              <Bell className="h-5 w-5" />
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            {medico ? `${medico.nome} · ${rotuloPerfil}` : rotuloPerfil}
          </span>
          <Button variant="outline" size="sm" onClick={() => { sair(); navigate('/login') }}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      {/* Faixa sensivel na borda esquerda: encostar o mouse revela a sidebar */}
      <div
        className="fixed left-0 top-14 bottom-0 w-2 z-40"
        onMouseEnter={() => setHover(true)}
      />
      {/* Dica visual discreta de que ha um menu na borda */}
      {!aberta && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-30 h-16 w-1.5 rounded-r bg-primary/40 pointer-events-none" />
      )}

      {/* Sidebar overlay (desliza) */}
      <aside
        onMouseLeave={() => setHover(false)}
        className={cn(
          'fixed left-0 top-14 bottom-0 w-60 z-40 border-r bg-card p-3 space-y-1 overflow-y-auto shadow-lg',
          'transition-transform duration-200',
          aberta ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {itensVisiveis.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass} onClick={fecharNav}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}

        {perfil === 'Gestor' && (
          <div className="pt-3">
            <p className="flex items-center gap-2 px-3 pb-1 text-xs font-semibold uppercase text-muted-foreground">
              <Database className="h-3.5 w-3.5" /> Cadastros
            </p>
            {CADASTROS.filter((c) => c.slug !== 'notificacoes').map((c) => (
              <NavLink key={c.slug} to={`/cadastros/${c.slug}`} className={linkClass} onClick={fecharNav}>
                {c.titulo}
              </NavLink>
            ))}
          </div>
        )}
      </aside>

      {/* Scrim quando fixada (toque): clicar fora fecha */}
      {fixada && <div className="fixed inset-0 top-14 z-30 bg-black/20" onClick={fecharNav} />}

      <main className="flex-1 p-4 md:p-6 overflow-x-auto">
        <Outlet />
      </main>
    </div>
  )
}
