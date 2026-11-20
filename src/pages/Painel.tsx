import { useNavigate } from 'react-router-dom'
import { AlertTriangle, BookOpen, FileCheck2, Check } from 'lucide-react'
import { Page } from '../components/Layout'
import { Btn, Card, Kpi, Pill } from '../components/ui'
import { useStore } from '../lib/store'
import { course, emp, hoursYear, meRank, ME, STATUS_LABEL, STATUS_TONE, statusOf, trailItems, doneTrail, trailPct, certStatusLabel } from '../lib/selectors'
import { MONTHS, fmtDate, fmtShort, tenureLong } from '../lib/format'

export default function Painel() {
  const { db, session } = useStore()
  const isGestao = session?.profile === 'gestao'
  const nav = useNavigate()
  const me = emp(db, ME)!
  const rank = meRank(db)
  const items = trailItems(db)
  const pct = trailPct(db)
  const pdiDone = db.pdi.actions.filter((a) => a.status === 'done').length
  const pdiPct = Math.round((pdiDone / db.pdi.actions.length) * 100)
  const h = hoursYear(db)
  const max = Math.max(...db.hoursByMonth)
  const next = db.enrollments.filter((e) => e.origin === 'Trilha' && statusOf(e) !== 'done' && statusOf(e) !== 'validating').sort((a, b) => {
    const rk = (s: string) => (s === 'inprogress' ? 0 : s === 'overdue' ? 2 : 1)
    return rk(statusOf(a)) - rk(statusOf(b)) || a.due.localeCompare(b.due)
  }).slice(0, 4)
  const certs = db.certificates.filter((c) => c.status === 'expiring' || c.status === 'expired').sort((a, b) => (a.expires ?? '').localeCompare(b.expires ?? '')).slice(0, 3)
  return (
    <Page title={`Olá, ${isGestao ? session!.name.split(' ')[0] : 'Natan'} 👋`} sub={isGestao ? `${session!.subtitle} · visão “Minha área” de demonstração (dados de ${me.name})` : `Analista Fiscal Júnior · Departamento Fiscal · ${tenureLong(me.admission)} de empresa`}>
      <div className="banner amber">
        <span className="ico-box"><AlertTriangle size={16} /></span>
        <div className="grow"><b>Você está 18% atrasado nos treinamentos de outubro</b>
          <p>Dia 14 de 31 · 6h realizadas de 12h previstas até hoje (meta do mês: 26h). 2 cursos da trilha obrigatória vencem nos próximos 7 dias.</p></div>
        <Btn kind="outline" onClick={() => nav('/trilha?f=overdue')}>Ver pendências</Btn>
      </div>
      <div className="grid4">
        <Kpi label="Trilha obrigatória do cargo" value={`${pct}%`} unit={`${doneTrail(db)} de ${items.length} cursos`} bar={pct} foot="Meta: 100% até 31/12" />
        <Kpi label="Plano de Desenvolvimento (PDI)" value={`${pdiPct}%`} unit={`${pdiDone} de ${db.pdi.actions.length} ações`} bar={pdiPct} tone="blue" foot={`Próximo acompanhamento em ${fmtShort(db.pdi.next)}`} />
        <Kpi label="Horas de treinamento 2026" value={`${h}h`} unit="de 60h" bar={(h / 60) * 100} tone="teal" foot="Média da área Fiscal: 41h" />
        <Card className="kpi">
          <div className="label">Pontos de gamificação</div>
          <div className="val"><b>{me.points.toLocaleString('pt-BR')}</b><span>pts</span></div>
          <div className="row" style={{ gap: 8 }}><Pill tone="green">{rank.areaPos}º na área Fiscal</Pill><Pill>{rank.pos}º geral</Pill></div>
          <div className="foot">+30 pts ao concluir o próximo curso</div>
        </Card>
      </div>
      <div className="row" style={{ alignItems: 'flex-start', gap: 20 }}>
        <Card style={{ width: 680, flexShrink: 0 }}>
          <div className="card-head"><h2>Horas realizadas mês a mês</h2><div className="row" style={{ gap: 12 }}><Pill>Realizado</Pill><Pill tone="green">Mês atual</Pill></div></div>
          <div className="bars">
            {db.hoursByMonth.map((v, i) => (
              <div className="col" key={i}><small>{v}h</small><div className={`bar ${i === 9 ? 'cur' : ''}`} style={{ height: (v / max) * 176 }} /><small>{MONTHS[i]}</small></div>
            ))}
          </div>
          <p className="muted xs" style={{ marginTop: 14 }}>Meta mensal da trilha: 5h · Total no ano: {h}h · Hora-homem treinamento acumulada</p>
        </Card>
        <Card style={{ flex: 1 }}>
          <div className="card-head"><h2>Próximos treinamentos</h2><button className="link" onClick={() => nav('/trilha')}>Ver trilha</button></div>
          <div className="divider-list">
            {next.map((e) => { const c = course(db, e.courseId); const st = statusOf(e); return (
              <div className="row" key={e.courseId}>
                <span className="avatar soft" style={{ width: 32, height: 32, borderRadius: 8 }}><BookOpen size={15} /></span>
                <div style={{ flex: 1, minWidth: 0 }}><b style={{ fontWeight: 500, fontSize: 13 }}>{c.name}</b><div className="muted xs">{c.entity.split(' · ')[0]} · {c.modality} · {c.hours}h · {st === 'overdue' ? 'Venceu' : 'Prazo'} {fmtShort(e.due)}</div></div>
                <Pill tone={STATUS_TONE[st]}>{STATUS_LABEL[st]}</Pill>
              </div>) })}
          </div>
        </Card>
      </div>
      <div className="row" style={{ alignItems: 'flex-start', gap: 20 }}>
        <Card style={{ width: 680, flexShrink: 0 }}>
          <div className="card-head"><h2>Meus pins</h2><button className="link" onClick={() => nav('/ranking')}>Ranking completo</button></div>
          <div className="pin-grid">
            {db.pins.slice(0, 6).map((p) => <div key={p.id} className={`pin ${p.got ? 'got' : ''}`}><div className="badge">{p.got && <Check size={22} />}</div><b>{p.name}</b><small>{p.desc}</small></div>)}
          </div>
        </Card>
        <Card style={{ flex: 1 }}>
          <div className="card-head"><h2>Certificados a vencer</h2><button className="link" onClick={() => nav('/certificados')}>Biblioteca</button></div>
          <div className="divider-list">
            {certs.map((c) => (
              <div className="row" key={c.id}>
                <span className="avatar teal" style={{ width: 28, height: 28, borderRadius: 7 }}><FileCheck2 size={14} /></span>
                <div style={{ flex: 1 }}><b style={{ fontWeight: 500, fontSize: 13 }}>{c.title}</b><div className="muted xs">{c.status === 'expired' ? 'Venceu em' : 'Vence em'} {fmtDate(c.expires)}</div></div>
                <Pill tone={c.status === 'expired' ? 'red' : 'amber'}>{c.status === 'expired' ? 'Vencido' : certStatusLabel(c.status)}</Pill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Page>
  )
}
