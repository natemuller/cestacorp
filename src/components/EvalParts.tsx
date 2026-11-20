import type { ReactNode } from 'react'
import { Pill } from './ui'
import { levelLabel } from '../lib/selectors'
import type { Level } from '../lib/types'

export const LV_TONE: Record<string, string> = { nao: 'red', parcial: 'amber', pleno: '', supera: 'green' }
export const LevelPill = ({ l }: { l?: Level }) => l ? <Pill tone={LV_TONE[l]}>{levelLabel(l)}</Pill> : <span className="muted">—</span>

export const RESULTS: [string, string, number, string][] = [['Apurações entregues no prazo', 'meta 100%', 96, 'amber'], ['Retrabalho em notas lançadas', 'meta < 2%', 100, ''], ['Trilha obrigatória do cargo', 'meta 100%', 72, 'amber'], ['Satisfação dos clientes atendidos', 'meta ≥ 9', 100, '']]
export const RESULT_VAL = ['96%', '1,5%', '72%', '9,2']

export function ResultsCard({ right }: { right?: ReactNode }) {
  return (
    <div className="card">
      <div className="card-head"><h2 style={{ fontSize: 17 }}>Resultados esperados</h2><span className="muted xs">meta × realizado</span></div>
      {RESULTS.map(([l, t, p, tone], i) => <div key={l} style={{ marginBottom: 12 }}><div className="row between sm" style={{ marginBottom: 4 }}><span>{l}</span><b>{RESULT_VAL[i]} / {t}</b></div><div className={`progress ${tone}`}><i style={{ width: `${p}%` }} /></div></div>)}
      {right}
    </div>
  )
}
