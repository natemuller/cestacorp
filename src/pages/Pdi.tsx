import { useState } from 'react'
import { Page } from '../components/Layout'
import { Avatar, Btn, Card, Field, LinkBtn, Modal, Pill, Progress, Select } from '../components/ui'
import { useMe } from '../lib/store'
import { addAudit, course } from '../lib/selectors'
import { TODAY, fmtDate } from '../lib/format'
import type { PdiAction } from '../lib/types'

const ST: Record<string, [string, string]> = { progress: ['Em andamento', ''], late: ['Atrasado', 'red'], done: ['Concluído', 'green'] }

export default function Pdi() {
  const { db, p, edit, toast, first, name: meName } = useMe()
  const me = p.self
  const pdi = p.pdi
  const [editGoals, setEditGoals] = useState(false)
  const [goals, setGoals] = useState(p.goals)
  const [modal, setModal] = useState<null | 'new' | 'track'>(null)
  const [nf, setNf] = useState({ what: '', how: '', due: '2027-01-31', courseId: '' })
  const [tf, setTf] = useState({ id: pdi.actions[0].id, pct: '75', note: '' })
  const done = pdi.actions.filter((a) => a.status === 'done').length
  const linked = pdi.actions.filter((a) => a.courseId)
  const linkedDone = linked.filter((a) => p.enrollments.find((e) => e.courseId === a.courseId)?.status === 'done').length
  const hrsAll = linked.reduce((s, a) => s + course(db, a.courseId!).hours, 0)
  const hrsDone = linked.filter((a) => p.enrollments.find((e) => e.courseId === a.courseId)?.status === 'done').reduce((s, a) => s + course(db, a.courseId!).hours, 0)

  const addAction = () => {
    if (!nf.what.trim()) { toast('Informe o que fazer.'); return }
    const a: PdiAction = { id: 'p' + Date.now(), what: nf.what, how: nf.how || '—', who: first, due: nf.due, courseId: nf.courseId || null, track: '0% concluído', trackNote: `Criado em ${fmtDate(TODAY).slice(0, 5)}`, status: 'progress' }
    edit((m, d) => { m.pdi.actions.push(a); addAudit(d, meName, 'PDI', 'Criou', `${meName} · ${a.what}`, '', `prazo ${fmtDate(a.due)}`) })
    setModal(null); setNf({ what: '', how: '', due: '2027-01-31', courseId: '' }); toast('Ação adicionada ao seu PDI.')
  }
  const addTrack = () => {
    edit((m, d) => { const a = m.pdi.actions.find((x) => x.id === tf.id)!; a.track = `${tf.pct}% concluído`; a.trackNote = `Atualizado em ${fmtDate(TODAY).slice(0, 5)} por ${first}${tf.note ? ` · ${tf.note}` : ''}`; if (a.status === 'late') a.status = 'progress'
      if (+tf.pct === 100) { a.status = 'done'; a.track = `Concluído em ${fmtDate(TODAY).slice(0, 5)}`; m.self.points += 50 }
      addAudit(d, meName, 'PDI', 'Editou', `${meName} · ${a.what}`, '', `${tf.pct}% concluído`) })
    setModal(null); toast(+tf.pct === 100 ? 'Ação concluída! +50 pontos.' : 'Acompanhamento registrado.')
  }
  const saveGoals = () => { edit((m) => { m.goals = goals }); setEditGoals(false); toast('Objetivos atualizados.') }

  return (
    <Page title="Meu Plano de Desenvolvimento Individual" sub={`PDI 2026 · gerado a partir da ${pdi.generatedFrom}`}>
      <Card className="row" style={{ gap: 24, padding: '18px 24px' }}>
        <Avatar name={me.name} size={44} />
        <div style={{ flex: 1 }}><b style={{ fontSize: 15 }}>{meName}</b><div className="muted sm">{p.roleName} · {p.self.id === 'ana' ? 'Gestora' : 'Responsável'}: {p.managerName} ({p.managerTitle})</div></div>
        <div><div className="muted xs">Vigência</div><b style={{ fontSize: 15 }}>{pdi.period}</b></div>
        <div><div className="muted xs">Ações</div><b style={{ fontSize: 15 }}>{pdi.actions.length} ({done} concluídas)</b></div>
        <div><div className="muted xs">Próximo acompanhamento</div><b style={{ fontSize: 15 }}>{fmtDate(pdi.next)}</b></div>
        <Pill>Em andamento</Pill>
      </Card>
      <div className="grid2" style={{ gridTemplateColumns: '1.45fr 1fr', alignItems: 'start', gap: 20 }}>
        <Card>
          <div className="card-head"><h2>Objetivos profissionais para os próximos 5 anos</h2><LinkBtn onClick={() => (editGoals ? saveGoals() : setEditGoals(true))}>{editGoals ? 'Salvar' : 'Editar'}</LinkBtn></div>
          {editGoals ? <textarea className="textarea" rows={3} value={goals} onChange={(e) => setGoals(e.target.value)} /> : <p style={{ lineHeight: 1.6 }}>“{p.goals}”</p>}
          <div className="row between" style={{ marginTop: 22, position: 'relative' }}>
            <div style={{ position: 'absolute', left: 10, right: 10, top: 6, height: 2, background: 'var(--line)' }} />
            {pdi.path.map((p, i) => (
              <div key={p.name} style={{ textAlign: 'center', position: 'relative', background: '#fff', padding: '0 8px' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', margin: '0 auto 6px', border: '2px solid #8e98d6', background: i === 0 ? 'var(--green)' : '#fff', borderColor: i === 0 ? 'var(--green)' : '#8e98d6' }} />
                <b style={{ fontSize: 12, fontWeight: 600 }}>{p.name}</b><div className="muted xs">{p.year}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 style={{ marginBottom: 12 }}>Cumprimento do PDI</h2>
          <div className="row" style={{ alignItems: 'baseline', gap: 8, marginBottom: 14 }}><b style={{ fontSize: 34, color: 'var(--blue)' }}>{Math.round((done / pdi.actions.length) * 100)}%</b><span className="muted sm">das ações concluídas</span></div>
          {[['Ações concluídas', `${done} de ${pdi.actions.length}`, (done / pdi.actions.length) * 100, 'blue'], ['Treinamentos do PDI', `${linkedDone} de ${linked.length}`, (linkedDone / linked.length) * 100, 'teal'], ['Horas do PDI', `${hrsDone}h de ${hrsAll}h`, (hrsDone / hrsAll) * 100, '']].map(([l, v, p, t]) => (
            <div key={l as string} style={{ marginBottom: 14 }}><div className="row between sm" style={{ marginBottom: 6 }}><span>{l}</span><b>{v}</b></div><Progress value={p as number} tone={t as string} /></div>
          ))}
        </Card>
      </div>
      <Card>
        <div className="card-head"><h2 style={{ fontSize: 17 }}>Ações de desenvolvimento</h2>
          <div className="row"><Btn kind="outline" onClick={() => setModal('track')}>Registrar acompanhamento</Btn><Btn onClick={() => setModal('new')}>+ Nova ação</Btn></div></div>
        <table className="tbl">
          <thead><tr><th>O que fazer / Como fazer</th><th>Responsável</th><th>Prazo</th><th>Treinamento vinculado</th><th>Acompanhamento</th><th>Status</th></tr></thead>
          <tbody>
            {pdi.actions.map((a) => { const c = a.courseId ? course(db, a.courseId) : null; const [lbl, tone] = ST[a.status ?? 'progress']; return (
              <tr key={a.id}>
                <td style={{ maxWidth: 270 }}><div className="t1" style={{ fontSize: 14 }}>{a.what}</div><div className="t2">{a.how}</div></td>
                <td>{a.who}</td><td>{fmtDate(a.due)}</td>
                <td>{c ? <><div className="t1">{c.name.length > 30 ? c.competence : c.name}</div><div className="t2">{c.entity.split(' · ')[0]} · {c.hours}h</div></> : <><div className="muted">—</div><div className="t2">Sem treinamento vinculado</div></>}</td>
                <td><div className="t1">{a.track}</div><div className="t2">{a.trackNote}</div></td>
                <td><Pill tone={tone}>{lbl}</Pill></td>
              </tr>) })}
          </tbody>
        </table>
      </Card>
      {modal === 'new' && (
        <Modal title="Nova ação de desenvolvimento" onClose={() => setModal(null)} actions={<><Btn kind="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={addAction}>Adicionar ação</Btn></>}>
          <Field label="O que fazer"><input className="input" value={nf.what} onChange={(e) => setNf({ ...nf, what: e.target.value })} autoFocus /></Field>
          <Field label="Como fazer"><textarea className="textarea" value={nf.how} onChange={(e) => setNf({ ...nf, how: e.target.value })} /></Field>
          <div className="grid2"><Field label="Prazo"><input className="input" type="date" value={nf.due} onChange={(e) => setNf({ ...nf, due: e.target.value })} /></Field>
            <Field label="Treinamento vinculado"><Select value={nf.courseId} onChange={(v) => setNf({ ...nf, courseId: v })} options={[{ value: '', label: 'Sem vínculo' }, ...db.courses.slice(0, 22).map((c) => ({ value: c.id, label: c.name.slice(0, 40) }))]} /></Field></div>
        </Modal>
      )}
      {modal === 'track' && (
        <Modal title="Registrar acompanhamento" sub="Atualize o andamento de uma ação do PDI." onClose={() => setModal(null)} actions={<><Btn kind="ghost" onClick={() => setModal(null)}>Cancelar</Btn><Btn onClick={addTrack}>Registrar</Btn></>}>
          <Field label="Ação"><Select value={tf.id} onChange={(v) => setTf({ ...tf, id: v })} options={pdi.actions.filter((a) => a.status !== 'done').map((a) => ({ value: a.id, label: a.what }))} /></Field>
          <Field label="Percentual concluído"><Select value={tf.pct} onChange={(v) => setTf({ ...tf, pct: v })} options={['25', '50', '75', '100'].map((v) => ({ value: v, label: `${v}%` }))} /></Field>
          <Field label="Observação"><textarea className="textarea" value={tf.note} onChange={(e) => setTf({ ...tf, note: e.target.value })} placeholder="Ex.: concluí o módulo 2" /></Field>
        </Modal>
      )}
    </Page>
  )
}
