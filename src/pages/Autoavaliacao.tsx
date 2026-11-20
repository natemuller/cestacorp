import { useState } from 'react'
import { Page } from '../components/Layout'
import { Btn, Card, LevelPicker, Pill, Stepper } from '../components/ui'
import { useStore } from '../lib/store'
import { ME, addAudit, getEval, pushAlert } from '../lib/selectors'
import { TODAY, fmtShort } from '../lib/format'
import criteria from '../data/criteria.json'
import type { Level } from '../lib/types'

const RESULTS: [string, string, number, string][] = [['Apurações entregues no prazo', '96% / 100%', 96, 'amber'], ['Retrabalho em notas', '1,5% / < 2%', 100, ''], ['Trilha obrigatória do cargo', '72% / 100%', 72, 'amber'], ['Satisfação dos clientes', '9,2 / ≥ 9', 100, '']]
export default function Autoavaliacao() {
  const { db, update, toast } = useStore()
  const ev = getEval(db, ME)
  const sent = db.cycleRows[ME].auto === 'sent'
  const [auto, setAuto] = useState(ev.auto)
  const [comment, setComment] = useState(ev.autoComment)
  const [goals, setGoals] = useState(ev.goals)
  const [showMissing, setShowMissing] = useState(false)
  const answered = criteria.filter((c) => auto[c.id]).length
  const groups = ['Conhecimentos', 'Habilidades', 'Atitudes']
  const persist = (send: boolean) => update((d) => {
    const e = d.evaluations[ME] ?? (d.evaluations[ME] = getEval(d, ME))
    e.auto = auto; e.autoComment = comment; e.goals = goals
    if (send) {
      d.cycleRows[ME].auto = 'sent'; d.cycleRows[ME].gestora = 'pending'; d.cycleStages[0].done += 1
      addAudit(d, 'Natan Muller', 'Avaliações', 'Enviou', 'Autoavaliação · Ciclo 2026', '', `${answered}/9 critérios`)
      pushAlert(d, 'gestao', { cat: 'aval', tone: 'teal', title: 'Natan Muller enviou a autoavaliação', text: 'Sua avaliação da gestora já pode ser iniciada.', to: '/gestao/avaliacao/ana', cta: 'Avaliar agora' })
      d.alerts.filter((a) => a.id === 'a3').forEach((a) => (a.read = true))
    }
  })
  const send = () => { if (answered < 9) { setShowMissing(true); toast(`Responda os ${9 - answered} critérios pendentes antes de enviar.`); return } persist(true); toast('Autoavaliação enviada à gestora!') }
  return (
    <Page title="Minha autoavaliação" sub={`Ciclo 2026 · etapa ${sent ? 2 : 1} de 4 · prazo 20/10/2026`}>
      <Stepper steps={[
        { title: 'Autoavaliação', sub: sent ? `Enviada em ${fmtShort(TODAY)}` : 'Em andamento · prazo 20/10', state: sent ? 'done' : 'now' },
        { title: 'Avaliação da gestora', sub: sent ? 'Em andamento' : 'Após o envio', state: sent ? 'now' : 'todo' },
        { title: 'Consenso', sub: 'Reunião 24/10', state: 'todo' }, { title: 'Novo PDI', sub: 'Após consenso', state: 'todo' }]} />
      <div className="grid2" style={{ gridTemplateColumns: '1fr 408px', alignItems: 'start', gap: 20 }}>
        <Card>
          <div className="card-head"><h2 style={{ fontSize: 17 }}>Como você se avalia?</h2><Pill tone="amber">{answered} de 9 respondidos</Pill></div>
          {groups.map((g) => <div key={g}><div className="sec-label">{g}</div>
            {criteria.filter((c) => c.group === g).map((c) => <div key={c.id} className="row between" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ color: showMissing && !auto[c.id] ? 'var(--amber-ink)' : undefined, fontWeight: showMissing && !auto[c.id] ? 500 : 400 }}>{c.label}</span>
              <LevelPicker value={auto[c.id] as Level} disabled={sent} onChange={(l) => setAuto({ ...auto, [c.id]: l })} /></div>)}</div>)}
          <div className="lbl" style={{ margin: '16px 0 6px' }}>Comentário (opcional)</div>
          <textarea className="textarea" disabled={sent} rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
        </Card>
        <div className="stack">
          <Card><div className="card-head"><h2 style={{ fontSize: 17 }}>Resultados esperados</h2><span className="muted xs">meta × realizado</span></div>
            {RESULTS.map(([l, v, p, t]) => <div key={l} style={{ marginBottom: 12 }}><div className="row between sm" style={{ marginBottom: 4 }}><span>{l}</span><b>{v}</b></div><div className={`progress ${t}`}><i style={{ width: `${p}%` }} /></div></div>)}
            <p className="muted xs">Números preenchidos pela gestão. Você pode comentar, mas não editar.</p></Card>
          <Card><h2 style={{ fontSize: 17, marginBottom: 12 }}>Objetivos para os próximos 5 anos</h2><textarea className="textarea" disabled={sent} rows={4} value={goals} onChange={(e) => setGoals(e.target.value)} /></Card>
          <div className="btn-row">{sent ? <Pill tone="green">Autoavaliação enviada · aguardando a gestora</Pill> : <><Btn kind="outline" onClick={() => { persist(false); toast('Rascunho salvo.') }}>Salvar rascunho</Btn><Btn onClick={send}>Enviar autoavaliação</Btn></>}</div>
        </div>
      </div>
    </Page>
  )
}
