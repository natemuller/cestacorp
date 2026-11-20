import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Btn, Card, Field, Modal, Select, Tabs } from '../components/ui'
import { useStore } from '../lib/store'
import { addAudit, peopleInRole, role } from '../lib/selectors'
import { brl } from '../lib/format'
import type { Role } from '../lib/types'

const LEVELS = ['Estágio', 'Auxiliar', 'Assistente', 'Analista Júnior', 'Analista', 'Coordenação']
type ListKey = 'responsibilities' | 'knowledge' | 'skills' | 'attitudes'
export default function Cargos() {
  const { db, update, toast } = useStore()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const [area, setArea] = useState('Fiscal')
  const [nivel, setNivel] = useState('todos')
  const [selId, setSelId] = useState(sp.get('id') ?? 'fiscal-junior')
  const [form, setForm] = useState<Role | null>(null)
  const [add, setAdd] = useState<null | { key: ListKey | 'indicators'; title: string }>(null)
  const [txt, setTxt] = useState('')
  const base = role(db, selId)
  useEffect(() => { if (sp.get('novo')) { newRole(); setSp({}) } else if (base) setForm(structuredClone(base)) /* eslint-disable-next-line */ }, [selId, db.roles.length])
  const newRole = () => { const id = 'novo-' + Date.now(); const r: Role = { id, name: 'Novo cargo', area, level: 'Analista', min: 3000, max: 4000, reportsTo: 'Coordenador Fiscal', prev: null, next: null, extraPeople: 0, promotion: '' }; update((d) => { d.roles.push(r) }); setSelId(id) }
  if (!form) return <Page title="Plano de Cargos e Salários"><Card>Carregando…</Card></Page>
  const list = db.roles.filter((r) => (area === 'Todas' || r.area === area) && (nivel === 'todos' || r.level === nivel)).sort((a, b) => b.max - a.max)
  const set = <K extends keyof Role>(k: K, v: Role[K]) => setForm({ ...form, [k]: v })
  const save = () => {
    update((d) => { const i = d.roles.findIndex((r) => r.id === form.id); const old = d.roles[i]; d.roles[i] = form
      addAudit(d, 'Luana Thurow', 'Cargos', 'Editou', form.name, `Faixa ${brl(old.min)}–${old.max.toLocaleString('pt-BR')}`, `${brl(form.min)}–${form.max.toLocaleString('pt-BR')}`) })
    toast(`Cargo “${form.name}” salvo.`)
  }
  const doAdd = () => { if (!txt.trim() || !add) return; if (add.key === 'indicators') set('indicators', [...(form.indicators ?? []), { name: txt, target: 'meta a definir' }]); else set(add.key, [...(form[add.key] ?? []), txt]); setTxt(''); setAdd(null) }
  const chips = (k: ListKey, title: string) => <div style={{ marginTop: 18 }}>
    <div className="row between" style={{ marginBottom: 8 }}><b style={{ fontSize: 13 }}>{title}</b><button className="link" onClick={() => setAdd({ key: k, title })}>+ Adicionar</button></div>
    {k === 'responsibilities' ? <ul className="bullets">{(form[k] ?? []).map((t, i) => <li key={i} className="sm">{t} <button className="link danger" style={{ fontSize: 11 }} onClick={() => set(k, (form[k] ?? []).filter((_, j) => j !== i))}>remover</button></li>)}</ul>
      : <div className="tag-list">{(form[k] ?? []).map((t, i) => <span key={i} className="chip clickable" title="Clique para remover" onClick={() => set(k, (form[k] ?? []).filter((_, j) => j !== i))}>{t}</span>)}</div>}
  </div>
  return (
    <Page title="Plano de Cargos e Salários" sub="Cargos do organograma com competências, indicadores, faixa salarial e progressão">
      <div className="toolbar"><Tabs value="cargos" onChange={(v) => v === 'org' ? nav('/gestao/organograma') : v === 'trilhas' ? nav('/gestao/trilhas?t=trilhas') : undefined} items={[{ id: 'org', label: 'Organograma' }, { id: 'cargos', label: 'Plano de Cargos e Salários' }, { id: 'trilhas', label: 'Trilhas por cargo' }]} /><span className="spacer" /><Btn onClick={newRole}>+ Novo cargo</Btn></div>
      <div className="grid2" style={{ gridTemplateColumns: '430px 1fr', alignItems: 'start', gap: 20 }}>
        <Card>
          <div className="row" style={{ marginBottom: 14 }}><Select auto value={area} onChange={setArea} options={['Todas', 'Fiscal', 'Contábil', 'Pessoal', 'Atendimento', 'Controles Internos']} label="Área" /><Select auto value={nivel} onChange={setNivel} options={['todos', ...LEVELS]} label="Nível" /></div>
          <table className="tbl"><thead><tr><th>Cargo</th><th>Faixa (R$)</th><th>Pessoas</th></tr></thead>
            <tbody>{list.map((r) => <tr key={r.id} className={`clickable ${r.id === selId ? 'hl' : ''}`} onClick={() => setSelId(r.id)}>
              <td><div className="t1">{r.name}</div><div className="t2">{r.level.split(' ')[0]}</div></td>
              <td style={{ fontSize: 12 }}>{r.bolsa ? `Bolsa ${r.min.toLocaleString('pt-BR')}` : `${r.min.toLocaleString('pt-BR')} – ${r.max.toLocaleString('pt-BR')}`}</td><td>{peopleInRole(db, r.id)}</td></tr>)}</tbody></table>
          <p className="muted xs" style={{ marginTop: 12 }}>Faixas salariais visíveis só para a Gestão. Valores ilustrativos.</p>
        </Card>
        <Card>
          <div className="card-head" style={{ alignItems: 'flex-start' }}><div><h2 style={{ fontSize: 18 }}>Editar cargo · {base?.name}</h2><p className="muted xs">Última alteração em 02/10/2026 por Luana Thurow</p></div><span className="pill">{peopleInRole(db, form.id)} pessoas no cargo</span></div>
          <div className="grid3" style={{ gap: 14 }}>
            <Field label="Nome do cargo"><input className="input" value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Área"><Select value={form.area} onChange={(v) => set('area', v)} options={['Fiscal', 'Contábil', 'Pessoal', 'Atendimento', 'Controles Internos']} /></Field>
            <Field label="Nível"><Select value={form.level} onChange={(v) => set('level', v)} options={LEVELS} /></Field>
            <Field label="Reporta a"><Select value={form.reportsTo} onChange={(v) => set('reportsTo', v)} options={Array.from(new Set([form.reportsTo, 'Coordenador Fiscal', 'Coordenador Contábil', 'Coord. de DP', 'Diretor de Operações']))} /></Field>
            <Field label="Faixa salarial mínima"><input className="input" type="number" value={form.min} onChange={(e) => set('min', +e.target.value)} /></Field>
            <Field label="Faixa salarial máxima"><input className="input" type="number" value={form.max} onChange={(e) => set('max', +e.target.value)} /></Field>
            <Field label="Cargo anterior na carreira"><Select value={form.prev ?? ''} onChange={(v) => set('prev', v || null)} options={[{ value: '', label: '—' }, ...db.roles.filter((r) => r.id !== form.id).map((r) => ({ value: r.id, label: r.name }))]} /></Field>
            <Field label="Próximo cargo na carreira"><Select value={form.next ?? ''} onChange={(v) => set('next', v || null)} options={[{ value: '', label: '—' }, ...db.roles.filter((r) => r.id !== form.id).map((r) => ({ value: r.id, label: r.name }))]} /></Field>
            <Field label="Requisito para promoção"><textarea className="textarea" rows={2} value={form.promotion} onChange={(e) => set('promotion', e.target.value)} /></Field>
          </div>
          {chips('responsibilities', 'Responsabilidades')}{chips('knowledge', 'Conhecimentos')}{chips('skills', 'Habilidades')}{chips('attitudes', 'Atitudes')}
          <div style={{ marginTop: 18 }}><div className="row between" style={{ marginBottom: 8 }}><b style={{ fontSize: 13 }}>Indicadores do cargo (meta)</b><button className="link" onClick={() => setAdd({ key: 'indicators', title: 'Indicadores do cargo' })}>+ Adicionar</button></div>
            <div className="stack-sm" style={{ gap: 6 }}>{(form.indicators ?? []).map((i, k) => <div key={k} className="kv row between" style={{ padding: '10px 14px' }}><span className="sm">{i.name}</span><b className="sm">{i.target}</b></div>)}</div></div>
          <div className="grid2" style={{ marginTop: 16 }}><Field label="Formação"><textarea className="textarea" rows={2} value={form.education ?? ''} onChange={(e) => set('education', e.target.value)} /></Field><Field label="Experiência"><textarea className="textarea" rows={2} value={form.experience ?? ''} onChange={(e) => set('experience', e.target.value)} /></Field></div>
          <div className="btn-row" style={{ marginTop: 16 }}><Btn kind="ghost" onClick={() => base && setForm(structuredClone(base))}>Cancelar</Btn><Btn onClick={save}>Salvar cargo</Btn></div>
        </Card>
      </div>
      {add && <Modal title={`Adicionar · ${add.title}`} onClose={() => setAdd(null)} actions={<><Btn kind="ghost" onClick={() => setAdd(null)}>Cancelar</Btn><Btn onClick={doAdd}>Adicionar</Btn></>}><input className="input" autoFocus value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doAdd()} /></Modal>}
    </Page>
  )
}
