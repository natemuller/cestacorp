import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Page } from '../components/Layout'
import { Btn, Card, Field, Pill, Select } from '../components/ui'
import { useStore } from '../lib/store'
import { addAudit, course, pushAlert } from '../lib/selectors'
import { TODAY, addDays, fmtDate } from '../lib/format'

const AREAS = ['Fiscal', 'Contábil', 'Pessoal', 'Atendimento', 'Controles Internos']
export default function NovoColaborador() {
  const { db, update, toast } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', area: 'Contábil', roleId: 'contabil-estag', date: TODAY, modality: 'Híbrido', profile: 'Colaborador' })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const roles = db.roles.filter((r) => r.area === f.area)
  const role = db.roles.find((r) => r.id === f.roleId) ?? roles[0]
  const links = db.trackLinks.filter((l) => l.roleId === role?.id && l.mandatory)
  const hrs = links.reduce((s, l) => s + course(db, l.courseId).hours, 0)
  const who = f.name.trim() || 'o novo colaborador'
  const set = (k: string, v: string) => { setF((x) => ({ ...x, [k]: v })); setErrs((e) => ({ ...e, [k]: '' })) }
  const changeArea = (a: string) => { const r = db.roles.find((x) => x.area === a); setF((x) => ({ ...x, area: a, roleId: r?.id ?? '' })) }
  const submit = () => {
    const e: Record<string, string> = {}
    if (f.name.trim().length < 3) e.name = 'Informe o nome completo.'
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Informe um e-mail válido.'
    if (db.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase())) e.email = 'Já existe um usuário com este e-mail.'
    setErrs(e)
    if (Object.keys(e).length) return
    const id = f.name.trim().split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + Date.now() % 1000
    update((d) => {
      d.employees.unshift({ id, name: f.name.trim(), email: f.email, roleId: role!.id, area: f.area, admission: f.date, status: 'onboarding', modality: f.modality, points: 0, trailPct: 0, pdiPct: null, hours: 0, trainings: 0, phone: '—', birth: '2000-01-01', education: '—' })
      d.users.push({ id, name: f.name.trim(), email: f.email, profile: f.profile === 'Gestão' ? 'gestao' : 'colaborador', lastAccess: '—', status: 'invited' })
      d.feedback[id] = { stage: 25, scores: { adapt: 0, tasks: 0, tools: 0 }, strengths: '', develop: '', agreed: '', employeeView: '', done: false }
      addAudit(d, 'Luana Thurow', 'Colaboradores', 'Criou', f.name.trim(), '', `onboarding com ${links.length} cursos`)
      pushAlert(d, 'gestao', { cat: 'trein', tone: 'green', title: `Onboarding de ${f.name.trim()} criado`, text: 'Convite enviado e feedbacks 25/50/75 agendados.', to: '/gestao/colaboradores' })
    })
    toast(`${f.name.trim()} admitido(a). Convite enviado para ${f.email}.`); nav('/gestao/colaboradores')
  }
  return (
    <Page title="Novo colaborador" sub={<><Link to="/gestao/colaboradores">Colaboradores</Link> › Admissão · o sistema monta o onboarding automaticamente a partir do cargo</>}>
      <div className="grid2" style={{ gridTemplateColumns: '1fr 548px', alignItems: 'start', gap: 20 }}>
        <Card>
          <div className="card-head"><h2 style={{ fontSize: 17 }}>Dados da admissão</h2><button className="link" onClick={() => setF({ name: 'Pedro Almeida', email: 'pedro.almeida@cestacorp.com.br', area: 'Fiscal', roleId: 'fiscal-estag', date: TODAY, modality: 'Presencial', profile: 'Colaborador' })}>Preencher exemplo</button></div>
          <div className="stack-sm" style={{ gap: 16 }}>
            <Field label="Nome completo" error={errs.name}><input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Maria Oliveira" /></Field>
            <Field label="E-mail corporativo" error={errs.email}><input className="input" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="nome.sobrenome@cestacorp.com.br" /></Field>
            <div className="grid2"><Field label="Área"><Select value={f.area} onChange={changeArea} options={AREAS} /></Field><Field label="Cargo"><Select value={f.roleId} onChange={(v) => set('roleId', v)} options={roles.map((r) => ({ value: r.id, label: r.name }))} /></Field></div>
            <div className="grid2"><Field label="Gestora responsável"><Select value="Luana Thurow" onChange={() => 0} options={['Luana Thurow', 'Patrick Dartora']} /></Field><Field label="Data de admissão"><input className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field></div>
            <div><div className="lbl">Modalidade de trabalho</div><div className="tabs">{['Presencial', 'Híbrido', 'Home office'].map((m) => <button key={m} className={f.modality === m ? 'on' : ''} onClick={() => set('modality', m)}>{m}</button>)}</div></div>
            <div><div className="lbl">Perfil de acesso</div><div className="tabs">{['Colaborador', 'Gestão'].map((m) => <button key={m} className={f.profile === m ? 'on' : ''} onClick={() => set('profile', m)}>{m}</button>)}</div></div>
            <div className="note">Um convite será enviado para o e-mail corporativo para a pessoa criar a senha no primeiro acesso.</div>
          </div>
        </Card>
        <div className="stack-sm" style={{ gap: 16 }}>
          <div className="card" style={{ background: 'var(--blue)', color: '#fff', border: 0 }}><h2 style={{ fontSize: 17 }}>Onboarding automático</h2><p className="sm" style={{ opacity: .85, marginTop: 6 }}>Ao admitir, o sistema cria tudo abaixo para {who} com base no cargo {role?.name}.</p></div>
          <Card><div className="card-head"><h2 style={{ fontSize: 16 }}>Trilha obrigatória do cargo</h2><Pill tone="green">{links.length} cursos · {hrs}h</Pill></div>
            {links.slice(0, 3).map((l, i) => { const c = course(db, l.courseId); return <div key={l.courseId} className="row" style={{ alignItems: 'flex-start', padding: '6px 0' }}><Check size={15} color="#2f7a12" /><div><div style={{ fontWeight: 500, fontSize: 13 }}>{i === 2 ? `+ ${links.length - 2} cursos da trilha ${role?.name}` : c.name}</div><div className="muted xs">{i === 2 ? 'Visíveis em “Minha Trilha” no primeiro acesso' : l.rule}</div></div></div> })}</Card>
          <Card><div className="card-head"><h2 style={{ fontSize: 16 }}>Treinamentos de integração</h2><Pill tone="green">4 itens · 1ª semana</Pill></div>
            {[['NR-01 Integração · HUBLX · Google Workspace', `Prazo: ${fmtDate(addDays(f.date, 7))}`], ['Apresentação da Cestacorp e do ecossistema', 'Presencial com a gestora']].map(([t, s]) => <div key={t} className="row" style={{ alignItems: 'flex-start', padding: '6px 0' }}><Check size={15} color="#2f7a12" /><div><div style={{ fontWeight: 500, fontSize: 13 }}>{t}</div><div className="muted xs">{s}</div></div></div>)}</Card>
          <Card><div className="card-head"><h2 style={{ fontSize: 16 }}>PDI inicial</h2><Pill tone="green">modelo do cargo</Pill></div><div className="row" style={{ alignItems: 'flex-start' }}><Check size={15} color="#2f7a12" /><div><div style={{ fontWeight: 500, fontSize: 13 }}>3 ações de desenvolvimento sugeridas</div><div className="muted xs">A gestora revisa no feedback de 75 dias</div></div></div></Card>
          <Card><div className="card-head"><h2 style={{ fontSize: 16 }}>Feedbacks de integração agendados</h2><Pill tone="teal">notificação automática</Pill></div>
            <div className="row between" style={{ position: 'relative', padding: '4px 0' }}>
              <div style={{ position: 'absolute', left: 8, right: 8, top: 11, height: 2, background: 'var(--line)' }} />
              {[25, 50, 75].map((n) => <div key={n} style={{ textAlign: n === 50 ? 'center' : n === 25 ? 'left' : 'right', position: 'relative', background: '#fff', padding: '0 4px' }}><div style={{ width: 14, height: 14, background: 'var(--teal)', borderRadius: '50%', margin: n === 50 ? '0 auto' : n === 75 ? '0 0 0 auto' : 0 }} /><b style={{ display: 'block', fontSize: 12, marginTop: 4 }}>{n} dias</b><span className="muted xs">{fmtDate(addDays(f.date, n))}</span></div>)}
            </div><p className="muted xs" style={{ marginTop: 10 }}>Gestora e colaborador recebem o lembrete 3 dias antes de cada data.</p></Card>
          <div className="btn-row"><Btn kind="ghost" onClick={() => nav('/gestao/colaboradores')}>Cancelar</Btn><Btn onClick={submit}>Admitir e enviar convite</Btn></div>
        </div>
      </div>
    </Page>
  )
}
