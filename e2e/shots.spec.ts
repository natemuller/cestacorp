import { test } from '@playwright/test'
import fs from 'node:fs'

// Gera capturas de todas as telas (uso interno de conferência visual). SHOTS_DIR define o destino.
const dir = process.env.SHOTS_DIR
const colab = ['painel', 'trilha', 'trilha/c3/concluir', 'pdi', 'avaliacoes', 'ranking', 'certificados', 'organograma', 'perfil', 'alertas']
const gestao = ['gestao/dashboard', 'gestao/colaboradores', 'gestao/colaboradores/novo', 'gestao/trilhas', 'gestao/ciclos', 'gestao/avaliacao/ana', 'gestao/consenso/ana', 'gestao/pdi/ana', 'gestao/feedback/bruna', 'gestao/organograma', 'gestao/cargos', 'gestao/usuarios', 'gestao/auditoria']

test.skip(!dir, 'defina SHOTS_DIR para gerar capturas')
test('capturas', async ({ page }) => {
  fs.mkdirSync(dir!, { recursive: true })
  const login = async (email: string) => { await page.goto('/#/login'); await page.fill('input[type=email]', email); await page.fill('input[autocomplete=current-password]', 'cesta123'); await page.click('button[type=submit]') }
  await page.goto('/#/login'); await page.screenshot({ path: `${dir}/login.png` })
  await login('colaborador@email.com')
  for (const r of colab) { await page.goto(`/#/${r}`); await page.waitForTimeout(250); await page.screenshot({ path: `${dir}/${r.replace(/\//g, '_')}.png`, fullPage: true }) }
  await page.click('.user-card'); await page.click('text=Sair')
  await login('gestor@email.com')
  for (const r of gestao) { await page.goto(`/#/${r}`); await page.waitForTimeout(250); await page.screenshot({ path: `${dir}/${r.replace(/\//g, '_')}.png`, fullPage: true }) }
})
