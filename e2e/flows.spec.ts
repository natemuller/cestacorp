import { expect, test, type Page } from '@playwright/test'

const login = async (page: Page, email: string) => {
  await page.goto('/#/login')
  await page.fill('input[type=email]', email)
  await page.fill('input[autocomplete=current-password]', 'cesta123')
  await page.click('button[type=submit]')
}
const logout = async (page: Page) => { await page.click('.user-card'); await page.getByRole('button', { name: 'Sair' }).click() }
const COLAB = 'colaborador@email.com', GESTOR = 'gestor@email.com'
const errors = (page: Page) => { const e: string[] = []; page.on('pageerror', (x) => e.push(x.message)); return e }

test('login: valida credenciais e redireciona por perfil', async ({ page }) => {
  await page.goto('/#/painel')
  await expect(page).toHaveURL(/login/)
  await page.fill('input[type=email]', COLAB); await page.fill('input[autocomplete=current-password]', 'errada'); await page.click('button[type=submit]')
  await expect(page.getByText('E-mail ou senha inválidos.')).toBeVisible()
  await login(page, COLAB)
  await expect(page.getByRole('heading', { name: 'Olá, Natan 👋' })).toBeVisible()
  await expect(page.getByText('Gestão', { exact: true })).toHaveCount(0)
  await page.goto('/#/gestao/dashboard')
  await expect(page.getByRole('heading', { name: 'Olá, Natan 👋' })).toBeVisible() // colaborador não acessa gestão
  await logout(page); await login(page, GESTOR)
  await expect(page.getByRole('heading', { name: 'Dashboard de Treinamentos' })).toBeVisible()
})

test('colaborador: percorre todas as telas sem erros', async ({ page }) => {
  const errs = errors(page)
  await login(page, COLAB)
  const tour: [string, string][] = [['painel', 'Olá, Natan'], ['trilha', 'Minha Trilha de Conhecimentos'], ['trilha/c3/concluir', 'Registrar conclusão do treinamento'], ['pdi', 'Meu Plano de Desenvolvimento Individual'], ['avaliacoes', 'Minha autoavaliação'], ['ranking', 'Ranking & Pins'], ['certificados', 'Meus certificados'], ['organograma', 'Organograma'], ['perfil', 'Meu perfil'], ['alertas', 'Central de alertas']]
  for (const [r, h] of tour) { await page.goto(`/#/${r}`); await expect(page.getByRole('heading', { level: 1 })).toContainText(h) }
  expect(errs).toEqual([])
})

test('gestão: percorre todas as telas sem erros', async ({ page }) => {
  const errs = errors(page)
  await login(page, GESTOR)
  const tour: [string, string][] = [['gestao/dashboard', 'Dashboard de Treinamentos'], ['gestao/colaboradores', 'Colaboradores'], ['gestao/colaboradores/novo', 'Novo colaborador'], ['gestao/colaboradores/ana', 'Perfil · Natan Muller'], ['gestao/trilhas', 'Trilhas & Cursos'], ['gestao/ciclos', 'Avaliações Anuais'], ['gestao/avaliacao/ana', 'Avaliação de Desempenho Anual'], ['gestao/consenso/ana', 'Consenso da avaliação'], ['gestao/pdi/ana', 'PDI · Natan Muller'], ['gestao/feedback/bruna', 'Feedback de 25 dias'], ['gestao/organograma', 'Organograma & Plano de Cargos'], ['gestao/cargos', 'Plano de Cargos e Salários'], ['gestao/usuarios', 'Usuários & Acessos'], ['gestao/auditoria', 'Auditoria'], ['alertas', 'Central de alertas']]
  for (const [r, h] of tour) { await page.goto(`/#/${r}`); await expect(page.getByRole('heading', { level: 1 })).toContainText(h) }
  expect(errs).toEqual([])
})

