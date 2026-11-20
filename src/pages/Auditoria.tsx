import { useState } from 'react'
import { Info } from 'lucide-react'
import { Page } from '../components/Layout'
import { Btn, Card, Pill, Select } from '../components/ui'
import { useStore } from '../lib/store'
import { fmtDateTime } from '../lib/format'
import { downloadCsv } from '../lib/csv'
import { Avatar } from '../components/ui'

const TONE: Record<string, string> = { Validou: 'teal', Enviou: 'amber', Editou: '', Criou: 'green', Excluiu: 'red', Notificou: 'amber', Publicou: 'green', Concluiu: 'green' }
export default function Auditoria() {
  const { db, toast } = useStore()
  const [user, setUser] = useState('Usuário: todos')
  const [mod, setMod] = useState('Módulo: todos')
  const [act, setAct] = useState('Ação: todas')
  const [per, setPer] = useState('Período: últimos 30 dias')
  const [n, setN] = useState(8)
  const rows = db.audit.slice().sort((a, b) => b.at.localeCompare(a.at)).filter((r) => (user === 'Usuário: todos' || r.user === user.replace('Usuário: ', '')) && (mod === 'Módulo: todos' || r.module === mod.replace('Módulo: ', '')) && (act === 'Ação: todas' || r.action === act.replace('Ação: ', '')) && (per !== 'Período: últimos 30 dias' || r.at >= '2026-09-14'))
  const uniq = (k: 'user' | 'module' | 'action') => Array.from(new Set(db.audit.map((r) => r[k])))
  return (
    <Page title="Auditoria" sub="Histórico de todas as alterações: quem mudou, o quê, quando e como estava antes">
      <div className="toolbar">
        <Select auto value={per} onChange={(v) => { setPer(v); setN(8) }} options={['Período: últimos 30 dias', 'Período: tudo']} />
        <Select auto value={user} onChange={setUser} options={['Usuário: todos', ...uniq('user').map((u) => `Usuário: ${u}`)]} />
        <Select auto value={mod} onChange={setMod} options={['Módulo: todos', ...uniq('module').map((u) => `Módulo: ${u}`)]} />
        <Select auto value={act} onChange={setAct} options={['Ação: todas', ...uniq('action').map((u) => `Ação: ${u}`)]} />
        <span className="spacer" /><Btn kind="ghost" onClick={() => { downloadCsv('auditoria.csv', [['Data/hora', 'Usuário', 'Módulo', 'Ação', 'Registro', 'Antes', 'Depois'], ...rows.map((r) => [fmtDateTime(r.at), r.user, r.module, r.action, r.record, r.before, r.after])]); toast('Auditoria exportada (CSV).') }}>Exportar CSV</Btn>
      </div>
      <div className="note"><Info size={16} />Os registros de auditoria são somente leitura: ninguém, nem a gestão, consegue editar ou apagar o histórico.</div>
      <Card>
        <table className="tbl"><thead><tr><th>Data e hora</th><th>Usuário</th><th>Módulo</th><th>Ação</th><th>Registro</th><th>Alteração</th></tr></thead>
          <tbody>{rows.slice(0, n).map((r) => <tr key={r.id}>
            <td className="muted" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(r.at)}</td><td><div className="row" style={{ gap: 8 }}><Avatar name={r.user === 'Sistema' ? 'Si' : r.user} size={26} />{r.user}</div></td>
            <td>{r.module}</td><td><Pill tone={TONE[r.action] ?? ''}>{r.action}</Pill></td><td style={{ maxWidth: 200 }}>{r.record}</td>
            <td style={{ fontSize: 12 }}>{r.before && <span style={{ color: 'var(--red)', textDecoration: 'line-through' }}>{r.before}</span>}{r.before && r.after && <span className="muted"> → </span>}<span style={{ color: 'var(--green-ink)' }}>{r.after}</span></td></tr>)}
            {!rows.length && <tr><td colSpan={6} className="empty">Nenhum registro com esses filtros.</td></tr>}</tbody></table>
        <div className="table-foot"><span>Mostrando {Math.min(n, rows.length)} de {214 + db.audit.length - 16} registros · retenção mínima de 5 anos</span>{n < rows.length && <button className="link" onClick={() => setN(n + 8)}>Carregar mais</button>}</div>
      </Card>
    </Page>
  )
}
