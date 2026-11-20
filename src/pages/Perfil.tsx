import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Btn, Card, Field, LinkBtn, Modal, Pill, Progress } from '../components/ui'
import { useMe, useStore } from '../lib/store'
import { mineOf } from '../lib/personal'
import { addAudit, doneTrail, emp, role, trailItems, statusOf } from '../lib/selectors'
import { fmtDate, tenureLong, initials } from '../lib/format'

export default function Perfil() {
  const { id } = useParams()
  const { session } = useStore()
  const { db, p, id: ME, edit, toast } = useMe()
  const nav = useNavigate()
  const empId = id ?? ME
  const sp = empId === ME ? p : empId === 'ana' ? mineOf(db, 'ana') : null
  const e = sp ? sp.self : emp(db, empId)
  const [editing, setEdit] = useState(false)
  const [f, setF] = useState(p.profileExtra)
  if (!e) return <Page title="Perfil"><Card>Colaborador não encontrado.</Card></Page>
  const isAna = !!sp // temos dados detalhados (Natan ou a própria gestora)
  const own = !id
  const g = session?.profile === 'gestao' && !!id
  const r = role(db, e.roleId) ?? { name: sp!.roleName }
  const done = isAna ? doneTrail(sp!) : Math.round((e.trailPct / 100) * 18)
  const total = isAna ? trailItems(sp!).length : 18
  const pend = isAna ? sp!.enrollments.filter((x) => x.origin === 'Trilha' && ['todo', 'inprogress'].includes(statusOf(x))).length : Math.max(0, total - done - (e.trailPct < 60 ? 3 : 0))
  const venc = isAna ? sp!.enrollments.filter((x) => statusOf(x) === 'overdue').length : e.trailPct < 60 ? 3 : 0
  const cyc = isAna ? sp!.cycle : db.cycleRows[e.id]
  const cycLabel = !cyc ? 'Não iniciado' : cyc.consenso === 'done' ? 'Concluído' : cyc.auto === 'draft' ? 'Autoavaliação em andamento' : cyc.gestora === 'progress' ? 'Avaliação da gestora em andamento' : 'Em andamento'
  const gotPins = sp!.pins.filter((x) => x.got)
  const sub = `${r.name} · ${e.area} · ${isAna ? (e.id === 'ana' ? 'gestora' : 'responsável') : 'gestora'}: ${isAna ? sp!.managerName : 'Luana Thurow'}`
  const modality = isAna ? sp!.profileExtra.modality : e.modality
  const save = () => { edit((m, d) => { m.profileExtra = f; addAudit(d, e.name, 'Colaboradores', 'Editou', `${e.name} · dados pessoais`, '', 'contato atualizado') }); setEdit(false); toast('Dados pessoais atualizados.') }
  const hist = isAna ? sp!.history : [[e.admission, `Admissão como ${r.name}`, e.status === 'onboarding' ? 'Onboarding em andamento' : 'Onboarding concluído', 'green']]
  return (
    <Page title={g ? `Perfil · ${e.name}` : 'Meu perfil'} sub={g ? 'Visão da gestão sobre o colaborador' : 'Seus dados, tempo de empresa e um resumo da sua evolução'}>
      <div className="hero-card">
        <span className="avatar" style={{ width: 72, height: 72, fontSize: 26, border: '0' }}>{initials(e.name)}</span>
        <div><h2 style={{ fontSize: 24 }}>{e.name}</h2><p style={{ opacity: .85, marginTop: 4 }}>{sub}</p></div>
        <div className="stats">
          <div><small>Tempo de empresa</small><b>{tenureLong(e.admission)}</b></div><div><small>Admissão</small><b>{fmtDate(e.admission)}</b></div><div><small>Pontos</small><b>{e.points.toLocaleString('pt-BR')}</b></div>
        </div>
      </div>
      {g && <div className="btn-row" style={{ justifyContent: 'flex-start' }}>
        <Btn kind="outline" onClick={() => nav(`/gestao/pdi/${e.id}`)}>Ver PDI</Btn>
        {e.status === 'onboarding' && <Btn kind="outline" onClick={() => nav(`/gestao/feedback/${e.id}`)}>Feedback de integração</Btn>}
        <Btn kind="ghost" onClick={() => nav(`/gestao/avaliacao/${e.id}`)}>Avaliação de desempenho</Btn>
        <Btn kind="ghost" onClick={() => nav('/gestao/colaboradores')}>Voltar à lista</Btn>
      </div>}
      <div className="grid3" style={{ gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'start', gap: 20 }}>
        <Card style={{ gridRow: 'span 2' }}>
          <div className="card-head"><h2 style={{ fontSize: 17 }}>Dados pessoais</h2>{own && <LinkBtn onClick={() => { setF(p.profileExtra); setEdit(true) }}>Editar</LinkBtn>}</div>
          <div className="divider-list">
            {[['E-mail', e.email], ['Telefone', isAna ? sp!.profileExtra.phone : e.phone], ['Modalidade', modality], ['Data de nascimento', fmtDate(e.birth)], ['Formação', isAna ? sp!.profileExtra.education : e.education], ['Área', e.area]].map(([l, v]) => <div key={l}><div className="muted xs">{l}</div><b style={{ fontWeight: 500, fontSize: 14 }}>{v}</b></div>)}
          </div>
        </Card>
        <Card>
          <div className="card-head"><h2 style={{ fontSize: 17 }}>Treinamentos</h2>{own && <LinkBtn onClick={() => nav('/trilha')}>Minha trilha</LinkBtn>}</div>
          <div className="row" style={{ gap: 28 }}>{[['Realizados', done, ''], ['Pendentes', pend, ''], ['Vencidos', venc, 'var(--red)']].map(([l, v, c]) => <div key={l as string}><div className="muted xs">{l}</div><b style={{ fontSize: 24, color: (c as string) || undefined }}>{v}</b></div>)}</div>
          <div style={{ margin: '14px 0 8px' }}><Progress value={e.trailPct} /></div><p className="muted xs">{e.trailPct}% da trilha obrigatória · {e.hours}h em 2026</p>
        </Card>
        <Card>
          <div className="card-head"><h2 style={{ fontSize: 17 }}>Avaliações</h2>{own && <LinkBtn onClick={() => nav('/avaliacoes')}>Ver histórico</LinkBtn>}</div>
          <div className="stack-sm"><div className="kv"><b>Ciclo 2026</b><div className="muted xs">{cycLabel}</div></div><div className="kv"><b>Ciclo 2025</b><div className="muted xs">Pleno em 6 de 9 critérios</div></div></div>
        </Card>
        <Card style={{ gridColumn: 'span 2' }}>
          <h2 style={{ fontSize: 17, marginBottom: 14 }}>Histórico na Cestacorp</h2>
          <div className="timeline">{hist.map(([d, t, s, c]) => <div key={t} className={`ev ${c}`}><div className="muted xs">{fmtDate(d)}</div><b style={{ fontSize: 14 }}>{t}</b><div className="muted xs">{s}</div></div>)}</div>
        </Card>
      </div>
      {isAna && <Card><div className="card-head"><h2 style={{ fontSize: 17 }}>Pins conquistados</h2>{own && <LinkBtn onClick={() => nav('/ranking')}>Ranking & Pins</LinkBtn>}</div><div className="row">{gotPins.map((p) => <Pill key={p.id} tone="green">● {p.name}</Pill>)}</div></Card>}
      {editing && <Modal title="Editar dados pessoais" onClose={() => setEdit(false)} actions={<><Btn kind="ghost" onClick={() => setEdit(false)}>Cancelar</Btn><Btn onClick={save}>Salvar</Btn></>}>
        <Field label="Telefone"><input className="input" value={f.phone} onChange={(x) => setF({ ...f, phone: x.target.value })} /></Field>
        <Field label="Modalidade"><input className="input" value={f.modality} onChange={(x) => setF({ ...f, modality: x.target.value })} /></Field>
        <Field label="Formação"><input className="input" value={f.education} onChange={(x) => setF({ ...f, education: x.target.value })} /></Field>
      </Modal>}
    </Page>
  )
}
