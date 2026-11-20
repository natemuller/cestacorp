import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useStore } from './lib/store'
import Toasts from './components/Toasts'
import Login from './pages/Login'
import Painel from './pages/Painel'
import Trilha from './pages/Trilha'
import Concluir from './pages/Concluir'
import Pdi from './pages/Pdi'
import Ranking from './pages/Ranking'
import Certificados from './pages/Certificados'
import Organograma from './pages/Organograma'
import Perfil from './pages/Perfil'
import Alertas from './pages/Alertas'
import Autoavaliacao from './pages/Autoavaliacao'
import Dashboard from './pages/Dashboard'
import Colaboradores from './pages/Colaboradores'
import NovoColaborador from './pages/NovoColaborador'
import Trilhas from './pages/Trilhas'
import Ciclos from './pages/Ciclos'
import AvaliacaoGestora from './pages/AvaliacaoGestora'
import Consenso from './pages/Consenso'
import PdiLiderado from './pages/PdiLiderado'
import FeedbackIntegracao from './pages/FeedbackIntegracao'
import Cargos from './pages/Cargos'
import Usuarios from './pages/Usuarios'
import Auditoria from './pages/Auditoria'

function Guard({ children, gestao, colab }: { children: ReactNode; gestao?: boolean; colab?: boolean }) {
  const { session } = useStore()
  if (!session) return <Navigate to="/login" replace />
  if (gestao && session.profile !== 'gestao') return <Navigate to="/painel" replace />
  if (colab && session.profile === 'gestao') return <Navigate to="/gestao/dashboard" replace />
  return <>{children}</>
}

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

function Home() {
  const { session } = useStore()
  return <Navigate to={!session ? '/login' : session.profile === 'gestao' ? '/gestao/dashboard' : '/painel'} replace />
}

const P = ({ children }: { children: ReactNode }) => <Guard>{children}</Guard>
const C = ({ children }: { children: ReactNode }) => <Guard colab>{children}</Guard>
const G = ({ children }: { children: ReactNode }) => <Guard gestao>{children}</Guard>

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/painel" element={<C><Painel /></C>} />
        <Route path="/trilha" element={<C><Trilha /></C>} />
        <Route path="/trilha/:courseId/concluir" element={<C><Concluir /></C>} />
        <Route path="/pdi" element={<C><Pdi /></C>} />
        <Route path="/avaliacoes" element={<C><Autoavaliacao /></C>} />
        <Route path="/ranking" element={<C><Ranking /></C>} />
        <Route path="/certificados" element={<C><Certificados /></C>} />
        <Route path="/organograma" element={<C><Organograma /></C>} />
        <Route path="/perfil" element={<C><Perfil /></C>} />
        <Route path="/alertas" element={<P><Alertas /></P>} />
        <Route path="/gestao/dashboard" element={<G><Dashboard /></G>} />
        <Route path="/gestao/colaboradores" element={<G><Colaboradores /></G>} />
        <Route path="/gestao/colaboradores/novo" element={<G><NovoColaborador /></G>} />
        <Route path="/gestao/colaboradores/:id" element={<G><Perfil /></G>} />
        <Route path="/gestao/trilhas" element={<G><Trilhas /></G>} />
        <Route path="/gestao/ciclos" element={<G><Ciclos /></G>} />
        <Route path="/gestao/avaliacao/:id" element={<G><AvaliacaoGestora /></G>} />
        <Route path="/gestao/consenso/:id" element={<G><Consenso /></G>} />
        <Route path="/gestao/pdi/:id" element={<G><PdiLiderado /></G>} />
        <Route path="/gestao/feedback/:id" element={<G><FeedbackIntegracao /></G>} />
        <Route path="/gestao/organograma" element={<G><Organograma /></G>} />
        <Route path="/gestao/cargos" element={<G><Cargos /></G>} />
        <Route path="/gestao/usuarios" element={<G><Usuarios /></G>} />
        <Route path="/gestao/auditoria" element={<G><Auditoria /></G>} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Toasts />
    </>
  )
}
