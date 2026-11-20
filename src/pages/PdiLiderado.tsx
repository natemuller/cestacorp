import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { Page } from '../components/Layout'
import { Avatar, Btn, Card, Field, Modal, Pill, Select } from '../components/ui'
import { useStore } from '../lib/store'
import { addAudit, course, emp, pushAlert, roleName } from '../lib/selectors'
import { fmtDate } from '../lib/format'
import type { PdiAction } from '../lib/types'

export default function PdiLiderado() {
  const { id = '' } = useParams()
  const { db, update, toast } = useStore()
  const e = emp(db, id)
  const draft = db.pdiDrafts[id]
  const [selId, setSelId] = useState<string | null>(draft?.actions[0]?.id ?? null)
  const [pick, setPick] = useState(false)
  if (!e) return <Page title="PDI"><Card>Colaborador não encontrado.</Card></Page>
  if (!draft) return (
    <Page title={`PDI · ${e.name}`} sub={<><Link to="/gestao/colaboradores">Colaboradores</Link> › {e.name}</>}>
      <Card className="empty"><p style={{ marginBottom: 14 }}>{e.name} ainda não tem PDI 2026–2027. Ele é gerado ao concluir o consenso da avaliação, ou você pode criar manualmente.</p>
        <Btn onClick={() => { update((d) => { d.pdiDrafts[id] = { status: 'draft', generatedAt: '—', actions: [] } }); toast('PDI criado como rascunho.') }}>Criar PDI</Btn></Card>
    </Page>
  )
  const sel = draft.actions.find((a) => a.id === selId) ?? null
  const patch = (fn: (a: PdiAction) => void) => update((d) => { const a = d.pdiDrafts[id].actions.find((x) => x.id === selId); if (a) fn(a) })
  const add = () => { const nid = 'n' + Date.now(); update((d) => { d.pdiDrafts[id].actions.push({ id: nid, what: 'Nova ação', how: '', who: e.name.split(' ')[0], due: '2027-03-31', courseId: null, follow: 'Mensal' }) }); setSelId(nid) }
  const remove = () => { update((d) => { d.pdiDrafts[id].actions = d.pdiDrafts[id].actions.filter((a) => a.id !== selId) }); setSelId(draft.actions.find((a) => a.id !== selId)?.id ?? null); toast('Ação removida do rascunho.') }
  const publish = () => {
    update((d) => { d.pdiDrafts[id].status = 'published'; d.cycleRows[id] && (d.cycleRows[id].pdi = 'done'); d.cycleStages[3].done += 1
      addAudit(d, 'Luana Thurow', 'PDI', 'Publicou', `${e.name} · PDI 2026–2027`, 'Rascunho', 'Publicado')
      if (id === 'ana') pushAlert(d, 'colaborador', { cat: 'pdi', tone: 'teal', title: 'Seu novo PDI 2026–2027 foi publicado', text: 'Luana publicou as ações geradas a partir da sua avaliação.', to: '/pdi', cta: 'Ver PDI' }) })
    toast(`PDI publicado para ${e.name.split(' ')[0]}.`)
  }
  const pub = draft.status === 'published'
  return (
    <Page title={`PDI · ${e.name}`} sub={<><Link to="/gestao/colaboradores">Colaboradores</Link> › <Link to={`/gestao/colaboradores/${id}`}>{e.name}</Link> › Plano de Desenvolvimento Individual 2026–2027</>}>
      <div className="grid2" style={{ gridTemplateColumns: '1fr 428px', alignItems: 'start', gap: 20 }}>
        <div className="stack">
          <Card className="row" style={{ padding: '16px 20px' }}><Avatar name={e.name} size={40} /><div style={{ flex: 1 }}><b style={{ fontSize: 15 }}>{e.name}</b><div className="muted sm">{roleName(db, e)} · gerado do consenso de {draft.generatedAt}</div></div><Pill tone={pub ? 'green' : 'amber'}>{pub ? 'Publicado' : 'Rascunho'}</Pill></Card>
          <Card>
            <div className="card-head"><h2 style={{ fontSize: 17 }}>Ações de desenvolvimento</h2><Btn onClick={add}>+ Nova ação</Btn></div>
            <div className="stack-sm" style={{ gap: 6 }}>
              {draft.actions.map((a) => { const c = a.courseId ? course(db, a.courseId) : null; return (
                <div key={a.id} onClick={() => setSelId(a.id)} className="clickable" style={{ padding: 14, borderRadius: 10, border: a.id === selId ? '1.5px solid var(--blue)' : '1px solid var(--line)', background: a.id === selId ? 'var(--blue-soft)' : '#fff' }}>
                  <div className="row between"><b style={{ fontSize: 14 }}>{a.what}</b><Pill tone="teal">{pub ? 'Publicada' : 'Nova'}</Pill></div>
                  <div className="muted sm" style={{ margin: '4px 0' }}>{a.how}</div>
                  <div className="xs row" style={{ gap: 14 }}><span>Responsável: {a.who}</span><span>Prazo: {fmtDate(a.due)}</span><span style={{ color: c ? 'var(--teal)' : 'var(--muted)' }}>▸ {c ? `${c.name.length > 28 ? c.competence : c.name} · ${c.entity.split(' · ')[0]}` : 'Sem treinamento vinculado'}</span></div>
                </div>) })}
              {!draft.actions.length && <div className="empty">Nenhuma ação. Clique em “+ Nova ação”.</div>}
            </div>
          </Card>
          <div className="btn-row"><Btn kind="outline" onClick={() => toast('Rascunho salvo.')}>Salvar rascunho</Btn><Btn disabled={pub || !draft.actions.length} onClick={publish}>{pub ? 'PDI já publicado' : 'Publicar PDI para a colaborador'}</Btn></div>
        </div>
        {sel ? (
          <div className="card" style={{ borderColor: 'var(--blue)' }}>
            <div className="card-head"><h2 style={{ fontSize: 17 }}>Editar ação do PDI</h2><button className="link" onClick={() => setSelId(null)} aria-label="Fechar"><X size={18} /></button></div>
            <div className="stack-sm" style={{ gap: 14 }}>
              <Field label="O que fazer"><input className="input" value={sel.what} onChange={(x) => patch((a) => (a.what = x.target.value))} /></Field>
              <Field label="Como fazer"><textarea className="textarea" rows={3} value={sel.how} onChange={(x) => patch((a) => (a.how = x.target.value))} /></Field>
              <div className="grid2"><Field label="Responsável"><Select value={sel.who} onChange={(v) => patch((a) => (a.who = v))} options={Array.from(new Set([sel.who, e.name.split(' ')[0], `${e.name.split(' ')[0]} + Luana`, 'Luana']))} /></Field><Field label="Prazo"><input className="input" type="date" value={sel.due} onChange={(x) => patch((a) => (a.due = x.target.value))} /></Field></div>
              <div><div className="lbl">Treinamento vinculado</div>
                <div className="row between" style={{ background: 'var(--teal-soft)', borderRadius: 10, padding: '12px 14px' }}>
                  {sel.courseId ? <div><b style={{ fontSize: 13 }}>{course(db, sel.courseId).name}</b><div className="muted xs">{course(db, sel.courseId).entity} · {course(db, sel.courseId).modality} · {course(db, sel.courseId).hours}h · R$ {course(db, sel.courseId).value}</div></div> : <span className="muted sm">Nenhum treinamento vinculado</span>}
                  <button className="link" onClick={() => setPick(true)}>{sel.courseId ? 'Trocar' : 'Vincular'}</button></div>
                <p className="muted xs" style={{ marginTop: 8 }}>O treinamento entra na trilha da {e.name.split(' ')[0]} com origem “PDI” e conta para o % de cumprimento do PDI.</p></div>
              <Field label="Acompanhamento"><Select value={sel.follow ?? 'Mensal'} onChange={(v) => patch((a) => (a.follow = v))} options={Array.from(new Set([sel.follow ?? 'Mensal', 'Mensal', 'Quinzenal', 'Trimestral']))} /></Field>
              <div className="btn-row"><Btn kind="danger" onClick={remove}>Remover</Btn><Btn onClick={() => { toast('Ação salva no rascunho.'); setSelId(null) }}>Salvar ação</Btn></div>
            </div>
          </div>
        ) : <Card className="empty">Selecione uma ação para editar.</Card>}
      </div>
      {pick && <Modal title="Vincular treinamento" onClose={() => setPick(false)}>
        <div style={{ maxHeight: 340, overflow: 'auto' }}>{db.courses.map((c) => <button key={c.id} className="career-item" style={{ marginBottom: 6 }} onClick={() => { patch((a) => (a.courseId = c.id)); setPick(false) }}><span>{c.name}</span><small>{c.entity.split(' · ')[0]} · {c.hours}h</small></button>)}</div></Modal>}
    </Page>
  )
}