test('jornada completa: conclusão de curso → autoavaliação → gestora → consenso → PDI publicado', async ({ page }) => {
  const errs = errors(page)
  await login(page, COLAB)
  // 1) Registrar conclusão
  await page.getByRole('button', { name: 'Ver pendências' }).click()
  await expect(page.getByRole('tab', { name: /Vencidos \(1\)/ })).toHaveAttribute('aria-selected', 'true')
  await page.goto('/#/trilha')
  await page.locator('tr', { hasText: 'Comunicação Verbal e Não Verbal' }).getByRole('button', { name: 'Registrar conclusão' }).click()
  await expect(page.getByText('Trilha obrigatória sobe de 72% para 78%')).toBeVisible()
  await page.getByRole('button', { name: 'Enviar para validação' }).click()
  await expect(page.getByText('Conclusão enviada para validação da gestora')).toBeVisible()
  await expect(page.locator('tr', { hasText: 'Comunicação Verbal e Não Verbal' }).getByText('Em validação')).toBeVisible()
  await page.goto('/#/painel')
  await expect(page.getByText('78%').first()).toBeVisible()
  await expect(page.getByText('1.270')).toBeVisible()
  await page.goto('/#/certificados'); await expect(page.locator('tr', { hasText: 'Comunicação Verbal' }).getByText('Em validação')).toBeVisible()
  // 2) Autoavaliação: bloqueia envio incompleto
  await page.goto('/#/avaliacoes')
  await page.getByRole('button', { name: 'Enviar autoavaliação' }).click()
  await expect(page.getByText('Responda os 2 critérios pendentes')).toBeVisible()
  for (const crit of ['Proatividade', 'Foco no cliente']) await page.locator('div.row', { hasText: crit }).getByRole('button', { name: 'Pleno' }).click()
  await page.getByRole('button', { name: 'Enviar autoavaliação' }).click()
  await expect(page.getByText('Autoavaliação enviada · aguardando a gestora')).toBeVisible()
  // 3) Gestora avalia
  await logout(page); await login(page, GESTOR)
  await page.goto('/#/gestao/ciclos')
  const row = page.locator('tr', { hasText: 'Natan Muller' })
  await expect(row.getByText('Pendente')).toBeVisible()
  await row.getByRole('button', { name: 'Avaliar' }).click()
  await page.getByRole('button', { name: 'Enviar para consenso' }).click()
  await expect(page).toHaveURL(/consenso\/ana/)
  await expect(page.getByRole('heading', { name: 'Consenso da avaliação' })).toBeVisible()
  await page.getByRole('button', { name: 'Concluir e gerar PDI' }).click()
  await expect(page).toHaveURL(/gestao\/pdi\/ana/)
  await expect(page.getByText('Rascunho', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Publicar PDI para a colaborador' }).click()
  await expect(page.getByText('Publicado', { exact: true })).toBeVisible()
  // 4) Colaborador recebe aviso
  await logout(page); await login(page, COLAB)
  await page.goto('/#/alertas')
  await expect(page.getByText('Seu novo PDI 2026–2027 foi publicado')).toBeVisible()
  // Auditoria registra as ações
  await logout(page); await login(page, GESTOR)
  await page.goto('/#/gestao/auditoria')
  await expect(page.getByText('Comunicação Verbal e Não Verbal · conclusão').first()).toBeVisible()
  expect(errs).toEqual([])
})

test('persistência: estado sobrevive ao reload e "Resetar demo" restaura', async ({ page }) => {
  await login(page, COLAB)
  await page.goto('/#/certificados')
  await page.getByRole('button', { name: '+ Enviar documento' }).click()
  await page.fill('input.input >> nth=0', 'Documento de teste')
  await page.getByRole('button', { name: 'Usar arquivo de exemplo' }).click()
  await page.getByRole('button', { name: 'Enviar', exact: true }).click()
  await expect(page.getByText('Documento de teste')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Documento de teste')).toBeVisible()
  await page.click('.user-card'); await page.getByRole('button', { name: 'Resetar demo' }).click()
  await expect(page.getByText('Documento de teste')).toHaveCount(0)
})

test('gestão: novo colaborador, usuários, feedback e trilhas', async ({ page }) => {
  const errs = errors(page)
  await login(page, GESTOR)
  await page.goto('/#/gestao/colaboradores/novo')
  await page.getByRole('button', { name: 'Admitir e enviar convite' }).click()
  await expect(page.getByText('Informe o nome completo.')).toBeVisible()
  await page.getByRole('button', { name: 'Preencher exemplo' }).click()
  await page.getByRole('button', { name: 'Admitir e enviar convite' }).click()
  await expect(page).toHaveURL(/gestao\/colaboradores$/)
  await expect(page.locator('tbody').getByText('Pedro Almeida')).toBeVisible()
  await page.goto('/#/gestao/usuarios')
  await expect(page.locator('tr', { hasText: 'Pedro Almeida' }).getByText('Convite enviado')).toBeVisible()
  await page.locator('tr', { hasText: 'Pedro Almeida' }).getByRole('button', { name: 'Desativar' }).click()
  await expect(page.locator('tr', { hasText: 'Pedro Almeida' }).getByText('Desativado')).toBeVisible()
  // feedback de integração
  await page.goto('/#/gestao/feedback/bruna')
  await page.getByRole('button', { name: 'Concluir feedback' }).click()
  await expect(page).toHaveURL(/gestao\/colaboradores$/)
  // trilhas: alternar obrigatoriedade gera auditoria
  await page.goto('/#/gestao/trilhas')
  await page.getByRole('switch', { name: /Obrigatório Excel Básico/ }).first().click()
  await page.goto('/#/gestao/auditoria')
  await expect(page.getByText('Excel Básico · Analista Fiscal Júnior').first()).toBeVisible()
  await page.getByLabel('Módulo').count()
  expect(errs).toEqual([])
})

test('gestão: cargos, organograma e dashboard', async ({ page }) => {
  await login(page, GESTOR)
  await page.goto('/#/gestao/organograma')
  await page.locator('.org .node', { hasText: 'Analista Fiscal Pleno' }).click()
  await expect(page.getByRole('heading', { name: 'Analista Fiscal Pleno' })).toBeVisible()
  await page.getByRole('button', { name: 'Editar cargo' }).click()
  await expect(page).toHaveURL(/gestao\/cargos/)
  await page.locator('input[type=number]').first().fill('4300')
  await page.getByRole('button', { name: 'Salvar cargo' }).click()
  await expect(page.getByText('4.300 – 5.200')).toBeVisible()
  await page.goto('/#/gestao/dashboard')
  await page.locator('tr', { hasText: 'Paula Silveira' }).getByRole('button', { name: 'Notificar' }).click()
  await expect(page.locator('tr', { hasText: 'Paula Silveira' }).getByRole('button', { name: 'Notificado' })).toBeDisabled()
})

test('login não exibe credenciais e saudações respeitam o perfil', async ({ page }) => {
  await page.goto('/#/login')
  await expect(page.getByText('Acessos da demonstração')).toHaveCount(0)
  await expect(page.getByText('senha: cesta123')).toHaveCount(0)
  await login(page, GESTOR)
  await expect(page.getByRole('heading', { name: 'Dashboard de Treinamentos' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/Marieri|Gazen|Ana Souza|Olá,/)
})

test('gestor: só enxerga telas de gestão, sem "Minha área" nem saudação de colaborador', async ({ page }) => {
  const errs = errors(page)
  await login(page, GESTOR)
  await expect(page).toHaveURL(/gestao\/dashboard/)
  await expect(page.locator('.sidebar')).not.toContainText('Minha área')
  for (const t of ['Meu Painel', 'Minha Trilha', 'Meu PDI', 'Minhas Avaliações', 'Ranking & Pins', 'Certificados']) await expect(page.locator('.sidebar')).not.toContainText(t)
  for (const t of ['Dashboard', 'Colaboradores', 'Trilhas & Cursos', 'Avaliações Anuais', 'Organograma & Cargos', 'Usuários & Acessos', 'Auditoria']) await expect(page.locator('.sidebar')).toContainText(t)
  for (const r of ['painel', 'trilha', 'pdi', 'avaliacoes', 'ranking', 'certificados', 'organograma', 'perfil']) {
    await page.goto(`/#/${r}`)
    await expect(page).toHaveURL(/gestao\/dashboard/)
  }
  await expect(page.locator('body')).not.toContainText(/Olá,/)
  // visão da gestão sobre o colaborador continua disponível
  await page.goto('/#/gestao/colaboradores/ana')
  await expect(page.getByRole('heading', { name: /Perfil · Natan Muller/ })).toBeVisible()
  await expect(page.getByText('Minha trilha')).toHaveCount(0)
  expect(errs).toEqual([])
})
