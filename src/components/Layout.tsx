import { useMemo, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search, LayoutDashboard, Route, Target, ClipboardCheck, Trophy, Award, Network, Users, BookOpen, CalendarCheck, Building2, ShieldCheck, LogOut, RotateCcw, User as UserIcon, CheckCircle2 } from 'lucide-react'
import { useStore } from '../lib/store'
import { Avatar } from './ui'

const colab = [
  { to: '/painel', label: 'Meu Painel', icon: LayoutDashboard },
  { to: '/trilha', label: 'Minha Trilha', icon: Route },
  { to: '/pdi', label: 'Meu PDI', icon: Target },
  { to: '/avaliacoes', label: 'Minhas Avaliações', icon: ClipboardCheck },
  { to: '/ranking', label: 'Ranking & Pins', icon: Trophy },
  { to: '/certificados', label: 'Certificados', icon: Award },
  { to: '/organograma', label: 'Organograma', icon: Network },
]
const gestao = [
  { to: '/gestao/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/gestao/colaboradores', label: 'Colaboradores', icon: Users },
  { to: '/gestao/trilhas', label: 'Trilhas & Cursos', icon: BookOpen },
  { to: '/gestao/ciclos', label: 'Avaliações Anuais', icon: CalendarCheck },
  { to: '/gestao/organograma', label: 'Organograma & Cargos', icon: Building2 },
  { to: '/gestao/usuarios', label: 'Usuários & Acessos', icon: UserIcon },
  { to: '/gestao/auditoria', label: 'Auditoria', icon: ShieldCheck },
]
// Rotas que mantêm o item de menu "ativo" mesmo em sub-telas
const alias: Record<string, string> = { '/gestao/avaliacao': '/gestao/ciclos', '/gestao/consenso': '/gestao/ciclos', '/gestao/pdi': '/gestao/colaboradores', '/gestao/feedback': '/gestao/colaboradores', '/gestao/cargos': '/gestao/organograma' }

export function Sidebar() {
  const { session, logout, reset, toast } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const [open, setOpen] = useState(false)
  const isG = session?.profile === 'gestao'
  const Item = ({ to, label, icon: I }: (typeof colab)[number]) => (
    <NavLink to={to} className={({ isActive }) => `nav-item ${isActive || (alias[Object.keys(alias).find((k) => loc.pathname.startsWith(k)) ?? ''] === to) ? 'active' : ''}`}>
      <I className="ico" strokeWidth={2} />{label}
    </NavLink>
  )
  return (
    <aside className="sidebar">
      <div className="logo">
        <img className="sym" src="./brand/logo-simbolo.svg" alt="" />
        <div><img className="word" src="./brand/logo-wordmark.svg" alt="Cestacorp" /><small>Evolução de Treinamentos</small></div>
      </div>
      {isG
        ? <><div className="nav-section">Gestão</div>{gestao.map((i) => <Item key={i.to} {...i} />)}</>
        : <><div className="nav-section">Minha área</div>{colab.map((i) => <Item key={i.to} {...i} />)}</>}
      <div className="grow" />
      <div style={{ position: 'relative' }}>
        {open && (
          <div className="user-menu">
            {!isG && <button onClick={() => { setOpen(false); nav('/perfil') }}><UserIcon size={14} />Meu perfil</button>}
            <button onClick={() => { setOpen(false); reset() }}><RotateCcw size={14} />Resetar demo</button>
            <button onClick={() => { setOpen(false); logout(); toast('Sessão encerrada.'); nav('/login') }}><LogOut size={14} />Sair</button>
          </div>
        )}
        <button className="user-card" onClick={() => setOpen(!open)} aria-label="Menu do usuário">
          <Avatar name={session!.name} size={34} />
          <div style={{ flex: 1 }}><b>{session!.name}</b><span>{session!.subtitle}</span></div>
        </button>
      </div>
    </aside>
  )
}

function GlobalSearch() {
  const { db, session } = useStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const res = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (t.length < 2) return null
    const courses = db.courses.filter((c) => (c.name + c.competence).toLowerCase().includes(t)).slice(0, 5)
    const people = session?.profile === 'gestao' ? db.employees.filter((e) => e.name.toLowerCase().includes(t)).slice(0, 5) : []
    return { courses, people }
  }, [q, db, session])
  const go = (to: string) => { setQ(''); nav(to) }
  return (
    <div className="search">
      <Search className="ico" />
      <input placeholder="Buscar curso, colaborador…" value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => setTimeout(() => setQ(''), 150)} aria-label="Busca global" />
      {res && (
        <div className="search-results">
          {res.courses.length > 0 && <h6>Cursos</h6>}
          {res.courses.map((c) => <button key={c.id} onMouseDown={() => go(session?.profile === 'gestao' ? '/gestao/trilhas' : '/trilha')}>{c.name}<small>{c.entity} · {c.modality} · {c.hours}h</small></button>)}
          {res.people.length > 0 && <h6>Colaboradores</h6>}
          {res.people.map((e) => <button key={e.id} onMouseDown={() => go(`/gestao/colaboradores/${e.id}`)}>{e.name}<small>{e.area}</small></button>)}
          {!res.courses.length && !res.people.length && <div className="empty sm">Nada encontrado.</div>}
        </div>
      )}
    </div>
  )
}

export function Page({ title, sub, children, right }: { title: string; sub?: ReactNode; children: ReactNode; right?: ReactNode }) {
  const { session, db } = useStore()
  const nav = useNavigate()
  const unread = db.alerts.some((a) => a.profile === session?.profile && !a.read)
  return (
    <div className="app">
      <Sidebar />
      <main className="content">
        <header className="topbar">
          <div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>
          <div className="right">
            {right}
            <GlobalSearch />
            <button className="bell" aria-label="Central de alertas" onClick={() => nav('/alertas')}><Bell size={18} />{unread && <span className="dot" />}</button>
            <span className="pill">Perfil: {session?.profile === 'gestao' ? 'Gestão' : 'Colaborador'}</span>
          </div>
        </header>
        {children}
      </main>
    </div>
  )
}
export const OkIcon = CheckCircle2
