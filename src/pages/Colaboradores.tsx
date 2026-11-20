import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Btn, Card, Kpi, Person, Pill, Select, Tabs } from '../components/ui'
import { useStore } from '../lib/store'
import { roleName } from '../lib/selectors'
import { fmtDate, tenure } from '../lib/format'
import { downloadCsv } from '../lib/csv'
import dash from '../data/dashboard.json'

type T = 'todos' | 'onb' | 'atraso' | 'inat'
export default function Colaboradores() {
  const { db, toast } = useStore()
  const nav = useNavigate()
  const [tab, setTab] = useState<T>('todos')
  const [area, setArea] = useState('Área: todas')
  const [cargo, setCargo] = useState('Cargo: todos')
  const [all, setAll] = useState(false)
  const base = db.employees.filter((e) => e.status !== 'inactive')
  const late = (e: (typeof base)[number]) => dash.lateEmployees.some((l) => l.id === e.id)
  const filtered = db.employees.filter((e) =>
    (tab === 'todos' ? e.status !== 'inactive' : tab === 'onb' ? e.status === 'onboarding' : tab === 'atraso' ? late(e) : e.status === 'inactive') &&
    (area === 'Área: todas' || e.area === area.replace('Área: ', '')) && (cargo === 'Cargo: todos' || roleName(db, e) === cargo.replace('Cargo: ', '')))
  const view = all ? filtered : filtered.slice(0, 8)
  const tone = (p: number) => (p >= 80 ? '' : p >= 65 ? 'amber' : 'red')
  const avg = Math.round(base.reduce((a, e) => a + e.trailPct, 0) / base.length)
  const onb = base.filter((e) => e.status === 'onboarding').length
  return (
    <Page title="Colaboradores" sub="Quadro de pessoas, evolução nas trilhas e situação do onboarding">
      <div className="grid4">
        <Kpi label="Colaboradores ativos" value={base.length} unit="9 presenciais/híbridos · 4 home office" />
        <Kpi label="Em onboarding" value={onb} unit="até 90 dias de casa" valueColor="var(--teal)" />
        <Kpi label="Média da trilha obrigatória" value={`${avg}%`} unit="meta 90%" />
        <Kpi label="Feedbacks pendentes" value={2} unit="25/50/75 dias" valueColor="var(--amber-ink)" />
      </div>
      <div className="toolbar">
        <Tabs<T> value={tab} onChange={(t) => { setTab(t); setAll(false) }} items={[{ id: 'todos', label: `Todos (${base.length})` }, { id: 'onb', label: `Onboarding (${onb})` }, { id: 'atraso', label: `Com atraso (${base.filter(late).length})` }, { id: 'inat', label: `Inativos (${db.employees.filter((e) => e.status === 'inactive').length})` }]} />
        <Select auto value={area} onChange={setArea} options={['Área: todas', ...Array.from(new Set(db.employees.map((e) => `Área: ${e.area}`)))]} />
        <Select auto value={cargo} onChange={setCargo} options={['Cargo: todos', ...Array.from(new Set(db.employees.map((e) => `Cargo: ${roleName(db, e)}`)))]} />
        <span className="spacer" /><Btn onClick={() => nav('/gestao/colaboradores/novo')}>+ Novo colaborador</Btn>
      </div>
      <Card>
        <table className="tbl"><thead><tr><th>Colaborador</th><th>Área</th><th>Admissão</th><th>Trilha obrigatória</th><th>PDI</th><th>Pontos</th><th>Situação</th><th /></tr></thead>
          <tbody>{view.map((e) => <tr key={e.id}>
            <td><Person name={e.name} sub={roleName(db, e)} /></td><td style={{ maxWidth: 110 }}>{e.area}</td><td>{fmtDate(e.admission).slice(3)} · {tenure(e.admission)}</td>
            <td><div className="row" style={{ gap: 10 }}><div style={{ width: 110 }}><div className={`progress ${tone(e.trailPct)}`}><i style={{ width: `${e.trailPct}%` }} /></div></div><b style={{ fontSize: 12 }}>{e.trailPct}%</b></div></td>
            <td>{e.pdiPct != null ? `${e.pdiPct}%` : '—'}</td><td><b style={{ color: 'var(--blue)' }}>{e.points.toLocaleString('pt-BR')}</b></td>
            <td><Pill tone={e.status === 'active' ? 'green' : e.status === 'onboarding' ? 'teal' : 'gray'}>{e.status === 'active' ? 'Ativo' : e.status === 'onboarding' ? 'Onboarding' : 'Inativo'}</Pill></td>
            <td><button className="link" onClick={() => nav(`/gestao/colaboradores/${e.id}`)}>Ver perfil</button></td></tr>)}
            {!view.length && <tr><td colSpan={8} className="empty">Nenhum colaborador encontrado.</td></tr>}</tbody></table>
        <div className="table-foot"><span>Mostrando {view.length} de {filtered.length} colaboradores{filtered.length > 8 && <> · <button className="link" onClick={() => setAll(!all)}>{all ? 'ver menos' : 'ver todos'}</button></>}</span>
          <button className="link" onClick={() => { downloadCsv('colaboradores.csv', [['Nome', 'Cargo', 'Área', 'Admissão', 'Trilha %', 'Pontos'], ...filtered.map((e) => [e.name, roleName(db, e), e.area, fmtDate(e.admission), e.trailPct, e.points])]); toast('Lista exportada (CSV).') }}>Exportar lista</button></div>
      </Card>
    </Page>
  )
}
