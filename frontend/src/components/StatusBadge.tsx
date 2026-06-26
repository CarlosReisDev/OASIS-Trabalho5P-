import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { rotuloStatus } from '@/lib/status'

// Cores de status do professor: Disponivel=verde, Ocupada=vermelho, atencao=ambar.
const CORES: Record<string, string> = {
  Disponivel: 'bg-status-disponivel/15 text-status-disponivel border-status-disponivel/30',
  Ocupada: 'bg-status-ocupada/15 text-status-ocupada border-status-ocupada/30',
  Agendado: 'bg-status-disponivel/15 text-status-disponivel border-status-disponivel/30',
  Agendada: 'bg-status-disponivel/15 text-status-disponivel border-status-disponivel/30',
  Processada: 'bg-status-atencao/15 text-status-atencao border-status-atencao/30',
  Reagendado: 'bg-status-atencao/15 text-status-atencao border-status-atencao/30',
  Pendente: 'bg-status-atencao/15 text-status-atencao border-status-atencao/30',
  Cancelado: 'bg-status-ocupada/15 text-status-ocupada border-status-ocupada/30',
  Cancelada: 'bg-status-ocupada/15 text-status-ocupada border-status-ocupada/30',
  Rejeitada: 'bg-status-ocupada/15 text-status-ocupada border-status-ocupada/30',
}

export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-muted-foreground">—</span>
  return (
    <Badge className={cn('border', CORES[status] ?? 'bg-muted text-muted-foreground')}>
      {rotuloStatus(status)}
    </Badge>
  )
}
