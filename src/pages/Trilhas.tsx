import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Avatar, Btn, Card, Field, Modal, Pager, Pill, Progress, Select, Tabs, Toggle } from '../components/ui'
import { useStore } from '../lib/store'
import { addAudit, course, peopleInRole } from '../lib/selectors'
import { brl } from '../lib/format'
import type { Course } from '../lib/types'

type T = 'cat' | 'trilhas' | 'pdi'
export default function Trilhas() {
  const { db, update, toast } = useStore()
  const [sp] = useSearchParams()
  const [tab, setTab] = useState<T>(sp.get('t') === 'trilhas' ? 'trilhas' : 'cat')
  const [comp, setComp] = useState('Competência: todas')
  const [mod, setMod] = useState('Modalidade')
  const [page, setPage] = useState(1)
  const [roleId, setRoleId] = useState('fiscal-junior')
  const [edit, setEdit] = useState<null | Course>(null)
  const [link, setLink] = useState(false)
  const [linkId, setLinkId] = useState('c20')
  const rows = db.courses.filter((c) => (comp === 'Competência: todas' || c.competence === comp.replace('Competência: ', '')) && (mod === 'Modalidade' || c.modality === mod))
  const pages = Math.max(1, Math.ceil(rows.length / 8))
  const cur = Math.min(page, pages)
  const links = db.trackLinks.filter((l) => l.roleId === roleId)
  const mand = links.filter((l) => l.mandatory)
  const hours = mand.reduce((s, l) => s + course(db, l.courseId).hours, 0), cost = mand.reduce((s, l) => s + course(db, l.courseId).value, 0)
  const role = db.roles.find((r) => r.id === roleId)!
  const occupants = db.employees.filter((e) => e.roleId === roleId && e.status !== 'inactive')
  const saveCourse = () => { if (!edit) return; update((d) => { const i = d.courses.findIndex((c) => c.id === edit.id); const isNew = i < 0; if (isNew) d.courses.unshift(edit); else d.courses[i] = edit; addAudit(d, 'Luana Thurow', 'Trilhas', isNew ? 'Criou' : 'Editou', edit.name, '', isNew ? 'adicionado ao catálogo' : 'dados atualizados') }); toast('Curso salvo no catálogo.'); setEdit(null) }
  const pdiLinks = db.pdi.actions.filter((a) => a.courseId)
  return (
    <Page title="Trilhas & Cursos" sub="Catálogo de treinamentos e trilhas obrigatórias por cargo e competência">
      <div className="toolbar"><Tabs<T> value={tab} onChange={setTab} items={[{ id: 'cat', label: `Catálogo de cursos (${db.courses.length})` }, { id: 'trilhas', label: `Trilhas por cargo (${db.roles.length})` }, { id: 'pdi', label: `Vínculos com PDI (${pdiLinks.length})` }]} /><span className="spacer" />
        <Btn kind="ghost" onClick={() => toast('Importação de planilha (CSV/Excel) simulada: 0 linhas novas.')}>Importar planilha</Btn>
        <Btn onClick={() => setEdit({ id: 'c' + (db.courses.length + 1 + Date.now() % 1000), name: '', competence: '', entity: '', modality: 'Online', hours: 4, value: 0, site: '', roles: 0 })}>+ Novo curso</Btn></div>
      <div className="grid4" style={{ gap: 16 }}>
        <Card className="kpi"><div className="label">Cursos no catálogo</div><div className="val"><b>{db.courses.length}</b><span>ativos</span></div></Card>
        <Card className="kpi"><div className="label">Trilhas de cargo</div><div className="val"><b>{new Set(db.trackLinks.map((l) => l.roleId)).size}</b><span>configuradas</span></div></Card>
        <Card className="kpi"><div className="label">Carga total obrigatória</div><div className="val"><b>{hours}h</b><span>cargo selecionado</span></div></Card>
        <Card className="kpi"><div className="label">Investimento previsto 2026</div><div className="val"><b>R$ 7.800</b><span>R$ 6.240 realizado</span></div></Card>
      </div>
      <div className="grid2" style={{ gridTemplateColumns: '1fr 458px', alignItems: 'start', gap: 20 }}>
        <Card>
          {tab === 'cat' && <>
            <div className="row" style={{ marginBottom: 14 }}>
              <Select auto value={comp} onChange={(v) => { setComp(v); setPage(1) }} options={['Competência: todas', ...Array.from(new Set(db.courses.map((c) => `Competência: ${c.competence}`)))]} />
              <Select auto value={mod} onChange={(v) => { setMod(v); setPage(1) }} options={['Modalidade', 'Online', 'Presencial', 'Vídeo', 'Leitura']} /></div>
            <table className="tbl"><thead><tr><th>Competência / Curso</th><th>Modalidade</th><th>Carga</th><th>Valor</th><th>Cargos</th><th /></tr></thead>
              <tbody>{rows.slice((cur - 1) * 8, cur * 8).map((c) => <tr key={c.id}><td style={{ maxWidth: 230 }}><div className="t1">{c.competence}</div><div className="t2">{c.name} · {c.entity.split(' · ')[0]}</div></td><td>{c.modality}</td><td>{c.hours}h</td><td className="nowrap">{brl(c.value)}</td><td><Pill>{c.roles} cargos</Pill></td><td><button className="link" onClick={() => setEdit({ ...c })}>Editar</button></td></tr>)}</tbody></table>
            <div className="table-foot"><span>{rows.length} cursos</span><Pager page={cur} pages={pages} onChange={setPage} /></div></>}
          {tab === 'trilhas' && <table className="tbl"><thead><tr><th>Cargo</th><th>Área</th><th>Cursos</th><th>Carga</th><th>Pessoas</th></tr></thead>
            <tbody>{db.roles.map((r) => { const ls = db.trackLinks.filter((l) => l.roleId === r.id && l.mandatory); return <tr key={r.id} className={`clickable ${r.id === roleId ? 'hl' : ''}`} onClick={() => setRoleId(r.id)}><td><b style={{ fontWeight: 500 }}>{r.name}</b></td><td>{r.area}</td><td>{ls.length}</td><td>{ls.reduce((s, l) => s + course(db, l.courseId).hours, 0)}h</td><td>{peopleInRole(db, r.id)}</td></tr> })}</tbody></table>}
          {tab === 'pdi' && <table className="tbl"><thead><tr><th>Ação do PDI</th><th>Curso vinculado</th><th>Colaborador</th></tr></thead>
            <tbody>{pdiLinks.map((a) => <tr key={a.id}><td>{a.what}</td><td>{course(db, a.courseId!).name}</td><td>Natan Muller</td></tr>)}</tbody></table>}
        </Card>
        <div className="stack">
          <Card>
            <h2 style={{ marginBottom: 12 }}>Trilha obrigatória do cargo</h2>
            <Select value={roleId} onChange={setRoleId} options={db.roles.map((r) => ({ value: r.id, label: r.name }))} label="Cargo" />
            <div className="row" style={{ margin: '12px 0 4px', gap: 8 }}><Pill>{mand.length} cursos</Pill><Pill tone="teal">{hours}h</Pill><Pill tone="gray">R$ {cost}</Pill></div>
            <div className="divider-list" style={{ maxHeight: 360, overflow: 'auto' }}>
              {links.map((l) => { const c = course(db, l.courseId); return <div key={l.courseId} className="row between"><div><b style={{ fontWeight: 500, fontSize: 13 }}>{c.name.length > 40 ? c.competence : c.name}</b><div className="muted xs">{l.rule}</div></div>
                <div className="row sm muted" style={{ gap: 8 }}>Obrigatório<Toggle label={`Obrigatório ${c.name}`} on={l.mandatory} onChange={(v) => { update((d) => { d.trackLinks.find((x) => x.roleId === roleId && x.courseId === l.courseId)!.mandatory = v; addAudit(d, 'Luana Thurow', 'Trilhas', 'Editou', `${c.name} · ${role.name}`, v ? 'opcional' : 'obrigatório', v ? 'obrigatório' : 'opcional') }); toast(v ? 'Curso marcado como obrigatório.' : 'Curso marcado como opcional.') }} /></div></div> })}
            </div>
            <Btn kind="outline" style={{ width: '100%', marginTop: 14 }} onClick={() => setLink(true)}>+ Vincular curso a este cargo</Btn>
          </Card>
          <Card>
            <h2 style={{ marginBottom: 14 }}>Situação de quem ocupa o cargo</h2>
            {occupants.length ? occupants.map((e) => <div key={e.id} className="row" style={{ marginBottom: 14 }}><Avatar name={e.name} size={36} /><div style={{ flex: 1 }}><b style={{ fontWeight: 500 }}>{e.name}</b><Progress value={e.trailPct} tone="amber" /><div className="muted xs" style={{ marginTop: 4 }}>{Math.round(e.trailPct * 0.18)} concluídos</div></div><b>{e.trailPct}%</b></div>) : <p className="muted sm">Ninguém cadastrado neste cargo no momento.</p>}
          </Card>
        </div>
      </div>
      {edit && <Modal title={db.courses.some((c) => c.id === edit.id) ? 'Editar curso' : 'Novo curso'} onClose={() => setEdit(null)} actions={<><Btn kind="ghost" onClick={() => setEdit(null)}>Cancelar</Btn><Btn disabled={!edit.name.trim()} onClick={saveCourse}>Salvar</Btn></>}>
        <Field label="Nome do curso"><input className="input" autoFocus value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
        <div className="grid2"><Field label="Competência"><input className="input" value={edit.competence} onChange={(e) => setEdit({ ...edit, competence: e.target.value })} /></Field><Field label="Entidade"><input className="input" value={edit.entity} onChange={(e) => setEdit({ ...edit, entity: e.target.value })} /></Field></div>
        <div className="grid3"><Field label="Modalidade"><Select value={edit.modality} onChange={(v) => setEdit({ ...edit, modality: v })} options={['Online', 'Presencial', 'Vídeo', 'Leitura']} /></Field><Field label="Carga (h)"><input className="input" type="number" value={edit.hours} onChange={(e) => setEdit({ ...edit, hours: +e.target.value })} /></Field><Field label="Valor (R$)"><input className="input" type="number" value={edit.value} onChange={(e) => setEdit({ ...edit, value: +e.target.value })} /></Field></div></Modal>}
      {link && <Modal title={`Vincular curso · ${role.name}`} onClose={() => setLink(false)} actions={<><Btn kind="ghost" onClick={() => setLink(false)}>Cancelar</Btn><Btn onClick={() => { if (links.some((l) => l.courseId === linkId)) { toast('Este curso já está na trilha do cargo.'); return } update((d) => { d.trackLinks.push({ roleId, courseId: linkId, mandatory: true, rule: 'Até 90 dias da admissão' }); addAudit(d, 'Luana Thurow', 'Trilhas', 'Editou', `${course(d, linkId).name} · ${role.name}`, '', 'vinculado ao cargo') }); setLink(false); toast('Curso vinculado à trilha do cargo.') }}>Vincular</Btn></>}>
        <Select value={linkId} onChange={setLinkId} options={db.courses.map((c) => ({ value: c.id, label: `${c.name} · ${c.hours}h` }))} /></Modal>}
    </Page>
  )
}
