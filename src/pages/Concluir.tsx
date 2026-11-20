import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Calendar, FileText, Upload } from 'lucide-react'
import { Page } from '../components/Layout'
import { Btn, Card, Field, Pill, Scale } from '../components/ui'
import { useStore } from '../lib/store'
import { ME, addAudit, pushAlert, trailPct, doneTrail, trailItems } from '../lib/selectors'
import { MONTHS, TODAY, addMonths, brl, fmtDate } from '../lib/format'

const QUAL = [['content', 'Conteúdo e material'], ['teacher', 'Instrutor / plataforma'], ['load', 'Carga horária adequada'], ['org', 'Organização do curso']] as const

export default function Concluir() {
  const { courseId } = useParams()
  const { db, update, toast } = useStore()
  const nav = useNavigate()
  const c = db.courses.find((x) => x.id === courseId)
  const enr = db.enrollments.find((x) => x.courseId === courseId)
  const fileRef = useRef<HTMLInputElement>(null)
  const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g, '').trim().replace(/\s+/g, '_')
  const slug = `${norm((c?.name ?? 'curso').split(' ').slice(0, 2).join(' '))}_${norm((c?.entity ?? '').split(' ')[0])}`
  const [date, setDate] = useState(TODAY)
  const [code, setCode] = useState(`${(c?.entity ?? 'CESTA').split(' ')[0].toUpperCase()}-2026-40${String(courseId?.replace('c', '') ?? '24').padStart(2, '0')}-88172`)
  const [file, setFile] = useState<{ name: string; size: string } | null>({ name: `certificado_${slug}.pdf`, size: '412 KB' })
  const [report, setReport] = useState('O curso abordou clareza na escrita de e-mails a clientes, revisão gramatical e linguagem corporal em reuniões. Vou aplicar nos retornos sobre apuração de impostos enviados pelo HUBLX.')
  const [q, setQ] = useState<Record<string, number>>({ content: 4, teacher: 5, load: 3, org: 4 })
  const [eff, setEff] = useState(4)
  const [ex, setEx] = useState('Revisar o modelo de e-mail de envio das guias mensais antes de enviar aos clientes.')
  const [errs, setErrs] = useState<Record<string, string>>({})
  if (!c || !enr || enr.origin !== 'Trilha') return <Navigate to="/trilha" replace />

  const valid = addMonths(date, 24)
  const before = trailPct(db), after = Math.round(((doneTrail(db) + (enr.status === 'done' || enr.status === 'validating' ? 0 : 1)) / trailItems(db).length) * 100)
  const monthRef = `${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'][+date.slice(5, 7) - 1]}/${date.slice(0, 4)}`

  const submit = () => {
    const e: Record<string, string> = {}
    if (!code.trim()) e.code = 'Informe o código do certificado.'
    if (!file) e.file = 'Anexe o certificado ou comprovante.'
    if (report.trim().length < 20) e.report = 'Escreva um resumo do aprendizado (mín. 20 caracteres).'
    setErrs(e)
    if (Object.keys(e).length) { toast('Revise os campos destacados.'); return }
    update((d) => {
      const en = d.enrollments.find((x) => x.courseId === courseId)!
      en.status = 'validating'; en.doneAt = date
      const fresh = { id: 'cert' + Date.now(), ownerId: ME, title: c.name, ext: file!.name.split('.').pop() ?? 'pdf', size: file!.size, source: c.entity, code, issued: date, expires: valid, status: 'validating' as const, courseId: c.id }
      const old = d.certificates.findIndex((x) => x.courseId === c.id && x.ownerId === ME)
      if (old >= 0) d.certificates[old] = { ...fresh, id: d.certificates[old].id }; else d.certificates.unshift(fresh)
      d.employees.find((x) => x.id === ME)!.points += 30
      d.hoursByMonth[9] += c.hours
      const act = d.pdi.actions.find((a) => a.courseId === c.id)
      if (act) { act.track = 'Certificado em validação'; act.trackNote = `Enviado em ${fmtDate(date).slice(0, 5)}` }
      addAudit(d, 'Natan Muller', 'Trilha', 'Enviou', `${c.name} · conclusão`, '', `certificado + avaliação ${Math.round(Object.values(q).reduce((a, b) => a + b, 0) / 4)}/5`)
      pushAlert(d, 'gestao', { cat: 'cert', tone: 'teal', title: `Natan Muller enviou ${c.name} para validação`, text: 'Certificado aguardando validação da gestão.', to: '/gestao/auditoria', cta: 'Ver auditoria' })
      if (!d.pins.find((p) => p.id === 'trilha100')!.got && doneTrail(db) + 1 >= trailItems(db).length) d.pins.find((p) => p.id === 'trilha100')!.got = true
    })
    toast(`Conclusão enviada para validação da gestora. +30 pontos!`)
    nav('/trilha')
  }

  return (
    <Page title="Registrar conclusão do treinamento" sub={<><Link to="/trilha">Minha Trilha</Link> › {c.name}</>}>
      <div className="grid2" style={{ gridTemplateColumns: '1.1fr 1fr', alignItems: 'start', gap: 20 }}>
        <div className="stack">
          <Card>
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <span className="avatar soft" style={{ width: 44, height: 44, borderRadius: 10 }}><FileText size={20} /></span>
              <div style={{ flex: 1 }}><h2 style={{ fontSize: 18 }}>{c.name}</h2><p className="muted sm">Competência: {c.competence} · Trilha obrigatória do cargo</p></div>
              <Pill>{enr.status === 'overdue' || enr.due < TODAY ? 'Vencido' : 'Em andamento'}</Pill>
            </div>
            <div className="grid2" style={{ marginTop: 18, rowGap: 14 }}>
              {[['Entidade / Local', c.entity.split(' · ')[0]], ['Modalidade', c.modality === 'Online' ? 'Online (EAD)' : c.modality], ['Carga horária', `${c.hours} horas`], ['Investimento', brl(c.value) + ',00'], ['Prazo previsto', fmtDate(enr.due)]].map(([l, v]) => <div key={l}><div className="muted xs">{l}</div><b style={{ fontWeight: 500 }}>{v}</b></div>)}
              <div><div className="muted xs">Link</div><a href="#" onClick={(e) => { e.preventDefault(); toast('Link do curso (simulado).') }} style={{ color: 'var(--blue)', fontWeight: 500 }}>{c.site}/curso/…/4024</a></div>
            </div>
          </Card>
          <Card>
            <div className="card-head"><h2 style={{ fontSize: 17 }}>Comprovação</h2><Pill tone="amber">Obrigatório</Pill></div>
            <div className="grid3">
              <Field label="Data de realização"><div style={{ position: 'relative' }}><input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /><Calendar size={0} /></div></Field>
              <Field label="Mês de referência"><div className="ro">{monthRef} (automático)</div></Field>
              <Field label="Validade do certificado"><div className="ro">{fmtDate(valid)} (24 meses)</div></Field>
            </div>
            <div style={{ marginTop: 14 }}><Field label="Código do certificado" error={errs.code}><input className="input" value={code} onChange={(e) => setCode(e.target.value)} /></Field></div>
            <div style={{ marginTop: 14 }}>
              <div className="dropzone" onClick={() => fileRef.current?.click()} role="button" tabIndex={0}>
                <Upload size={22} color="#8e98d6" /><p style={{ fontWeight: 500, marginTop: 8 }}>Arraste o certificado aqui ou clique para enviar</p>
                <p className="muted xs">PDF, JPG ou PNG · até 10 MB · vai para sua biblioteca de evidências</p>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile({ name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB` }) }} />
              </div>
              {errs.file && <div className="field error"><div className="err">{errs.file}</div></div>}
              {file && <div className="file-row" style={{ marginTop: 12 }}><FileText size={18} color="#4f9a2d" /><div style={{ flex: 1 }}><b style={{ fontWeight: 500, fontSize: 12 }}>{file.name}</b><div className="muted xs">{file.size} · enviado agora</div></div><button className="link danger" onClick={() => setFile(null)}>Remover</button></div>}
            </div>
            <div style={{ marginTop: 14 }}><Field label="Relatório com resumo do aprendizado" error={errs.report}><textarea className="textarea" rows={4} value={report} onChange={(e) => setReport(e.target.value)} /></Field></div>
          </Card>
        </div>
        <div className="stack">
          <Card>
            <div className="card-head"><h2 style={{ fontSize: 17 }}>Avaliação da qualidade</h2><span className="muted xs">1 = ruim · 5 = excelente</span></div>
            <div className="stack-sm">{QUAL.map(([k, l]) => <div key={k} className="row between"><span>{l}</span><Scale value={q[k]} onChange={(v) => setQ({ ...q, [k]: v })} /></div>)}</div>
          </Card>
          <Card>
            <h2 style={{ fontSize: 17, marginBottom: 14 }}>Avaliação da eficácia</h2>
            <p style={{ marginBottom: 10 }}>Quanto consegue aplicar no seu trabalho?</p>
            <Scale value={eff} onChange={setEff} />
            <div className="lbl" style={{ marginTop: 16 }}>Exemplo de aplicação prática</div>
            <textarea className="textarea" rows={3} value={ex} onChange={(e) => setEx(e.target.value)} />
            <div className="note" style={{ marginTop: 12, background: 'var(--bg)', color: 'var(--muted)' }}>Sua gestora confirma a eficácia em 30 dias, a partir da sua avaliação.</div>
          </Card>
          <div className="banner green" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <b>Ao enviar para validação da gestora</b>
            <p>✓ +30 pontos e progresso no pin “Trilha 100%”</p>
            <p>✓ +{c.hours}h no seu histórico de horas de {MONTHS[+date.slice(5, 7) - 1].toLowerCase()}</p>
            <p>✓ Trilha obrigatória sobe de {before}% para {after}%</p>
          </div>
          <div className="btn-row">
            <Btn kind="ghost" onClick={() => nav('/trilha')}>Cancelar</Btn>
            <Btn kind="outline" onClick={() => toast('Rascunho salvo.')}>Salvar rascunho</Btn>
            <Btn onClick={submit}>Enviar para validação</Btn>
          </div>
        </div>
      </div>
    </Page>
  )
}
