import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { Page } from '../components/Layout'
import { Btn, Card, Field, Kpi, Modal, Pill, Tabs } from '../components/ui'
import { useStore } from '../lib/store'
import { ME, addAudit, certStatusLabel } from '../lib/selectors'
import { TODAY, fmtDate } from '../lib/format'

type T = 'todos' | 'cert' | 'comp' | 'avencer' | 'venc'
const TONE: Record<string, string> = { valid: 'green', expiring: 'amber', expired: 'red', validating: '' }

export default function Certificados() {
  const { db, update, toast } = useStore()
  const nav = useNavigate()
  const [tab, setTab] = useState<T>('todos')
  const [up, setUp] = useState(false)
  const [form, setForm] = useState({ title: '', source: '', code: '', expires: '', file: null as null | { name: string; size: string } })
  const fileRef = useRef<HTMLInputElement>(null)
  const certs = db.certificates.filter((c) => c.ownerId === ME)
  const isComp = (c: (typeof certs)[number]) => !c.code
  const cnt = { todos: certs.length, cert: certs.filter((c) => !isComp(c)).length, comp: certs.filter(isComp).length, avencer: certs.filter((c) => c.status === 'expiring').length, venc: certs.filter((c) => c.status === 'expired').length }
  const rows = certs.filter((c) => tab === 'todos' || (tab === 'cert' && !isComp(c)) || (tab === 'comp' && isComp(c)) || (tab === 'avencer' && c.status === 'expiring') || (tab === 'venc' && c.status === 'expired'))
  const validCount = certs.length - cnt.avencer - cnt.venc

  const send = () => {
    if (!form.title.trim() || !form.file) { toast('Informe o título e anexe o arquivo.'); return }
    update((d) => {
      d.certificates.unshift({ id: 'cert' + Date.now(), ownerId: ME, title: form.title, ext: form.file!.name.split('.').pop() ?? 'pdf', size: form.file!.size, source: form.source || '—', code: form.code || null, issued: TODAY, expires: form.expires || null, status: form.expires ? 'validating' : 'valid', courseId: null })
      addAudit(d, 'Natan Muller', 'Certificados', 'Enviou', form.title, '', 'documento enviado')
    })
    setUp(false); setForm({ title: '', source: '', code: '', expires: '', file: null }); toast('Documento enviado para sua biblioteca.')
  }
  return (
    <Page title="Meus certificados" sub="Biblioteca de evidências: certificados, comprovantes e datas de emissão e vencimento">
      <div className="grid4">
        <Kpi label="Documentos na biblioteca" value={certs.length} unit="certificados e comprovantes" />
        <Kpi label="Válidos" value={validCount} />
        <Kpi label="A vencer em 60 dias" value={cnt.avencer} valueColor="var(--amber-ink)" />
        <Kpi label="Vencidos" value={cnt.venc} unit="renovar o curso" valueColor="var(--red)" />
      </div>
      <div className="toolbar"><Tabs<T> value={tab} onChange={setTab} items={[{ id: 'todos', label: `Todos (${cnt.todos})` }, { id: 'cert', label: `Certificados (${cnt.cert})` }, { id: 'comp', label: `Comprovantes (${cnt.comp})` }, { id: 'avencer', label: `A vencer (${cnt.avencer})` }, { id: 'venc', label: `Vencidos (${cnt.venc})` }]} /><span className="spacer" /><Btn onClick={() => setUp(true)}>+ Enviar documento</Btn></div>
      <Card>
        <table className="tbl"><thead><tr><th>Documento</th><th>Código</th><th>Emissão</th><th>Vencimento</th><th>Status</th><th /></tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={c.id}>
              <td><div className="row"><span className="avatar" style={{ width: 30, height: 30, borderRadius: 7, background: c.status === 'expired' ? 'var(--red-soft)' : 'var(--line)', color: 'var(--muted)' }}><FileText size={14} /></span><div><div className="t1">{c.title}</div><div className="t2">{c.ext.toUpperCase()} · {c.size} · {c.source}</div></div></div></td>
              <td>{c.code ?? '—'}</td><td>{fmtDate(c.issued)}</td>
              <td style={{ fontWeight: c.status === 'expiring' || c.status === 'expired' ? 600 : 400, color: c.status === 'expired' ? 'var(--red)' : c.status === 'expiring' ? 'var(--amber-ink)' : undefined }}>{fmtDate(c.expires)}</td>
              <td>{c.expires || c.status === 'validating' ? <Pill tone={TONE[c.status]}>{certStatusLabel(c.status)}</Pill> : <Pill tone="gray">Sem validade</Pill>}</td>
              <td><div className="row" style={{ gap: 14 }}>
                <button className="link" onClick={() => toast(`${c.ext === 'png' ? 'Abrindo' : 'Download de'} “${c.title}” (simulado).`)}>{c.ext === 'png' ? 'Ver' : 'Baixar'}</button>
                {(c.status === 'expiring' || c.status === 'expired') && <button className="link" onClick={() => { if (c.courseId) nav(`/trilha/${c.courseId}/concluir`); else toast('Renovação solicitada à gestora (simulado).') }}>{c.status === 'expired' ? 'Refazer curso' : c.courseId ? 'Renovar curso' : 'Renovar'}</button>}
              </div></td>
            </tr>))}
            {!rows.length && <tr><td colSpan={6} className="empty">Nenhum documento nesta categoria.</td></tr>}
          </tbody></table>
        <div className="note" style={{ marginTop: 12, background: 'transparent', color: 'var(--muted)' }}>Você e sua gestora recebem aviso 60 e 30 dias antes do vencimento. A gestão vê a biblioteca de todos os colaboradores para auditorias do PQCRS.</div>
      </Card>
      {up && <Modal title="Enviar documento" sub="Certificados e comprovantes ficam na sua biblioteca de evidências." onClose={() => setUp(false)} actions={<><Btn kind="ghost" onClick={() => setUp(false)}>Cancelar</Btn><Btn onClick={send}>Enviar</Btn></>}>
        <Field label="Título do documento"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus /></Field>
        <div className="grid2"><Field label="Emissor"><input className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} /></Field><Field label="Código (opcional)"><input className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field></div>
        <Field label="Vencimento (opcional)"><input className="input" type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} /></Field>
        <div className="dropzone" onClick={() => fileRef.current?.click()}>{form.file ? <b>{form.file.name} · {form.file.size}</b> : 'Clique para escolher o arquivo (PDF, JPG ou PNG)'}
          <input ref={fileRef} hidden type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) setForm({ ...form, file: { name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB` } }) }} /></div>
        <button className="link" onClick={() => setForm({ ...form, file: { name: 'documento_exemplo.pdf', size: '120 KB' } })}>Usar arquivo de exemplo</button>
      </Modal>}
    </Page>
  )
}
