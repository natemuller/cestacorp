import { useState } from 'react'
import { Check, Minus } from 'lucide-react'
import { Page } from '../components/Layout'
import { Btn, Card, Field, Modal, Person, Pill, Select } from '../components/ui'
import { useStore } from '../lib/store'
import { addAudit } from '../lib/selectors'

const PERMS: [string, boolean][] = [['Ver a própria trilha, PDI, avaliações e certificados', true], ['Ver o organograma e a própria carreira', true], ['Ver ranking e pins', true], ['Ver dados de todos os colaboradores', false], ['Cadastrar cargos, faixas salariais e trilhas', false], ['Conduzir avaliações e montar PDIs', false], ['Admitir colaboradores e enviar convites', false], ['Alterar perfis e desativar usuários', false], ['Consultar a auditoria (somente leitura)', false]]
export default function Usuarios() {
  const { db, update, toast } = useStore()
  const [inv, setInv] = useState(false)
  const [f, setF] = useState({ name: '', email: '', profile: 'colaborador' })
  const shown = db.users.slice().sort((a, b) => (a.profile === b.profile ? 0 : a.profile === 'gestao' ? -1 : 1))
  const active = db.users.filter((u) => u.status !== 'disabled').length
  const invite = () => {
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) { toast('Informe nome e um e-mail válido.'); return }
    update((d) => { d.users.push({ id: 'u' + Date.now(), name: f.name, email: f.email, profile: f.profile as 'colaborador' | 'gestao', lastAccess: '—', status: 'invited' }); addAudit(d, 'Luana Thurow', 'Usuários', 'Criou', f.name, '', 'convite enviado') })
    toast(`Convite enviado para ${f.email}.`); setInv(false); setF({ name: '', email: '', profile: 'colaborador' })
  }
  const st = (s: string) => s === 'active' ? <Pill tone="green">Ativo</Pill> : s === 'invited' ? <Pill tone="amber">Convite enviado</Pill> : <Pill tone="gray">Desativado</Pill>
  const toggle = (id: string) => update((d) => { const u = d.users.find((x) => x.id === id)!; const before = u.status; u.status = u.status === 'disabled' ? 'active' : 'disabled'; addAudit(d, 'Luana Thurow', 'Usuários', 'Editou', u.name, before === 'disabled' ? 'desativado' : 'ativo', u.status === 'disabled' ? 'desativado' : 'ativo') })
  return (
    <Page title="Usuários & Acessos" sub="Contas de acesso e o que cada perfil pode ver e fazer">
      <div className="grid2" style={{ gridTemplateColumns: '1fr 468px', alignItems: 'start', gap: 20 }}>
        <Card>
          <div className="card-head"><h2 style={{ fontSize: 18 }}>Usuários ({active})</h2><Btn onClick={() => setInv(true)}>+ Convidar usuário</Btn></div>
          <table className="tbl"><thead><tr><th>Usuário</th><th>Perfil</th><th>Último acesso</th><th>Situação</th><th /></tr></thead>
            <tbody>{shown.map((u) => <tr key={u.id}><td><Person name={u.name} sub={u.email} /></td><td><Pill tone={u.profile === 'gestao' ? 'solid' : ''}>{u.profile === 'gestao' ? 'Gestão' : 'Colaborador'}</Pill></td><td className="muted">{u.lastAccess}</td><td>{st(u.status)}</td>
              <td>{u.email !== 'luana.thurow@cestacorp.com.br' && <button className="link" onClick={() => { toggle(u.id); toast(u.status === 'disabled' ? 'Usuário reativado.' : 'Usuário desativado.') }}>{u.status === 'disabled' ? 'Reativar' : 'Desativar'}</button>}</td></tr>)}</tbody></table>
        </Card>
        <div className="stack">
          <Card><h2 style={{ marginBottom: 12 }}>Permissões por perfil</h2>
            <table className="tbl"><thead><tr><th>O que pode fazer</th><th style={{ textAlign: 'center' }}>Colab.</th><th style={{ textAlign: 'center' }}>Gestão</th></tr></thead>
              <tbody>{PERMS.map(([l, c]) => <tr key={l}><td style={{ fontSize: 12 }}>{l}</td><td style={{ textAlign: 'center' }}>{c ? <Check size={15} color="#2f7a12" /> : <Minus size={15} color="#aab1e0" />}</td><td style={{ textAlign: 'center' }}><Check size={15} color="#2f7a12" /></td></tr>)}</tbody></table></Card>
          <div className="note amber" style={{ padding: 16 }}>Proposta em validação: RH e Administrador do backlog unificados no perfil Gestão, operado pela gestora.</div>
        </div>
      </div>
      {inv && <Modal title="Convidar usuário" sub="Um convite será enviado para criar a senha no primeiro acesso." onClose={() => setInv(false)} actions={<><Btn kind="ghost" onClick={() => setInv(false)}>Cancelar</Btn><Btn onClick={invite}>Enviar convite</Btn></>}>
        <Field label="Nome"><input className="input" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="E-mail corporativo"><input className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Perfil"><Select value={f.profile} onChange={(v) => setF({ ...f, profile: v })} options={[{ value: 'colaborador', label: 'Colaborador' }, { value: 'gestao', label: 'Gestão' }]} /></Field></Modal>}
    </Page>
  )
}
