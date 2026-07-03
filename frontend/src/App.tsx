import { Navigate, Route, Routes } from 'react-router-dom'
import { usePerfil } from '@/context/PerfilContext'
import { AppShell } from '@/components/AppShell'
import { Login } from '@/pages/Login'
import { MeusAtendimentos } from '@/pages/MeusAtendimentos'
import { Requisicao } from '@/pages/Requisicao'
import { AgendamentoDireto } from '@/pages/AgendamentoDireto'
import { FilaRequisicoes } from '@/pages/FilaRequisicoes'
import { Reagendar } from '@/pages/Reagendar'
import { Ocupacao } from '@/pages/Ocupacao'
import { Relatorios } from '@/pages/Relatorios'
import { Cadastro } from '@/pages/cadastros/Cadastro'

export function App() {
  const { perfil } = usePerfil()

  return (
    <Routes>
      <Route path="/login" element={perfil ? <Navigate to="/" replace /> : <Login />} />
      <Route element={perfil ? <AppShell /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to={perfil === 'Gestor' ? '/fila' : '/meus'} replace />} />
        <Route path="/meus" element={<MeusAtendimentos />} />
        <Route path="/requisicao" element={<Requisicao />} />
        <Route path="/agendamento" element={<AgendamentoDireto />} />
        <Route path="/fila" element={<FilaRequisicoes />} />
        <Route path="/reagendar" element={<Reagendar />} />
        <Route path="/ocupacao" element={<Ocupacao />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/cadastros/:entidade" element={<Cadastro />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
