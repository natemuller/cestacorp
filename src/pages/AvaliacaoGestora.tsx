import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Btn, Card, LevelPicker, Stepper } from '../components/ui'
import { LevelPill, ResultsCard } from '../components/EvalParts'
import { useStore } from '../lib/store'
import { addAudit, emp, getEval, roleName } from '../lib/selectors'
import { fmtShort, TODAY } from '../lib/format'
import criteria from '../data/criteria.json'
import type { Level } from '../lib/types'

export default function AvaliacaoGestora() {
  const { id = '' } = useParams()
  const { db, update, toast } = useStore()
  const nav = useNavigate()
  const e = emp(db, id)
  const ev = getEval(db, id)
  const [g, setG] = useState(ev.gestora)
  const [comment, setComment] = useState(ev.gestoraComment)
  const [miss, setMiss] = useState(false)
  if (!e || !db.cycleRows[id]) return <Navigate to="/gestao/ciclos" replace />
  const c = db.cycleRows[id]
  const locked = c.gestora === 'sent'
  const save = (send: boolean) => update((d) => {
    const x = d.evaluations[id] ?? (d.evaluations[id] = getEval(d, id))
    x.gestora = g; x.gestoraComment = comment
    if (send) { d.cycleRows[id].gestora = 'sent'; d.cycleRows[id].consenso = 'progress'; d.cycleStages[1].done += 1; x.consenso = { ...g, ...x.consenso }; addAudit(d, 'Luana Thurow', 'Avaliações', 'Enviou', `${e.name} · avaliação da gestora`, '', 'enviada para consenso') }
    else if (c.gestora === 'pending') d.cycleRows[id].gestora = 'progress'
  })
  const send = () => {
    if (criteria.some((k) => !g[k.id])) { setMiss(true); toast('Avalie todos os critérios antes de enviar.'); return }
    save(true); toast('Avaliação enviada. Siga para o consenso.'); nav(`/gestao/consenso/${id}`)
  }
  const autoSent = c.auto === 'sent' || c.auto === 'late' ? c.auto === 'sent' : false
  return (
    <Page title="Avaliação de Desempenho Anual" sub={`Ciclo 2026 · avaliando ${e.name}, ${roleName(db, e)}`}>
      <Stepper steps={[
        { title: 'Autoavaliação', sub: autoSent ? `Enviada em ${fmtShort(TODAY)}` : 'Em andamento · prazo 20/10', state: autoSent ? 'done' : 'now' },
        { title: 'Avaliação da gestora', sub: locked ? 'Enviada' : 'Em andamento · prazo 31/10', state: locked ? 'done' : 'now' },
        { title: 'Consenso', sub: 'Reunião 24/10', state: locked ? 'now' : 'todo' }, { title: 'Gerar PDI', sub: 'Após consenso', state: 'todo' }]} />
      {!autoSent && <div className="note amber">A autoavaliação de {e.name.split(' ')[0]} ainda não foi enviada. Você pode avançar, mas a coluna “Auto” aparece parcial.</div>}
      <div className="grid2" style={{ gridTemplateColumns: '1fr 388px', alignItems: 'start', gap: 20 }}>
        <Card>
          <div className="card-head"><h2 style={{ fontSize: 17 }}>Critérios da avaliação</h2><span className="muted xs">Fonte: descrição do cargo</span></div>
          <table className="tbl"><thead><tr><th>Requisito</th><th>Auto</th><th>Avaliação da gestora</th></tr></thead></table>
          {['Conhecimentos', 'Habilidades', 'Atitudes'].map((grp) => <div key={grp}><div className="sec-label">{grp}</div>
            {criteria.filter((k) => k.group === grp).map((k) => <div key={k.id} className="row" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ flex: 1, color: miss && !g[k.id] ? 'var(--amber-ink)' : undefined }}>{k.label}</span><div style={{ width: 90 }}><LevelPill l={ev.auto[k.id] as Level} /></div>
              <LevelPicker value={g[k.id] as Level} disabled={locked} onChange={(l) => setG({ ...g, [k.id]: l })} /></div>)}</div>)}
          <div className="lbl" style={{ margin: '16px 0 6px' }}>Comentário da gestora</div>
          <textarea className="textarea" rows={3} disabled={locked} value={comment} onChange={(x) => setComment(x.target.value)} />
        </Card>
        <div className="stack">
          <ResultsCard />
          <Card><h2 style={{ fontSize: 17, marginBottom: 10 }}>Objetivos profissionais (5 anos)</h2><p className="sm" style={{ lineHeight: 1.5 }}>{ev.goals || 'Não informado.'}</p><span className="pill" style={{ marginTop: 10 }}>Informado pela colaborador na autoavaliação</span></Card>
          <div className="note" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: 18, background: 'var(--blue-soft)' }}><b style={{ fontSize: 14 }}>Depois do consenso</b><span>Os critérios “Não atende” e “Parcial” viram sugestões de ação no PDI, já com treinamentos da trilha vinculados.</span></div>
          <div className="btn-row">{locked ? <Btn onClick={() => nav(`/gestao/consenso/${id}`)}>Ir para o consenso</Btn> : <><Btn kind="outline" onClick={() => { save(false); toast('Rascunho salvo.') }}>Salvar rascunho</Btn><Btn onClick={send}>Enviar para consenso</Btn></>}</div>
        </div>
      </div>
    </Page>
  )
}
