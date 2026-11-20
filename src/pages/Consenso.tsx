import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Btn, Card, LevelPicker, Pill, Stepper } from '../components/ui'
import { LevelPill } from '../components/EvalParts'
import { useStore } from '../lib/store'
import { addAudit, course, emp, getEval, pushAlert, roleName } from '../lib/selectors'
import { fmtShort, TODAY } from '../lib/format'
import criteria from '../data/criteria.json'
import type { Level, PdiAction } from '../lib/types'

const MAP: Record<string, { what: string; how: string; courseId: string }> = {
  k1: { what: 'Aprofundar legislação de ICMS', how: 'Fazer o curso presencial do CRC-RS e aplicar o aprendizado na apuração de 3 clientes do Simples Nacional.', courseId: 'c10' },
  k2: { what: 'Reforçar apuração do Simples Nacional', how: 'Curso + revisão das apurações com a gestora.', courseId: 'c16' },
  k3: { what: 'Dominar o sistema de gestão e o HUBLX', how: 'Trilha de vídeos + prática supervisionada.', courseId: 'c15' },
  s1: { what: 'Melhorar a comunicação escrita com clientes', how: 'Curso + revisão quinzenal de e-mails', courseId: 'c3' },
  s2: { what: 'Dominar Excel intermediário', how: 'Curso + planilha de conferência de notas', courseId: 'c11' },
  s3: { what: 'Organização e cumprimento de prazos', how: 'Mapear o fluxo mensal e definir checkpoints.', courseId: 'c20' },
  t1: { what: 'Fortalecer o trabalho em equipe', how: 'Participar de rotinas conjuntas de fechamento.', courseId: 'c30' },
  t2: { what: 'Desenvolver proatividade', how: 'Propor uma melhoria de processo por trimestre.', courseId: 'c22' },
  t3: { what: 'Ampliar o foco no cliente', how: 'Acompanhar atendimentos com a gestora.', courseId: 'c21' },
}
export default function Consenso() {
  const { id = '' } = useParams()
  const { db, update, toast } = useStore()
  const nav = useNavigate()
  const e = emp(db, id)
  const ev = getEval(db, id)
  const [cons, setCons] = useState<Record<string, Level | undefined>>({ ...ev.gestora, ...ev.consenso })
  const [sugg, setSugg] = useState<Record<string, boolean>>(ev.suggestions)
  const [rec, setRec] = useState(ev.consensoComment)
  if (!e || !db.cycleRows[id]) return <Navigate to="/gestao/ciclos" replace />
  const cy = db.cycleRows[id]
  const done = cy.consenso === 'done'
  const div = criteria.filter((k) => ev.auto[k.id] !== ev.gestora[k.id])
  const need = criteria.filter((k) => cons[k.id] === 'parcial' || cons[k.id] === 'nao')
  const cnt = (f: (l?: Level) => boolean) => criteria.filter((k) => f(cons[k.id])).length
  const persist = (finish: boolean) => update((d) => {
    const x = d.evaluations[id] ?? (d.evaluations[id] = getEval(d, id))
    x.consenso = cons; x.consensoComment = rec; x.suggestions = sugg
    if (finish) {
      d.cycleRows[id].consenso = 'done'; d.cycleRows[id].pdi = 'progress'; d.cycleStages[2].done += 1; d.cycleStages[3].done += 0
      const actions: PdiAction[] = need.filter((k) => sugg[k.id]).map((k, i) => ({ id: `d${Date.now()}${i}`, what: MAP[k.id].what, how: MAP[k.id].how, who: i === 0 ? `${e.name.split(' ')[0]} + Luana` : e.name.split(' ')[0], due: i === 0 ? '2027-02-28' : i === 1 ? '2026-12-15' : '2027-01-31', courseId: MAP[k.id].courseId, follow: 'Mensal' }))
      d.pdiDrafts[id] = { status: 'draft', generatedAt: '24/10/2026', actions: actions.length ? actions : d.pdiDrafts[id]?.actions ?? [] }
      addAudit(d, 'Luana Thurow', 'Avaliações', 'Concluiu', `${e.name} · consenso`, '', `PDI gerado com ${actions.length} ações`)
      pushAlert(d, 'gestao', { cat: 'pdi', tone: 'green', title: `PDI de ${e.name} gerado do consenso`, text: 'Revise as ações e publique para a colaborador.', to: `/gestao/pdi/${id}`, cta: 'Revisar PDI' })
    }
  })
  const finish = () => { if (criteria.some((k) => !cons[k.id])) { toast('Defina o consenso de todos os critérios.'); return } persist(true); toast('Consenso concluído! PDI gerado.'); nav(`/gestao/pdi/${id}`) }
  return (
    <Page title="Consenso da avaliação" sub={`Ciclo 2026 · ${e.name}, ${roleName(db, e)} · reunião em 24/10/2026`}>
      <Stepper steps={[{ title: 'Autoavaliação', sub: `Enviada em ${fmtShort(TODAY)}`, state: 'done' }, { title: 'Avaliação da gestora', sub: `Enviada em ${fmtShort(TODAY)}`, state: 'done' }, { title: 'Consenso', sub: done ? 'Concluído' : 'Em andamento', state: done ? 'done' : 'now' }, { title: 'Novo PDI', sub: done ? 'Gerado' : 'Gerado ao concluir', state: done ? 'now' : 'todo' }]} />
      <div className="grid2" style={{ gridTemplateColumns: '1fr 388px', alignItems: 'start', gap: 20 }}>
        <Card>
          <div className="card-head"><h2 style={{ fontSize: 17 }}>Auto × gestora × consenso</h2><Pill tone="amber">{div.length} divergências</Pill></div>
          <table className="tbl"><thead><tr><th>Requisito</th><th>Auto</th><th>Gestora</th><th>Consenso</th></tr></thead></table>
          {['Conhecimentos', 'Habilidades', 'Atitudes'].map((grp) => <div key={grp}><div className="sec-label">{grp}</div>
            {criteria.filter((k) => k.group === grp).map((k) => <div key={k.id} className="row" style={{ padding: '10px 8px', borderBottom: '1px solid var(--line)', background: ev.auto[k.id] !== ev.gestora[k.id] ? '#fffaf0' : undefined, margin: '0 -8px' }}>
              <span style={{ flex: 1 }}>{k.label}</span><div style={{ width: 80 }}><LevelPill l={ev.auto[k.id] as Level} /></div><div style={{ width: 80 }}><LevelPill l={ev.gestora[k.id] as Level} /></div>
              <LevelPicker value={cons[k.id]} disabled={done} onChange={(l) => setCons({ ...cons, [k.id]: l })} /></div>)}</div>)}
          <div className="row" style={{ gap: 40, marginTop: 18 }}>{[['Pleno ou acima', cnt((l) => l === 'pleno' || l === 'supera')], ['Parcial', cnt((l) => l === 'parcial')], ['Não atende', cnt((l) => l === 'nao')]].map(([l, v]) => <div key={l as string}><div className="muted xs">{l}</div><b style={{ fontSize: 18 }}>{v} de 9</b></div>)}</div>
        </Card>
        <div className="stack">
          <Card><div className="card-head"><h2 style={{ fontSize: 17 }}>Sugestões para o novo PDI</h2><Pill tone="teal">automático</Pill></div>
            <p className="muted sm" style={{ marginBottom: 12 }}>Critérios marcados como “Parcial” ou “Não atende” no consenso, já com treinamentos da trilha:</p>
            <div className="stack-sm">{need.map((k) => { const c = course(db, MAP[k.id].courseId); return <label key={k.id} className="kv row" style={{ cursor: 'pointer' }}><div style={{ flex: 1 }}><b style={{ fontWeight: 500 }}>{k.label}</b><small style={{ margin: '2px 0 0' }}>{c.name} · {c.entity.split(' · ')[0]} · {c.hours}h</small></div><input type="checkbox" disabled={done} checked={!!sugg[k.id]} onChange={(x) => setSugg({ ...sugg, [k.id]: x.target.checked })} style={{ width: 18, height: 18, accentColor: 'var(--blue)' }} /></label> })}
              {!need.length && <div className="muted sm">Nenhuma sugestão: todos os critérios estão em “Pleno” ou acima.</div>}</div></Card>
          <Card><h2 style={{ fontSize: 17, marginBottom: 12 }}>Registro da reunião de consenso</h2><textarea className="textarea" rows={4} disabled={done} value={rec} onChange={(x) => setRec(x.target.value)} /></Card>
          <div className="btn-row">{done ? <Btn onClick={() => nav(`/gestao/pdi/${id}`)}>Ver PDI gerado</Btn> : <><Btn kind="outline" onClick={() => { persist(false); toast('Rascunho salvo.') }}>Salvar rascunho</Btn><Btn onClick={finish}>Concluir e gerar PDI</Btn></>}</div>
        </div>
      </div>
    </Page>
  )
}
