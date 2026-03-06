import { test, expect } from '@playwright/test';

test.describe('QS Acadêmico — Testes do Sistema de Notas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://pharlea.github.io/02-TesteAutomatizado/');

    // Boas práticas — asserções de carregamento inicial da página
    await expect(page).toHaveTitle(/QS Acadêmico/);
    await expect(page.locator('#secao-cadastro')).toBeVisible();
  });

  // ========== GRUPO 1: Cadastro de Alunos ==========

  test.describe('Cadastro de Alunos', () => {

    test('deve exibir mensagem de placeholder quando não há alunos cadastrados', async ({ page }) => {
      // Estado inicial: tabela deve informar que está vazia
      await expect(page.getByText('Nenhum aluno cadastrado.')).toBeVisible();
    });

    test('deve ter os atributos corretos nos campos do formulário', async ({ page }) => {
      // Verificar placeholder do campo de nome (asserção de atributo)
      await expect(page.getByLabel('Nome do Aluno')).toHaveAttribute(
        'placeholder', 'Digite o nome completo'
      );
    });

    test('deve cadastrar um aluno com dados válidos', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('João Silva');
      await page.getByLabel('Nota 1').fill('7');
      await page.getByLabel('Nota 2').fill('8');
      await page.getByLabel('Nota 3').fill('6');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Verificar que o aluno aparece na tabela
      await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(1);
      await expect(page.getByText('João Silva')).toBeVisible();
    });

    test('deve exibir mensagem de sucesso após cadastro', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Ana Costa');
      await page.getByLabel('Nota 1').fill('9');
      await page.getByLabel('Nota 2').fill('8');
      await page.getByLabel('Nota 3').fill('10');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      await expect(page.locator('#mensagem')).toContainText('cadastrado com sucesso');
    });

    test('não deve cadastrar aluno sem nome', async ({ page }) => {
      await page.getByLabel('Nota 1').fill('7');
      await page.getByLabel('Nota 2').fill('8');
      await page.getByLabel('Nota 3').fill('6');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // A tabela deve continuar exibindo o placeholder de vazia
      await expect(page.locator('#tabela-alunos tbody td.texto-central')).toBeVisible();
    });

    test('deve cadastrar múltiplos alunos consecutivos e exibir todos na tabela', async ({ page }) => {
      const alunos = [
        { nome: 'Carlos Lima',   n1: '8', n2: '7', n3: '9' },
        { nome: 'Beatriz Souza', n1: '5', n2: '6', n3: '4' },
        { nome: 'Rafael Mendes', n1: '3', n2: '2', n3: '4' },
      ];

      for (const aluno of alunos) {
        await page.getByLabel('Nome do Aluno').fill(aluno.nome);
        await page.getByLabel('Nota 1').fill(aluno.n1);
        await page.getByLabel('Nota 2').fill(aluno.n2);
        await page.getByLabel('Nota 3').fill(aluno.n3);
        await page.getByRole('button', { name: 'Cadastrar' }).click();
      }

      // A tabela deve conter exatamente 3 linhas de dados
      await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(3);
    });

  });

  // ========== GRUPO 2: Cálculo de Média ==========

  test.describe('Cálculo de Média', () => {

    test('deve calcular a média aritmética das três notas', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Pedro Santos');
      await page.getByLabel('Nota 1').fill('8');
      await page.getByLabel('Nota 2').fill('6');
      await page.getByLabel('Nota 3').fill('10');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Média esperada: (8 + 6 + 10) / 3 = 8.00
      const celulaMedia = page.locator('#tabela-alunos tbody tr td').nth(4);
      await expect(celulaMedia).toHaveText('8.00');
    });

    /**
     * TESTE DE DETECÇÃO DE DEFEITO (Parte 5 da atividade)
     *
     * Este teste usa notas propositalmente distintas para forçar o sistema
     * a usar todas as três notas no cálculo. Se a função em app.js ignorar
     * a Nota 3 (defeito esperado), a média calculada será (4 + 6) / 2 = 5.00
     * em vez de (4 + 6 + 8) / 3 = 6.00, e o teste falhará — revelando o bug.
     *
     * Reflexão: com notas iguais (ex: 7, 7, 7) o defeito seria invisível,
     * pois qualquer subconjunto das notas produziria o mesmo resultado.
     */
    test('deve calcular corretamente a média usando as três notas com valores distintos', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Teste Defeito');
      await page.getByLabel('Nota 1').fill('4');
      await page.getByLabel('Nota 2').fill('6');
      await page.getByLabel('Nota 3').fill('8');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Média esperada: (4 + 6 + 8) / 3 = 6.00
      // Se o sistema ignorar a Nota 3, retornará 5.00 → defeito revelado
      const celulaMedia = page.locator('#tabela-alunos tbody tr td').nth(4);
      await expect(celulaMedia).toHaveText('6.00');
    });

  });

  // ========== GRUPO 3: Validação de Notas ==========

  test.describe('Validação de Notas', () => {

    test('não deve aceitar nota acima de 10', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Lucas Ferreira');
      await page.getByLabel('Nota 1').fill('11');
      await page.getByLabel('Nota 2').fill('8');
      await page.getByLabel('Nota 3').fill('7');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // A tabela deve permanecer sem registros válidos
      await expect(page.locator('#tabela-alunos tbody td.texto-central')).toBeVisible();
    });

    test('não deve aceitar nota negativa', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Mariana Nunes');
      await page.getByLabel('Nota 1').fill('-1');
      await page.getByLabel('Nota 2').fill('8');
      await page.getByLabel('Nota 3').fill('7');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // A tabela deve permanecer sem registros válidos
      await expect(page.locator('#tabela-alunos tbody td.texto-central')).toBeVisible();
    });

  });

  // ========== GRUPO 4: Busca por Nome ==========

  test.describe('Busca por Nome', () => {

    test('deve exibir apenas o aluno correspondente ao termo buscado', async ({ page }) => {
      // Cadastrar dois alunos
      await page.getByLabel('Nome do Aluno').fill('Fernanda Lima');
      await page.getByLabel('Nota 1').fill('8');
      await page.getByLabel('Nota 2').fill('7');
      await page.getByLabel('Nota 3').fill('9');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      await page.getByLabel('Nome do Aluno').fill('Roberto Alves');
      await page.getByLabel('Nota 1').fill('6');
      await page.getByLabel('Nota 2').fill('5');
      await page.getByLabel('Nota 3').fill('7');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Filtrar pelo nome do primeiro aluno
      await page.getByPlaceholder('Buscar por nome...').fill('Fernanda');

      // Apenas a linha de Fernanda deve estar visível
      await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(1);
      await expect(page.getByText('Fernanda Lima')).toBeVisible();
      // Asserção negativa: Roberto não deve aparecer após o filtro
      await expect(page.getByText('Roberto Alves')).not.toBeVisible();
    });

  });

  // ========== GRUPO 5: Exclusão de Alunos ==========

  test.describe('Exclusão de Alunos', () => {

    test('deve remover o aluno e deixar a tabela vazia', async ({ page }) => {
      // Cadastrar um aluno
      await page.getByLabel('Nome do Aluno').fill('Juliana Ramos');
      await page.getByLabel('Nota 1').fill('7');
      await page.getByLabel('Nota 2').fill('8');
      await page.getByLabel('Nota 3').fill('6');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Confirmar que o aluno foi cadastrado
      await expect(page.locator('#tabela-alunos tbody tr')).toHaveCount(1);

      // Clicar no botão de excluir da primeira (e única) linha
      await page.locator('#tabela-alunos tbody tr').first()
        .getByRole('button', { name: 'Excluir' }).click();

      // Asserção negativa: o nome não deve mais estar visível
      await expect(page.getByText('Juliana Ramos')).not.toBeVisible();
      // A tabela deve voltar ao estado de placeholder vazio
      await expect(page.locator('#tabela-alunos tbody td.texto-central')).toBeVisible();
    });

  });

  // ========== GRUPO 6: Estatísticas ==========

  test.describe('Estatísticas', () => {

    test('deve exibir contagens corretas nos cards após cadastrar alunos com situações distintas', async ({ page }) => {
      // Aprovado: média >= 7  →  (8 + 7 + 9) / 3 = 8.00
      await page.getByLabel('Nome do Aluno').fill('Aluno Aprovado');
      await page.getByLabel('Nota 1').fill('8');
      await page.getByLabel('Nota 2').fill('7');
      await page.getByLabel('Nota 3').fill('9');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Recuperação: 5 <= média < 7  →  (5 + 6 + 5) / 3 ≈ 5.33
      await page.getByLabel('Nome do Aluno').fill('Aluno Recuperacao');
      await page.getByLabel('Nota 1').fill('5');
      await page.getByLabel('Nota 2').fill('6');
      await page.getByLabel('Nota 3').fill('5');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Reprovado: média < 5  →  (2 + 3 + 1) / 3 = 2.00
      await page.getByLabel('Nome do Aluno').fill('Aluno Reprovado');
      await page.getByLabel('Nota 1').fill('2');
      await page.getByLabel('Nota 2').fill('3');
      await page.getByLabel('Nota 3').fill('1');
      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Verificar totais nos cards de estatísticas (asserção de conteúdo de card)
      await expect(page.locator('#card-total')).toContainText('3');
      await expect(page.locator('#card-aprovados')).toContainText('1');
      await expect(page.locator('#card-recuperacao')).toContainText('1');
      await expect(page.locator('#card-reprovados')).toContainText('1');
    });

  });

  // ========== GRUPO 7: Situação do Aluno ==========

  test.describe('Situação do Aluno', () => {

    test('deve exibir situação "Aprovado" para média >= 7', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Maria Aprovada');
      await page.getByLabel('Nota 1').fill('8');
      await page.getByLabel('Nota 2').fill('7');
      await page.getByLabel('Nota 3').fill('9');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Média: (8 + 7 + 9) / 3 = 8.00 → Aprovado
      const celulaSituacao = page.locator('#tabela-alunos tbody tr td').nth(5);
      await expect(celulaSituacao).toHaveText('Aprovado');
    });

    test('deve exibir situação "Reprovado" para média < 5', async ({ page }) => {
      await page.getByLabel('Nome do Aluno').fill('Tiago Reprovado');
      await page.getByLabel('Nota 1').fill('2');
      await page.getByLabel('Nota 2').fill('3');
      await page.getByLabel('Nota 3').fill('4');

      await page.getByRole('button', { name: 'Cadastrar' }).click();

      // Média: (2 + 3 + 4) / 3 = 3.00 → Reprovado
      const celulaSituacao = page.locator('#tabela-alunos tbody tr td').nth(5);
      await expect(celulaSituacao).toHaveText('Reprovado');
    });

  });

});