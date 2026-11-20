import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { DEMO_ACCOUNTS, useStore } from '../lib/store'
import { Field, Btn } from '../components/ui'

export default function Login() {
  const { session, login, toast } = useStore()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (session) return <Navigate to={session.profile === 'gestao' ? '/gestao/dashboard' : '/painel'} replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const r = login(email, pw)
    if (r) setErr(r)
    else { const a = DEMO_ACCOUNTS.find((x) => x.email === email.trim().toLowerCase())!; nav(a.profile === 'gestao' ? '/gestao/dashboard' : '/painel') }
  }
  return (
    <div className="login">
      <section className="hero">
        <div className="row"><img src="./brand/logo-simbolo.svg" alt="" height={50} /><img src="./brand/logo-wordmark.svg" alt="Cestacorp" height={32} /></div>
        <h1>Sua evolução profissional em um só lugar</h1>
        <p>Acompanhe sua trilha de treinamentos, certificados, PDI e avaliações sem planilhas.</p>
        <ul style={{ padding: 0, margin: 0 }}>
          {['Trilha obrigatória do seu cargo', 'Certificados e evidências organizados', 'Ranking e pins da sua evolução'].map((t) => <li key={t}><i><Check size={14} /></i>{t}</li>)}
        </ul>
        <div className="foot">Segurança e confiança para o seu negócio ir mais longe!</div>
      </section>
      <section className="panel">
        <div className="box">
          <h2>Entrar</h2>
          <p className="muted sm" style={{ marginTop: 6 }}>Use o e-mail cadastrado pela sua gestora</p>
          <form onSubmit={submit}>
            <Field label="E-mail"><input className="input" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(null) }} placeholder="voce@cestacorp.com.br" autoComplete="username" /></Field>
            <Field label="Senha" error={err ?? undefined}>
              <div className="pw">
                <input className="input" type={show ? 'text' : 'password'} value={pw} onChange={(e) => { setPw(e.target.value); setErr(null) }} autoComplete="current-password" />
                <button type="button" onClick={() => setShow(!show)}>{show ? 'Ocultar' : 'Mostrar'}</button>
              </div>
            </Field>
            <div className="row between">
              <label className="row sm" style={{ gap: 8 }}><input type="checkbox" defaultChecked />Lembrar de mim</label>
              <button type="button" className="link" onClick={() => toast('Demo: o envio de redefinição de senha não está ativo.')}>Esqueci minha senha</button>
            </div>
            <Btn type="submit" style={{ padding: 14 }}>Entrar</Btn>
          </form>
          <div className="note" style={{ marginTop: 16 }}>Primeiro acesso? Abra o convite que chegou no seu e-mail para criar sua senha.</div>
          <p className="muted xs" style={{ textAlign: 'center', marginTop: 14 }}>O sistema identifica seu perfil (Colaborador ou Gestão) automaticamente.</p>
        </div>
        <p className="muted xs" style={{ marginTop: 18 }}>© 2026 Cestacorp · Projeto Service Learning PUCRS</p>
      </section>
    </div>
  )
}
