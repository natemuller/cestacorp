import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Page } from '../components/Layout'
import { Btn, Card, Pager, Pill, Select, Tabs } from '../components/ui'
import { useStore } from '../lib/store'
import { STATUS_LABEL, STATUS_TONE, course, doneTrail, hoursYear, statusOf, trailItems, trailPct } from '../lib/selectors'
import { brl, fmtDate } from '../lib/format'

type F = 'todos' | 'obrig' | 'pdi' | 'done' | 'overdue'

export default function Trilha() {
  const { db, update, toast } = useStore()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const f = (sp.get('f') as F) || 'todos'
  const [comp, setComp] = useState('Competência')
  const [mod, setMod] = useState('Modalidade')
  const [prazo, setPrazo] = useState('Prazo: todos')
  const [page, setPage] = useState(1)

  const all = db.enrollments.map((e) => ({ e, c: course(db, e.courseId), st: statusOf(e) }))
  const counts = { todos: all.length, obrig: all.filter((r) => r.e.origin === 'Trilha').length, pdi: all.filter((r) => r.e.origin === 'PDI').length, done: all.filter((r) => r.st === 'done' || r.st === 'validating').length, overdue: all.filter((r) => r.st === 'overdue').length }
  const rows = useMemo(() => all.filter((r) =>
    (f === 'todos' || (f === 'obrig' && r.e.origin === 'Trilha') || (f === 'pdi' && r.e.origin === 'PDI') || (f === 'done' && (r.st === 'done' || r.st === 'validating')) || (f === 'overdue' && r.st === 'overdue')) &&
    (comp === 'Competência' || r.c.competence === comp) && (mod === 'Modalidade' || r.c.modality === mod) &&
    (prazo === 'Prazo: todos' || (prazo === 'Prazo: este mês' ? r.e.due.startsWith('2026-10') : r.st === 'overdue'))
  ), [all, f, comp, mod, prazo])
  const pages = Math.max(1, Math.ceil(rows.length / 10))
  const cur = Math.min(page, pages)
  const view = rows.slice((cur - 1) * 10, cur * 10)
  const invest = all.filter((r) => r.st === 'done' || r.st === 'validating').reduce((a, r) => a + r.c.value, 0)
  const setF = (v: F) => { setSp(v === 'todos' ? {} : { f: v }); setPage(1) }

  const certFor = (id: string) => db.certificates.find((c) => c.courseId === id)
  const open = (id: string) => {
    update((d) => { const e = d.enrollments.find((x) => x.courseId === id)!; if (e.status === 'todo') e.status = 'inprogress' })
    toast('Curso aberto na plataforma da entidade (simulado). Status: Em andamento.')
  }
  return (
    <Page title="Minha Trilha de Conhecimentos" sub="Treinamentos obrigatórios do cargo Analista Fiscal Júnior + ações do seu PDI">
      <Card style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px' }}>
        {[
          ['Cumprimento obrigatório', <b style={{ color: 'var(--green-ink)', fontSize: 22 }}>{trailPct(db)}%</b>],
          ['Concluídos', <b style={{ fontSize: 22 }}>{doneTrail(db)} / {trailItems(db).length}</b>],
          ['Em andamento', <b style={{ fontSize: 22 }}>{all.filter((r) => r.st === 'inprogress').length}</b>],
          ['Vencidos', <b style={{ fontSize: 22, color: 'var(--red)' }}>{counts.overdue}</b>],
          ['Ações do PDI vinculadas', <b style={{ fontSize: 22 }}>{counts.pdi}</b>],
          ['Horas no ano', <b style={{ fontSize: 22 }}>{hoursYear(db)}h / 60h</b>],
        ].map(([l, v], i) => <div key={i}><div className="muted xs" style={{ marginBottom: 6 }}>{l}</div>{v}</div>)}
      </Card>
      <div className="toolbar">
        <Tabs<F> value={f} onChange={setF} items={[
          { id: 'todos', label: `Todos (${counts.todos})` }, { id: 'obrig', label: `Obrigatórios do cargo (${counts.obrig})` }, { id: 'pdi', label: `PDI (${counts.pdi})` },
          { id: 'done', label: `Concluídos (${counts.done})` }, { id: 'overdue', label: `Vencidos (${counts.overdue})` }]} />
        <span className="spacer" />
        <Select auto label="Competência" value={comp} onChange={(v) => { setComp(v); setPage(1) }} options={['Competência', ...Array.from(new Set(all.map((r) => r.c.competence)))]} />
        <Select auto label="Modalidade" value={mod} onChange={(v) => { setMod(v); setPage(1) }} options={['Modalidade', 'Online', 'Presencial', 'Vídeo', 'Leitura']} />
        <Select auto label="Prazo" value={prazo} onChange={(v) => { setPrazo(v); setPage(1) }} options={['Prazo: todos', 'Prazo: este mês', 'Prazo: vencidos']} />
      </div>
      <Card>
        <table className="tbl">
          <thead><tr><th>Competência</th><th>Curso / Entidade</th><th>Origem</th><th>Modalidade</th><th>Carga</th><th>Prazo</th><th>Status</th><th>Ação</th></tr></thead>
          <tbody>
            {view.map(({ e, c, st }) => (
              <tr key={e.courseId}>
                <td style={{ maxWidth: 130 }}>{c.competence}</td>
                <td style={{ maxWidth: 270 }}><div className="t1">{c.name}</div><div className="t2">{c.entity} · {c.site}</div></td>
                <td><Pill tone={e.origin === 'PDI' ? 'teal' : ''}>{e.origin}</Pill></td>
                <td>{c.modality}</td><td>{c.hours}h</td><td>{fmtDate(e.due)}</td>
                <td><Pill tone={STATUS_TONE[st]}>{STATUS_LABEL[st]}</Pill></td>
                <td>
                  {(st === 'inprogress' || st === 'overdue') && e.origin === 'Trilha' && <Btn small onClick={() => nav(`/trilha/${e.courseId}/concluir`)}>Registrar conclusão</Btn>}
                  {(st === 'inprogress') && e.origin === 'PDI' && <Btn small kind="ghost" onClick={() => nav('/pdi')}>Ver no PDI</Btn>}
                  {st === 'todo' && e.origin === 'Trilha' && <Btn small kind="outline" onClick={() => open(e.courseId)}>Acessar curso</Btn>}
                  {st === 'todo' && e.origin === 'PDI' && <Btn small kind="ghost" onClick={() => nav('/pdi')}>Ver no PDI</Btn>}
                  {(st === 'done' || st === 'validating') && (() => { const ce = certFor(e.courseId); return <Btn small kind="ghost" onClick={() => nav('/certificados')}>{ce && ce.ext === 'pdf' ? 'Ver certificado' : 'Ver comprovante'}</Btn> })()}
                </td>
              </tr>
            ))}
            {!view.length && <tr><td colSpan={8} className="empty">Nenhum treinamento encontrado com esses filtros.</td></tr>}
          </tbody>
        </table>
        <div className="table-foot"><span>Mostrando {view.length} de {rows.length} treinamentos · investimento no ano: {brl(invest)},00</span><Pager page={cur} pages={pages} onChange={setPage} /></div>
      </Card>
    </Page>
  )
}
