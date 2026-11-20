import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Award, Clock, Target, Trophy, ClipboardCheck } from 'lucide-react'
import { Page } from '../components/Layout'
import { Card, Tabs, Toggle } from '../components/ui'
import { useStore } from '../lib/store'

type T = 'todos' | 'trein' | 'cert' | 'pdi' | 'aval' | 'conq'
const ICON: Record<string, typeof Clock> = { trein: Clock, cert: Award, pdi: Target, aval: ClipboardCheck, conq: Trophy }
const PREFS: [string, string][] = [['atraso', 'Atraso na trilha do mês'], ['cert', 'Certificados a vencer (60 e 30 dias)'], ['prazos', 'Prazos de cursos e do PDI'], ['aval', 'Etapas da avaliação anual'], ['conq', 'Conquistas e ranking']]

export default function Alertas() {
  const { db, update, session, toast } = useStore()
  const nav = useNavigate()
  const [tab, setTab] = useState<T>('todos')
  const mine = db.alerts.filter((a) => a.profile === session!.profile)
  const n = (c: string) => mine.filter((a) => a.cat === c).length
  const list = mine.filter((a) => tab === 'todos' || a.cat === tab)
  const read = (id: string) => update((d) => { const a = d.alerts.find((x) => x.id === id); if (a) a.read = true })
  const Group = ({ g, label }: { g: 'today' | 'week'; label: string }) => {
    const items = list.filter((a) => a.group === g)
    if (!items.length) return null
    return <div style={{ marginBottom: 16 }}><div className="sec-label" style={{ color: 'var(--muted)', fontSize: 10 }}>{label}</div>
      {items.map((a) => { const I = a.cat === 'trein' && a.tone === 'red' ? AlertTriangle : ICON[a.cat]; return (
        <div key={a.id} className={`alert-item ${a.read ? '' : 'unread'}`} onClick={() => read(a.id)} style={{ cursor: 'pointer' }}>
          <span className={`ai ${a.tone}`}><I size={17} /></span>
          <div style={{ flex: 1 }}><b style={{ fontSize: 14 }}>{a.title}</b><div className="muted sm" style={{ margin: '2px 0' }}>{a.text}</div>
            {a.cta && <button className="link" onClick={(e) => { e.stopPropagation(); read(a.id); nav(a.to) }}>{a.cta}</button>}</div>
          <div style={{ textAlign: 'right' }}><div className="muted xs">{a.time}</div>{!a.read && <span className="dot-pass" />}</div>
        </div>) })}</div>
  }
  return (
    <Page title="Central de alertas" sub="Avisos sobre seus treinamentos, certificados, PDI e avaliações">
      <div className="toolbar"><Tabs<T> value={tab} onChange={setTab} items={[{ id: 'todos', label: `Todos (${mine.length})` }, { id: 'trein', label: `Treinamentos (${n('trein')})` }, { id: 'cert', label: `Certificados (${n('cert')})` }, { id: 'pdi', label: `PDI (${n('pdi')})` }, { id: 'aval', label: `Avaliações (${n('aval')})` }, { id: 'conq', label: `Conquistas (${n('conq')})` }]} />
        <span className="spacer" /><button className="link" onClick={() => { update((d) => d.alerts.forEach((a) => { if (a.profile === session!.profile) a.read = true })); toast('Todos os alertas marcados como lidos.') }}>Marcar todos como lidos</button></div>
      <div className="grid2" style={{ gridTemplateColumns: '1fr 348px', alignItems: 'start', gap: 20 }}>
        <Card>{list.length ? <><Group g="today" label="HOJE" /><Group g="week" label="ESTA SEMANA" /></> : <div className="empty">Nenhum alerta nesta categoria.</div>}</Card>
        <div className="stack">
          <Card>
            <h2 style={{ marginBottom: 14 }}>Como quer ser avisado</h2>
            <div className="row between muted xs" style={{ justifyContent: 'flex-end', gap: 14, marginBottom: 6 }}><span>Sistema</span><span>E-mail</span></div>
            {PREFS.map(([k, l]) => <div key={k} className="row between" style={{ padding: '10px 0' }}><span style={{ flex: 1 }}>{l}</span>
              <Toggle label={`${l} no sistema`} on={db.prefs[k][0]} onChange={(v) => update((d) => { d.prefs[k][0] = v })} />
              <Toggle label={`${l} por e-mail`} on={db.prefs[k][1]} onChange={(v) => update((d) => { d.prefs[k][1] = v })} /></div>)}
          </Card>
          <div className="note" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, padding: 18 }}>
            <b style={{ fontSize: 14 }}>Como o atraso é calculado</b>
            <span>Horas previstas até hoje = meta do mês × (dia atual ÷ dias do mês). O atraso é quanto falta para chegar nesse valor.</span>
            <b style={{ fontSize: 11 }}>26h × (14 ÷ 31) ≈ 12h previstas · 6h feitas → 18% de atraso sobre a meta</b>
          </div>
        </div>
      </div>
    </Page>
  )
}
