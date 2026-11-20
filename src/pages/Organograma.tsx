import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Btn, Card, LinkBtn, Pill, Tabs } from '../components/ui'
import OrgChart from '../components/OrgChart'
import { useStore } from '../lib/store'
import { ME, doneTrail, emp, peopleInRole, role, trailItems } from '../lib/selectors'
import { brl, tenureLong } from '../lib/format'

type Tb = 'org' | 'cargos' | 'trilhas' | 'carreira'
const DET = ['Responsabilidades', 'Conhecimentos', 'Habilidades', 'Atitudes', 'Indicadores', 'Formação', 'Experiência'] as const

export default function Organograma() {
  const { db, toast } = useStore()
  const nav = useNavigate()
  const g = useLocation().pathname.startsWith('/gestao')
  const me = emp(db, ME)!
  const [sel, setSel] = useState(me.roleId)
  const [tab, setTab] = useState<Tb>('org')
  const [det, setDet] = useState<(typeof DET)[number]>('Responsabilidades')
  const r = role(db, sel)!
  const chain = db.roles.filter((x) => x.area === r.area && x.id.startsWith(r.id.split('-')[0])).sort((a, b) => b.max - a.max)
  const mine = sel === me.roleId
  const j = role(db, 'fiscal-junior')!
  const src = r.responsibilities ? r : j
  const content: Record<string, string[]> = {
    Responsabilidades: src.responsibilities ?? [], Conhecimentos: src.knowledge ?? [], Habilidades: src.skills ?? [], Atitudes: src.attitudes ?? [],
    Indicadores: (src.indicators ?? []).map((i) => `${i.name} — ${i.target}`), Formação: [src.education ?? ''], Experiência: [src.experience ?? ''],
  }
  const nextRole = r.next ? role(db, r.next) : null
  return (
    <Page title={g ? 'Organograma & Plano de Cargos' : 'Organograma'} sub={g ? 'Estrutura de áreas, cargos e progressão de carreira · base para trilhas e avaliações' : 'Conheça a estrutura da Cestacorp e os próximos passos da sua carreira'}>
      <div className="toolbar">
        {g ? <Tabs<Tb> value="org" onChange={(v) => v === 'cargos' ? nav('/gestao/cargos') : v === 'trilhas' ? nav('/gestao/trilhas?t=trilhas') : undefined} items={[{ id: 'org', label: 'Organograma' }, { id: 'cargos', label: 'Plano de Cargos e Salários' }, { id: 'trilhas', label: 'Trilhas por cargo' }]} />
          : <Tabs<Tb> value={tab === 'carreira' ? 'carreira' : 'org'} onChange={(v) => { setTab(v); if (v === 'carreira') document.getElementById('carreira')?.scrollIntoView({ behavior: 'smooth' }) }} items={[{ id: 'org', label: 'Organograma' }, { id: 'carreira', label: 'Minha carreira' }]} />}
        <span className="spacer" />
        {g && <><Btn kind="ghost" onClick={() => toast('Organograma exportado como PNG (simulado).')}>Exportar PNG</Btn><Btn onClick={() => nav('/gestao/cargos?novo=1')}>+ Novo cargo</Btn></>}
      </div>
      <Card>
        <div className="card-head"><h2 style={{ fontSize: 17 }}>Estrutura organizacional</h2><div className="row" style={{ gap: 8 }}><Pill>Área interna</Pill><Pill tone="gray">Terceirizado</Pill><Pill tone="green">{g ? 'Selecionado' : 'Seu cargo'}</Pill></div></div>
        <OrgChart selected={sel} onSelect={setSel} />
      </Card>
      <div id="carreira" className="grid2" style={{ gridTemplateColumns: '380px 1fr', alignItems: 'start', gap: 20 }}>
        <Card>
          <div className="card-head"><h2>Carreira · {r.area}</h2><span className="muted xs">{g ? 'valores ilustrativos' : 'sua posição'}</span></div>
          <div className="career-list">
            {chain.map((c) => (
              <button key={c.id} className={`career-item ${c.id === sel ? 'sel' : ''}`} onClick={() => setSel(c.id)}>
                <span>{c.name}</span>
                <small>{g ? (c.bolsa ? `Bolsa ${brl(c.min)}` : `${brl(c.min)} – ${c.max.toLocaleString('pt-BR')}`) : c.id === me.roleId ? 'Você está aqui' : c.id === me.roleId.replace('junior', 'pleno') ? <b style={{ color: 'var(--blue)' }}>Próximo nível</b> : ''}</small>
              </button>
            ))}
          </div>
        </Card>
        <Card>
          <div className="card-head" style={{ alignItems: 'flex-start' }}>
            <div><h2 style={{ fontSize: 18 }}>{r.name}</h2><p className="muted sm" style={{ marginTop: 2 }}>{g ? `${r.area} · reporta a ${r.reportsTo} · ${peopleInRole(db, r.id)} pessoas no cargo` : `${mine ? 'Seu cargo atual' : 'Cargo da carreira'} · ${r.area} · reporta a ${r.reportsTo}`}</p></div>
            {g ? <Btn kind="outline" onClick={() => nav(`/gestao/cargos?id=${r.id}`)}>Editar cargo</Btn> : <Btn kind="outline" onClick={() => nav('/trilha')}>Ver minha trilha</Btn>}
          </div>
          <div className="link-tabs">{DET.map((d) => <button key={d} className={det === d ? 'on' : ''} onClick={() => setDet(d)}>{d}</button>)}</div>
          <ul className="bullets" style={{ minHeight: 160 }}>{content[det].map((t) => <li key={t}>{t}</li>)}</ul>
          <div className="grid3" style={{ marginTop: 14 }}>
            {g ? <>
              <div className="kv"><small>Trilha obrigatória</small><b>{r.trackCourses ?? 5} cursos · {r.trackHours ?? 20}h</b></div>
              <div className="kv"><small>Formação</small><b>{src.education}</b></div>
              <div className="kv"><small>Experiência</small><b>{src.experience}</b></div></> : <>
              <div className="kv"><small>Trilha obrigatória do cargo</small><b>{doneTrail(db)} de {trailItems(db).length} concluídos</b></div>
              <div className="kv"><small>Próximo nível</small><b>{nextRole?.name ?? '—'}</b></div>
              <div className="kv"><small>Tempo no cargo</small><b>{tenureLong(me.admission)}</b></div></>}
          </div>
          {!g && !mine && <p className="muted xs" style={{ marginTop: 10 }}><LinkBtn onClick={() => setSel(me.roleId)}>Voltar ao meu cargo</LinkBtn></p>}
        </Card>
      </div>
    </Page>
  )
}
