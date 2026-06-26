import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Aceita os dois vocabularios usados nos dados (Eletiva/Urgencia/Emergencia
// e Alta/Media/Baixa). Emergencia/Alta=vermelho, Urgencia/Media=ambar, resto=verde.
const CORES: Record<string, string> = {
  Emergencia: 'bg-status-ocupada/15 text-status-ocupada border-status-ocupada/30',
  Alta: 'bg-status-ocupada/15 text-status-ocupada border-status-ocupada/30',
  Urgencia: 'bg-status-atencao/15 text-status-atencao border-status-atencao/30',
  Media: 'bg-status-atencao/15 text-status-atencao border-status-atencao/30',
  Eletiva: 'bg-status-disponivel/15 text-status-disponivel border-status-disponivel/30',
  Baixa: 'bg-status-disponivel/15 text-status-disponivel border-status-disponivel/30',
}

export function UrgenciaBadge({ urgencia }: { urgencia: string | null | undefined }) {
  if (!urgencia) return <span className="text-muted-foreground">—</span>
  return (
    <Badge className={cn('border', CORES[urgencia] ?? 'bg-muted text-muted-foreground')}>
      {urgencia}
    </Badge>
  )
}
