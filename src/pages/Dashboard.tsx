import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Btn, Card, Kpi, Pill, Progress, Select } from '../components/ui'
import { Avatar } from '../components/ui'
import { useStore } from '../lib/store'
import { addAudit, emp, pushAlert } from '../lib/selectors'
import { downloadCsv } from '../lib/csv'
import dash from '../data/dashboard.json'

const tone = (v: number) => (v >= 80 ? '' : v >= 60 ? 'amber' : 'red')
export default function Dashboard() {
  const { db, update, toast } = useStore()
  const nav = useNavigate()
  const [area, setArea] = useState('Área: Todas')
  const [cargo, setCargo] = useState('Cargo: Todos')
  void cargo
  const [period, setPeriod] = useState('Período: Jan – Out/2026')
  const [origem, setOrigem] = useState('Origem: Trilha + PDI')
  void origem
  const [sent, setSent] = useState<string[]>([])
  const tot = dash.months.map((_, i) => dash.hoursTrilha[i] + dash.hoursPdi[i])
  const max = Math.max(...tot)
  const late = dash.lateEmployees.map((l) => ({ ...l, e: emp(db, l.id)! })).filter((l) => area === 'Área: Todas' || l.e.area === area.replace('Área: ', ''))
  const notify = (ids: string[]) => {
    update((d) => { ids.forEach((id) => { const e = emp(d, id)!; addAudit(d, 'Luana Thurow', 'Colaboradores', 'Notificou', `${e.name} · atraso na trilha`, '', 'lembrete enviado'); if (id === 'ana') pushAlert(d, 'colaborador', { cat: 'trein', tone: 'amber', title: 'Sua gestora enviou um lembrete', text: 'Você está atrasado na trilha de outubro. Conclua os cursos pendentes.', to: '/trilha', cta: 'Ver trilha' }) }) })
    setSent((s) => [...s, ...ids]); toast(ids.length > 1 ? `${ids.length} colaboradores notificados.` : 'Colaborador notificado.')
  }
  const W = 1020, H = 230, x = (i: number) => 40 + (i * (W - 60)) / 9, y = (v: number) => 10 + (H - 10) * (1 - v / 100)
  const path = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
  const trail = [...dash.trendTrilha.slice(0, 9), 78]
  return (
    <Page title="Dashboard de Treinamentos" sub="Indicadores em tempo real · 13 colaboradores · atualizado hoje às 11:58">
      <div className="toolbar">
        <Select auto value={period} onChange={setPeriod} options={['Período: Jan – Out/2026', 'Período: Últimos 3 meses', 'Período: 2025']} />
        <Select auto value={area} onChange={setArea} options={['Área: Todas', ...dash.areas.map((a) => `Área: ${a[0]}`)]} />
        <Select auto value={cargo} onChange={setCargo} options={['Cargo: Todos', 'Cargo: Analistas', 'Cargo: Assistentes', 'Cargo: Auxiliares']} />
        <Select auto value={origem} onChange={setOrigem} options={['Origem: Trilha + PDI', 'Origem: Só trilha', 'Origem: Só PDI']} />
        <span className="spacer" />
        <Btn kind="outline" onClick={() => { downloadCsv('relatorio-treinamentos.csv', [['Área', '% cumprimento da trilha'], ...dash.areas.map((a) => [a[0], a[1]])]); toast('Relatório exportado (CSV).') }}>Exportar relatório</Btn>
      </div>
      <div className="grid5" style={{ gap: 16 }}>
        <Kpi label="Trilha obrigatória" value="78%" unit="meta 90%" bar={78} foot="+6 p.p. vs. setembro" />
        <Kpi label="Cumprimento do PDI" value="61%" unit="das ações" bar={61} tone="blue" foot="4 PDIs com ação atrasada" />
        <Kpi label="Hora-homem treinamento" value="31,7h" unit="por colab." foot="412h no total · 13 colaboradores" />
        <Kpi label="Certificados emitidos" value={96 + db.certificates.length - 16} unit="no ano" foot="8 vencem nos próximos 60 dias" />
        <Kpi label="Investimento" value="R$ 6.240" unit="no ano" foot="R$ 480 por colaborador" />
      </div>
      <div className="grid2" style={{ gridTemplateColumns: '1fr 468px', gap: 20, alignItems: 'start' }}>
        <Card>
          <div className="card-head"><h2>Horas realizadas mês a mês (todos)</h2><div className="row" style={{ gap: 10 }}><Pill>Trilha</Pill><Pill tone="teal">PDI</Pill></div></div>
          <div className="bars" style={{ height: 250, gap: 22, justifyContent: 'space-between', padding: '8px 12px 0' }}>
            {dash.months.map((m, i) => <div className="col" key={m}><small>{tot[i]}h</small>
              <div style={{ width: 32, display: 'flex', flexDirection: 'column', borderRadius: '5px 5px 0 0', overflow: 'hidden', height: (tot[i] / max) * 180, gap: 1 }}><div style={{ background: 'var(--teal)', flex: dash.hoursPdi[i] }} /><div style={{ background: 'var(--blue)', flex: dash.hoursTrilha[i] }} /></div><small>{m}</small></div>)}
          </div>
          <p className="muted xs" style={{ marginTop: 12 }}>Meta mensal da empresa: 52h (4h por colaborador) · out/26 parcial até dia 14</p>
        </Card>
        <Card>
          <h2 style={{ marginBottom: 14 }}>Cumprimento da trilha por área</h2>
          {dash.areas.map(([n, v]) => <div key={n as string} style={{ marginBottom: 16, opacity: area === 'Área: Todas' || area === `Área: ${n}` ? 1 : .35 }}><div className="row between sm" style={{ marginBottom: 6 }}><span>{n}</span><b>{v}%</b></div><Progress value={v as number} tone={tone(v as number)} /></div>)}
        </Card>
      </div>
      <Card>
        <div className="card-head"><h2>% de cumprimento mês a mês · trilha obrigatória × PDI</h2>
          <div className="legend"><span><i style={{ background: 'var(--blue)' }} />Trilha obrigatória</span><span><i style={{ background: 'var(--teal)' }} />PDI</span><span><i style={{ background: 'var(--red)' }} />Meta 90%</span></div></div>
        <svg viewBox={`0 0 ${W + 40} ${H + 40}`} width="100%" role="img" aria-label="Gráfico de linhas de cumprimento">
          {[0, 25, 50, 75, 100].map((v) => <g key={v}><line x1="40" x2={W - 20} y1={y(v)} y2={y(v)} stroke="#e3e5ee" /><text x="0" y={y(v) + 4} fontSize="10" fill="#6b7085">{v}%</text></g>)}
          <line x1="40" x2={W - 20} y1={y(90)} y2={y(90)} stroke="var(--red)" strokeDasharray="5 4" />
          <path d={path(trail)} fill="none" stroke="var(--blue)" strokeWidth="2" /><path d={path(dash.trendPdi)} fill="none" stroke="var(--teal)" strokeWidth="2" />
          {trail.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#fff" stroke="var(--blue)" strokeWidth="1.5"><title>{dash.months[i]}: {v}%</title></circle>)}
          {dash.trendPdi.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3.5" fill="#fff" stroke="var(--teal)" strokeWidth="1.5"><title>{dash.months[i]}: {v}%</title></circle>)}
          {dash.months.map((m, i) => <text key={m} x={x(i)} y={H + 28} fontSize="11" fill="#6b7085" textAnchor="middle">{m}</text>)}
        </svg>
        <p className="muted xs">Outubro parcial até o dia 14 · gráfico pode ser filtrado por área, cargo e colaborador</p>
      </Card>
      <div className="grid2" style={{ gridTemplateColumns: '1fr 468px', gap: 20, alignItems: 'start' }}>
        <Card>
          <div className="card-head"><h2>Colaboradores em atraso no mês</h2><button className="link" onClick={() => notify(late.map((l) => l.id).filter((i) => !sent.includes(i)))}>Notificar todos</button></div>
          <table className="tbl"><thead><tr><th>Colaborador</th><th>Trilha</th><th>Atraso no mês</th><th>PDI</th><th /></tr></thead>
            <tbody>{late.map(({ id, e, late: l, pdi }) => <tr key={id}>
              <td><div className="person"><Avatar name={e.name} size={30} /><div><b>{e.name}</b><small>{e.area}</small></div></div></td>
              <td>{e.trailPct}%</td><td><Pill tone="red">{l}% atrasada</Pill></td><td style={{ color: pdi === 'Em dia' ? 'var(--green-ink)' : 'var(--red)', fontSize: 12 }}>{pdi}</td>
              <td><Btn small kind="ghost" disabled={sent.includes(id)} onClick={() => notify([id])}>{sent.includes(id) ? 'Notificado' : 'Notificar'}</Btn></td></tr>)}
              {!late.length && <tr><td colSpan={5} className="empty">Nenhum colaborador em atraso nesta área.</td></tr>}</tbody></table>
        </Card>
        <div className="stack">
          <Card><div className="card-head"><h2>Feedbacks 25 / 50 / 75 dias</h2><span className="muted xs">3 novos colaboradores</span></div>
            <div className="divider-list">{dash.feedbacks.map((f) => <div key={f.empId} className="row between clickable" onClick={() => nav(`/gestao/feedback/${f.empId}`)}><div><b style={{ fontWeight: 500, fontSize: 13 }}>{f.who}</b><div className="muted xs">{f.what}</div></div><Pill tone={f.tone === 'blue' ? '' : f.tone}>{f.tag}</Pill></div>)}</div></Card>
          <Card><h2 style={{ marginBottom: 14 }}>Avaliação dos treinamentos</h2>
            <div className="row" style={{ gap: 32 }}><div><div className="muted xs">Qualidade média</div><b style={{ fontSize: 20 }}>{dash.quality.toString().replace('.', ',')} / 5</b></div><div><div className="muted xs">Eficácia média</div><b style={{ fontSize: 20 }}>{dash.efficacy.toString().replace('.', ',')} / 5</b></div><div><div className="muted xs">Avaliações pendentes</div><b style={{ fontSize: 20 }}>{dash.pending}</b></div></div></Card>
        </div>
      </div>
    </Page>
  )
}
