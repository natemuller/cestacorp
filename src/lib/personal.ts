import type { DB, Personal } from './types'
import { ANA } from './ana'

// Fatia "pessoal" do usuário logado (telas da "Minha área").
// Somente o perfil Colaborador (Natan) tem "Minha área"; o perfil Gestão só usa as telas de gestão.
export function mineOf(d: DB, _id?: string): Personal {
  return new Proxy(d as unknown as Personal, {
    get(t, k) {
      switch (k) {
        case 'self': return d.employees.find((e) => e.id === ANA)
        case 'roleName': return 'Analista Fiscal Júnior'
        case 'managerName': return 'Luana Thurow'
        case 'managerTitle': return 'Sócia-diretora'
        case 'evaluation': return d.evaluations[ANA]
        case 'cycle': return d.cycleRows[ANA]
        case 'painel': return NATAN_PAINEL
        case 'history': return NATAN_HISTORY
        default: return Reflect.get(t, k)
      }
    },
  })
}

const NATAN_PAINEL: Personal['painel'] = {
  banner: { tone: 'amber', title: 'Você está 18% atrasado nos treinamentos de outubro', text: 'Dia 14 de 31 · 6h realizadas de 12h previstas até hoje (meta do mês: 26h). 2 cursos da trilha obrigatória vencem nos próximos 7 dias.', cta: 'Ver pendências', to: '/trilha?f=overdue' },
  trailFoot: 'Meta: 100% até 31/12', hoursFoot: 'Média da área Fiscal: 41h', hoursGoal: 60, areaLabel: 'na área Fiscal', chartNote: 'Meta mensal da trilha: 5h',
  results: [['Apurações entregues no prazo', '96% / 100%', 96, 'amber'], ['Retrabalho em notas', '1,5% / < 2%', 100, ''], ['Trilha obrigatória do cargo', '72% / 100%', 72, 'amber'], ['Satisfação dos clientes', '9,2 / ≥ 9', 100, '']],
}
const NATAN_HISTORY: Personal['history'] = [
  ['2025-06-12', 'Admissão como Auxiliar Fiscal', 'Onboarding e feedbacks 25/50/75 dias concluídos', 'green'],
  ['2026-03-01', 'Promoção para Analista Fiscal Júnior', 'Trilha do cargo de Auxiliar 100% + avaliação 2025', 'green'],
  ['2026-10-15', 'Autoavaliação do ciclo 2026 iniciada', 'PDI 2026 em andamento · 40%', 'blue'],
]
