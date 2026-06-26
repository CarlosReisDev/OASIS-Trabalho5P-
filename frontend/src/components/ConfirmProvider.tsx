import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface OpcoesConfirm {
  titulo?: string
  mensagem: string
  confirmarTexto?: string
  destrutivo?: boolean
}

type FnConfirm = (o: OpcoesConfirm) => Promise<boolean>

const Ctx = createContext<FnConfirm>(async () => false)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<{ opts: OpcoesConfirm; resolve: (b: boolean) => void } | null>(null)

  const confirmar = useCallback<FnConfirm>(
    (opts) => new Promise<boolean>((resolve) => setEstado({ opts, resolve })),
    [],
  )

  function fechar(valor: boolean) {
    estado?.resolve(valor)
    setEstado(null)
  }

  return (
    <Ctx.Provider value={confirmar}>
      {children}
      <Dialog open={!!estado} onOpenChange={(o) => !o && fechar(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{estado?.opts.titulo ?? 'Confirmar'}</DialogTitle>
            <DialogDescription>{estado?.opts.mensagem}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => fechar(false)}>
              Cancelar
            </Button>
            <Button
              variant={estado?.opts.destrutivo ? 'destructive' : 'default'}
              onClick={() => fechar(true)}
            >
              {estado?.opts.confirmarTexto ?? 'Confirmar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  )
}

export function useConfirm() {
  return useContext(Ctx)
}
