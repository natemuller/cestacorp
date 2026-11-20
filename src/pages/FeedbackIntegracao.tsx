import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Avatar, Btn, Card, Pill, Progress, Scale } from '../components/ui'
import { useStore } from '../lib/store'
import { addAudit, emp, roleName } from '../lib/selectors'
import { TODAY, addDays, daysBetween, fmtDate, fmtShort } from '../lib/format'

const Q = [['adapt', 'Adaptação à equipe e à rotina'], ['tasks', 'Entendimento das tarefas do cargo'], ['tools', 'Uso das ferramentas (ERP, HUBLX, Google)']] as const
export default function FeedbackIntegracao() {
  const { id = '' } = useParams()
  const { db, update, toast } = useStore()
  const nav = useNavigate()
  const e = emp(db, id)
  const rec = db.feedback[id] ?? { stage: 25, scores: { adapt: 0, tasks: 0, tools: 0 }, strengths: '', develop: '', agreed: '', employeeView: '', done: false }
  const [f, setF] = useState(rec)
  if (!e) return <Navigate to="/gestao/colaboradores" replace />
  const days = daysBetween(e.admission, TODAY)
  const stage = rec.stage
  const save = (finish: boolean) => {
    if (finish && (Q.some(([k]) => !f.scores[k]) || !f.strengths.trim())) { toast('Preencha as notas e os pontos fortes antes de concluir.'); return }
    update((d) => { d.feedback[id] = { ...f, done: finish ? true : f.done, stage }
      if (finish) { d.employees.find((x) => x.id === id)!.points += 15; addAudit(d, 'Luana Thurow', 'Colaboradores', 'Concluiu', `${e.name} · feedback ${stage} dias`, '', 'feedback registrado') } })
    toast(finish ? `Feedback de ${stage} dias concluído. +15 pontos para ${e.name.split(' ')[0]}.` : 'Rascunho salvo.')
    if (finish) nav('/gestao/colaboradores')
  }
  return (
    <Page title={`Feedback de ${stage} dias`} sub={<><Link to="/gestao/colaboradores">Colaboradores</Link> › {e.name} › Feedbacks de integração</>}>
      <Card className="row" style={{ padding: '16px 24px', gap: 24 }}>
        <Avatar name={e.name} size={40} tone="teal" /><div style={{ flex: 1 }}><b style={{ fontSize: 15 }}>{e.name}</b><div className="muted sm">{roleName(db, e)} · admitida em {fmtDate(e.admission)} · {days} dias de casa</div></div>
        <div className="row between" style={{ width: 460, position: 'relative' }}><div style={{ position: 'absolute', left: 20, right: 20, top: 6, height: 2, background: 'var(--line)' }} />
          {[25, 50, 75].map((n) => <div key={n} style={{ textAlign: 'center', position: 'relative', background: '#fff', padding: '0 6px' }}><div style={{ width: 14, height: 14, borderRadius: '50%', margin: '0 auto 4px', background: n === stage ? 'var(--teal)' : n < stage ? 'var(--teal)' : '#fff', border: '2px solid #8e98d6', borderColor: n <= stage ? 'var(--teal)' : '#8e98d6' }} /><b style={{ fontSize: 12 }}>{n} dias</b><div className="muted xs">{n === stage && days >= n ? 'hoje' : fmtShort(addDays(e.admission, n))}</div></div>)}</div>
      </Card>
      <div className="grid2" style={{ gridTemplateColumns: '1fr 448px', alignItems: 'start', gap: 20 }}>
        <Card>
          <div className="card-head"><h2 style={{ fontSize: 17 }}>Roteiro da conversa</h2><Pill>preenchido pela gestora</Pill></div>
          <div className="stack-sm" style={{ gap: 18 }}>
            {Q.map(([k, l]) => <div key={k}><p style={{ marginBottom: 8 }}>{l}</p><Scale value={f.scores[k]} disabled={rec.done} onChange={(v) => setF({ ...f, scores: { ...f.scores, [k]: v } })} /></div>)}
            {([['strengths', 'Pontos fortes observados'], ['develop', 'Pontos a desenvolver'], ['agreed', `Combinados até o feedback de ${stage === 25 ? 50 : stage === 50 ? 75 : 90} dias`]] as const).map(([k, l]) => <div key={k}><div className="lbl">{l}</div><textarea className="textarea" rows={2} disabled={rec.done} value={f[k]} onChange={(x) => setF({ ...f, [k]: x.target.value })} /></div>)}
          </div>
        </Card>
        <div className="stack">
          <Card><h2 style={{ fontSize: 17, marginBottom: 14 }}>Andamento do onboarding</h2>
            {[['Integração (1ª semana)', '4 de 4', 100, ''], ['Trilha obrigatória do cargo', `${Math.round((e.trailPct / 100) * 12)} de 12`, e.trailPct, 'amber'], ['PDI inicial', stage < 75 ? 'aguarda 75 dias' : 'pronto para revisão', 0, '']].map(([l, v, p, t]) => <div key={l as string} style={{ marginBottom: 14 }}><div className="row between sm" style={{ marginBottom: 5 }}><span>{l}</span><b>{v}</b></div><Progress value={p as number} tone={t as string} /></div>)}</Card>
          <Card><div className="card-head"><h2 style={{ fontSize: 17 }}>Visão da colaborador</h2>{f.employeeView && <Pill tone="green">respondido</Pill>}</div>
            {f.employeeView ? <><p className="sm" style={{ lineHeight: 1.6 }}>“{f.employeeView}”</p><p className="muted xs" style={{ marginTop: 8 }}>{e.name.split(' ')[0]} respondeu em 13/10 pelo próprio painel.</p></> : <p className="muted sm">Ainda não respondeu à pesquisa de integração.</p>}</Card>
          <div className="btn-row">{rec.done ? <Pill tone="green">Feedback concluído</Pill> : <><Btn kind="outline" onClick={() => save(false)}>Salvar rascunho</Btn><Btn onClick={() => save(true)}>Concluir feedback</Btn></>}</div>
        </div>
      </div>
    </Page>
  )
}
