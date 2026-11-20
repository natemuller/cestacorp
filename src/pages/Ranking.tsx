import { useState } from 'react'
import { Page } from '../components/Layout'
import { Avatar, Card, Progress, Select, Tabs } from '../components/ui'
import { useMe } from '../lib/store'
import { meRank, roleName, trailItems, doneTrail } from '../lib/selectors'
import { initials } from '../lib/format'
import rules from '../data/rules.json'
import { Check } from 'lucide-react'

type T = 'geral' | 'area' | 'cargo'
export default function Ranking() {
  const { db, p, toast } = useMe()
  const [tab, setTab] = useState<T>('geral')
  const me = p.self
  const ME = me.id
  const { ranked, pos, areaPos, above } = meRank(db, p)
  const list = ranked.filter((e) => tab === 'geral' || (tab === 'area' ? e.area === me.area : e.roleId === me.roleId))
  const [p1, p2, p3] = [list[0], list[1], list[2]]
  const rest = list.slice(3)
  const gain = above ? above.points - me.points : 0
  const got = p.pins.filter((x) => x.got).length
  const Pod = ({ e, n, h }: { e?: typeof me; n: number; h: number }) => !e ? <div /> : (
    <Card style={{ textAlign: 'center', height: h, alignSelf: 'end', padding: 18 }}>
      <span className="avatar" style={{ width: 24, height: 24, fontSize: 10, background: n === 1 ? '#e8b923' : n === 2 ? '#a5abbd' : '#c98a4b', marginBottom: 6 }}>{n}º</span>
      <div><Avatar name={e.name} size={48} /></div>
      <b style={{ display: 'block', marginTop: 8 }}>{e.name}</b><div className="muted xs">{e.area}</div>
      <b style={{ color: 'var(--blue)', display: 'block', marginTop: 6 }}>{e.points.toLocaleString('pt-BR')} pts</b>
    </Card>
  )
  return (
    <Page title="Ranking & Pins" sub="Acompanhe sua evolução em comparação com o time · temporada 2026">
      <div className="toolbar"><Tabs<T> value={tab} onChange={setTab} items={[{ id: 'geral', label: 'Geral' }, { id: 'area', label: `Minha área · ${me.area}` }, { id: 'cargo', label: `Meu cargo · ${p.roleName.replace('Analista Fiscal', 'Analista')}` }]} /><span className="spacer" />
        <Select auto value="Período: 2026" onChange={() => toast('Demo: apenas a temporada 2026 tem dados.')} options={['Período: 2026', 'Período: 2025']} /></div>
      <div className="grid2" style={{ gridTemplateColumns: '1fr 400px', gap: 20, alignItems: 'start' }}>
        <div className="stack">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'end' }}><Pod e={p2} n={2} h={210} /><Pod e={p1} n={1} h={236} /><Pod e={p3} n={3} h={200} /></div>
          <Card>
            <table className="tbl"><thead><tr><th>#</th><th>Colaborador</th><th>Área</th><th>Trein.</th><th>Horas</th><th>PDI</th><th>Pontos</th></tr></thead>
              <tbody>{rest.map((e, i) => (
                <tr key={e.id} className={e.id === ME ? 'hl' : ''}>
                  <td style={{ color: e.id === ME ? 'var(--green-ink)' : 'var(--muted)', fontWeight: 600 }}>{i + 4}º</td>
                  <td><div className="person"><span className={`avatar ${e.id === ME ? '' : 'soft'}`} style={{ width: 30, height: 30, fontSize: 10 }}>{initials(e.name)}</span><div><b>{e.id === ME ? `${e.name} (você)` : e.name}</b><small>{e.id === ME ? p.roleName : roleName(db, e)}</small></div></div></td>
                  <td>{e.area}</td><td>{e.trainings}</td><td>{e.hours}h</td><td>{e.pdiPct ?? '—'}{e.pdiPct != null && '%'}</td><td><b style={{ color: 'var(--blue)' }}>{e.points.toLocaleString('pt-BR')}</b></td>
                </tr>))}
              </tbody></table>
          </Card>
        </div>
        <div className="stack">
          <div className="card" style={{ background: 'var(--blue)', color: '#fff', border: 0 }}>
            <div className="row between"><span style={{ opacity: .85 }}>Sua posição</span><span className="pill" style={{ background: 'var(--green)', color: '#fff' }}>▲ 2 posições no mês</span></div>
            <div style={{ margin: '8px 0 12px' }}><b style={{ fontSize: 34 }}>{pos}º</b> <span style={{ opacity: .85 }}>geral · {areaPos}º {p.painel.areaLabel}</span></div>
            {above && <><p className="sm">Faltam {gain} pts para alcançar {above.name.split(' ')[0]} ({pos - 1}º)</p><div className="progress" style={{ marginTop: 10, background: 'rgba(255,255,255,.25)' }}><i style={{ width: `${(me.points / above.points) * 100}%` }} /></div></>}
          </div>
          <Card><h2 style={{ marginBottom: 10 }}>Como ganhar pontos</h2>
            <div className="divider-list">{rules.map((r) => <div key={r.label} className="row between sm" style={{ padding: '9px 0' }}><span>{r.label}</span><b style={{ color: 'var(--green-ink)' }}>+{r.pts}</b></div>)}</div></Card>
          <Card>
            <div className="card-head"><h2>Coleção de pins</h2><span className="muted xs">{got} de {p.pins.length}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              {p.pins.map((x) => <div key={x.id} className={`pin ${x.got ? 'got' : ''}`} style={{ width: 'auto' }}><div className="badge" style={{ width: 44, height: 44 }}>{x.got && <Check size={18} />}</div><b style={{ fontSize: 10 }}>{x.name}</b></div>)}
            </div>
            <div className="kv" style={{ marginTop: 16 }}><b>Próximo pin: Trilha 100%</b><div className="muted xs" style={{ margin: '4px 0 8px' }}>Conclua mais {trailItems(p).length - doneTrail(p)} cursos obrigatórios · {doneTrail(p)}/{trailItems(p).length}</div><Progress value={(doneTrail(p) / trailItems(p).length) * 100} /></div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
