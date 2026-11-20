import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Btn, Card, Field, Modal, Person, Pill, Progress } from '../components/ui'
import { useStore } from '../lib/store'
import { addAudit, emp, pushAlert, roleName } from '../lib/selectors'
import { fmtDate } from '../lib/format'
import cycle from '../data/cycle.json'

const P: Record<string, [string, string]> = { sent: ['Enviada', 'green'], done: ['Concluído', 'green'], draft: ['Em andamento', ''], progress: ['Em andamento', ''], pending: ['Pendente', 'amber'], late: ['Atrasado', 'red'], none: ['Não iniciado', 'gray'] }
export default function Ciclos() {
  const { db, update, toast } = useStore()
  const nav = useNavigate()
  const [modal, setModal] = useState<null | 'edit' | 'new'>(null)
  const rows = Object.entries(db.cycleRows)
  const remind = (id: string) => { update((d) => { const e = emp(d, id)!; addAudit(d, 'Luana Thurow', 'Avaliações', 'Notificou', `${e.name} · autoavaliação`, '', 'lembrete enviado'); if (id === 'ana') pushAlert(d, 'colaborador', { cat: 'aval', tone: 'teal', title: 'Lembrete: sua autoavaliação está aberta', text: 'Prazo até 20/10/2026.', to: '/avaliacoes', cta: 'Continuar autoavaliação' }) }); toast(`Lembrete enviado para ${emp(db, id)!.name.split(' ')[0]}.`) }
  const action = (id: string, c: (typeof rows)[number][1]) => {
    if (c.auto === 'late' || c.auto === 'draft') return <button className="link" onClick={() => remind(id)}>Lembrar</button>
    if (c.gestora === 'pending' || c.gestora === 'progress') return <button className="link" onClick={() => nav(`/gestao/avaliacao/${id}`)}>Avaliar</button>
    if (c.consenso === 'progress' || (c.gestora === 'sent' && c.consenso === 'none')) return <button className="link" onClick={() => nav(`/gestao/consenso/${id}`)}>Consenso</button>
    return <button className="link" onClick={() => nav(`/gestao/pdi/${id}`)}>Ver</button>
  }
  return (
    <Page title="Avaliações Anuais" sub="Ciclos de avaliação de desempenho: autoavaliação, gestora, consenso e PDI">
      <Card>
        <div className="card-head" style={{ alignItems: 'flex-start' }}>
          <div><h2 style={{ fontSize: 19 }}>Ciclo 2026</h2><p className="muted sm">Aberto em 01/10/2026 · 13 colaboradores · critérios vindos da descrição de cada cargo</p></div>
          <div className="row"><Btn kind="ghost" onClick={() => setModal('edit')}>Editar ciclo</Btn><Btn onClick={() => setModal('new')}>+ Novo ciclo</Btn></div>
        </div>
        <div className="grid4" style={{ gap: 16 }}>{db.cycleStages.map((s, i) => <div key={s.n} className="kv" style={{ padding: 16 }}><b style={{ fontSize: 13 }}>{s.n}. {s.name}</b><div className="muted xs" style={{ margin: '8px 0' }}>{s.from ? `${s.from} – ${s.to}` : `até ${s.to}`}</div><div className="row between sm" style={{ marginBottom: 6 }}><b>{s.done} de {s.total}</b><span className="muted">{Math.round((s.done / s.total) * 100)}%</span></div><Progress value={(s.done / s.total) * 100} tone={['', 'blue', 'teal', 'amber'][i]} /></div>)}</div>
      </Card>
      <Card>
        <div className="card-head"><h2>Andamento por colaborador</h2><button className="link" onClick={() => { rows.filter(([, c]) => c.auto === 'late' || c.auto === 'draft').forEach(([id]) => remind(id)); }}>Lembrar pendentes</button></div>
        <table className="tbl"><thead><tr><th>Colaborador</th><th>Autoavaliação</th><th>Gestora</th><th>Consenso</th><th>PDI</th><th /></tr></thead>
          <tbody>{rows.map(([id, c]) => { const e = emp(db, id)!; return <tr key={id}>
            <td><Person name={e.name} sub={roleName(db, e)} /></td>
            {[c.auto, c.gestora, c.consenso, c.pdi].map((k, i) => <td key={i}><Pill tone={P[k][1]}>{P[k][0]}</Pill></td>)}
            <td>{action(id, c)}</td></tr> })}</tbody></table>
        <p className="muted xs" style={{ padding: '14px 4px 0' }}>Mostrando {rows.length} de 13 · Ciclos anteriores: 2025 (concluído), 2024 (concluído)</p>
      </Card>
      {modal && <Modal title={modal === 'new' ? 'Novo ciclo de avaliação' : 'Editar ciclo 2026'} onClose={() => setModal(null)} actions={<><Btn kind="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={() => { setModal(null); toast(modal === 'new' ? 'Ciclo criado como rascunho (simulado).' : 'Ciclo atualizado.') }}>Salvar</Btn></>}>
        <Field label="Nome do ciclo"><input className="input" defaultValue={modal === 'new' ? 'Ciclo 2027' : cycle.name} /></Field>
        <div className="grid2"><Field label="Abertura"><input className="input" type="date" defaultValue={modal === 'new' ? '2027-10-01' : cycle.opened} /></Field><Field label="Prazo da autoavaliação"><input className="input" type="date" defaultValue="2026-10-20" /></Field></div>
        <p className="muted xs">Abertura: {fmtDate(cycle.opened)} · critérios herdados da descrição de cada cargo.</p>
      </Modal>}
    </Page>
  )
}
