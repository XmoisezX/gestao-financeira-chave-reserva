/**
 * Financial Engine — Calculations for Chave Reserva
 * Recalculates Projeção Mensal dynamically based on:
 * - Premissas (Churn rate, Taxa Impostos, Ticket médio)
 * - Planos, Aluguel, Pacotes (MRR Médio por Cliente)
 * - Aquisição (Distribuição por canal: Tráfego, Listas, Influenciadores, CAC)
 * - Infraestrutura (Gatilhos por faixa de clientes)
 * - Equipe & Remuneração (Gatilhos por número de clientes ativos)
 * - Taxas de Pagamento (Taxa fixa e variável ponderada)
 */

export function calculateAverageTicket(planos, aluguel, pacotes, premissas) {
  if (!planos || planos.length === 0) return 312.08;
  const totalMix = planos.reduce((acc, p) => acc + (Number(p.previsaoVendas) || 0), 0);
  if (totalMix <= 0) return 312.08;

  const propAnualPremissa = premissas ? premissas.find(p => String(p.premissa).toLowerCase().includes('anuais')) : null;
  const propAnualPct = propAnualPremissa
    ? parseFloat(String(propAnualPremissa.valor).replace('%', '').replace(',', '.'))
    : 30;

  const propAnual = (isNaN(propAnualPct) || propAnualPct < 0) ? 0.3 : (propAnualPct > 100 ? 1 : propAnualPct / 100);
  const propMensal = 1 - propAnual;

  const weightedPlanos = planos.reduce((acc, p) => {
    const mix = Number(p.previsaoVendas) || 0;
    const pMensal = Number(p.mensal) || 0;
    const pAnualMensal = Number(p.anualMensal) || (Number(p.anualVista) / 12) || pMensal;
    const planPricePonderado = (pMensal * propMensal) + (pAnualMensal * propAnual);
    return acc + (planPricePonderado * mix);
  }, 0) / totalMix;

  return weightedPlanos > 0 ? weightedPlanos : 312.08;
}

export function calculateInfraForClients(numClients, infraestrutura) {
  if (!infraestrutura || infraestrutura.length === 0) return 478;
  if (numClients <= 100) {
    return Number(infraestrutura[0]?.total) || 478;
  } else if (numClients <= 300) {
    return Number(infraestrutura[1]?.total) || 1154;
  } else {
    return Number(infraestrutura[2]?.total) || 2454;
  }
}

export function calculateTeamCostForClients(numClients, equipe) {
  if (!equipe || equipe.length === 0) return 0;
  return equipe.reduce((acc, member) => {
    let cost = 0;
    const remStr = String(member.remuneracao || '');
    const numMatch = remStr.match(/R\$\s*([\d\.,]+)/);
    if (numMatch) {
      cost = parseFloat(numMatch[1].replace(/\./g, '').replace(',', '.'));
    } else if (remStr.includes('%')) {
      cost = 500; 
    }

    const gatilho = String(member.gatilho || '').toLowerCase();
    if (gatilho.includes('100 clientes') && numClients < 100) cost = cost * 0.5;
    if (gatilho.includes('300 clientes') && numClients < 300) cost = cost * 0.5;

    return acc + (isNaN(cost) ? 0 : cost);
  }, 0);
}

export function getNextMonthString(lastMonthStr) {
  if (!lastMonthStr) return 'Jan/2028';
  const monthNamesPT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const monthNamesEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const parts = String(lastMonthStr).split('/');
  if (parts.length < 2) return 'Jan/2028';

  const mStr = parts[0].trim();
  let year = parseInt(parts[1].trim(), 10);
  if (isNaN(year)) year = 2027;
  if (year < 100) year += 2000;

  let mIdx = monthNamesEN.findIndex(m => m.toLowerCase() === mStr.toLowerCase());
  if (mIdx === -1) {
    mIdx = monthNamesPT.findIndex(m => m.toLowerCase() === mStr.toLowerCase());
  }
  if (mIdx === -1) mIdx = 11;

  let nextIdx = mIdx + 1;
  let nextYear = year;
  if (nextIdx >= 12) {
    nextIdx = 0;
    nextYear += 1;
  }

  const isPT = monthNamesPT.some(m => m.toLowerCase() === mStr.toLowerCase());
  const monthName = isPT ? monthNamesPT[nextIdx] : monthNamesEN[nextIdx];

  return `${monthName}/${nextYear}`;
}

function parseMonthName(name) {
  if (!name) return 1;
  const n = String(name).toLowerCase().slice(0, 3);
  const map = {
    jan: 1, fev: 2, feb: 2, mar: 3, abr: 4, apr: 4, mai: 5, may: 5, jun: 6,
    jul: 7, ago: 8, aug: 8, set: 9, sep: 9, out: 10, oct: 10, nov: 11, dez: 12, dec: 12
  };
  return map[n] || 1;
}

function getMonthYearIndex(monthStr) {
  if (!monthStr) return 0;
  const str = String(monthStr).trim();
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10) || 1;
      const year = parseInt(parts[2], 10) || 2026;
      return year * 12 + month;
    } else if (parts.length === 2) {
      let month = parseInt(parts[0], 10);
      let year = parseInt(parts[1], 10) || 2026;
      if (isNaN(month)) month = parseMonthName(parts[0]);
      return year * 12 + month;
    }
  }
  const parts = str.split(/[\/\s-]+/);
  if (parts.length >= 2) {
    const month = parseMonthName(parts[0]);
    let year = parseInt(parts[1], 10) || 2026;
    if (year < 100) year += 2000;
    return year * 12 + month;
  }
  return 0;
}

export function recalculateProjecaoMensal({
  projecaoCurrent,
  premissas,
  planos,
  aluguel,
  pacotes,
  aquisicao,
  infraestrutura,
  equipe,
  taxasPagamento
}) {
  if (!projecaoCurrent || projecaoCurrent.length === 0) return projecaoCurrent;

  // Extract Anual vs Mensal proportions from Premissas
  const propAnualPremissa = premissas ? premissas.find(p => String(p.premissa).toLowerCase().includes('anuais')) : null;
  const propMensalPremissa = premissas ? premissas.find(p => String(p.premissa).toLowerCase().includes('mensais')) : null;

  const propAnualPct = propAnualPremissa
    ? parseFloat(String(propAnualPremissa.valor).replace('%', '').replace(',', '.')) || 30
    : 30;
  const propMensalPct = propMensalPremissa
    ? parseFloat(String(propMensalPremissa.valor).replace('%', '').replace(',', '.')) || (100 - propAnualPct)
    : (100 - propAnualPct);

  const propAnual = propAnualPct / 100;
  const propMensal = propMensalPct / 100;

  // Extract ticket médio base ponderado pelos planos
  const weightedPlanos = calculateAverageTicket(planos, aluguel, pacotes, premissas);
  const pacotesValor = pacotes ? pacotes.reduce((acc, p) => acc + (Number(p.valor) * Number(p.previsaoVendas || 0.1)), 0) : 10;

  // Extract churn premise
  const churnPremissa = premissas ? premissas.find(p => String(p.premissa).toLowerCase().includes('churn')) : null;
  const churnRatePct = churnPremissa
    ? parseFloat(String(churnPremissa.valor).replace('%', '').replace(',', '.')) || 3
    : 3;

  // Extract comissao premissas
  const comissaoVendasPremissa = premissas ? premissas.find(p => {
    const name = String(p.premissa).toLowerCase();
    return name.includes('comissão de vendas') || name.includes('comissao de vendas');
  }) : null;
  const comissaoVendasPct = comissaoVendasPremissa
    ? parseFloat(String(comissaoVendasPremissa.valor).replace('%', '').replace(',', '.')) || 50
    : 50;

  const bonusAnualPremissa = premissas ? premissas.find(p => {
    const name = String(p.premissa).toLowerCase();
    return name.includes('bônus venda anual') || name.includes('bonus venda anual');
  }) : null;
  const bonusAnualPct = bonusAnualPremissa
    ? parseFloat(String(bonusAnualPremissa.valor).replace('%', '').replace(',', '.')) || 20
    : 20;

  const comissaoSuportePremissa = premissas ? premissas.find(p => {
    const name = String(p.premissa).toLowerCase();
    return name.includes('comissão de suporte') || name.includes('comissao de suporte');
  }) : null;
  const comissaoSuportePct = comissaoSuportePremissa
    ? parseFloat(String(comissaoSuportePremissa.valor).replace('%', '').replace(',', '.')) || 50
    : 50;

  // Calculate ticket Mensal Ponderado & Ticket Anual Ponderado da 1ª parcela
  const ticketMensalPonderado = planos ? planos.reduce((acc, p) => {
    const val = Number(p.mensal) || 0;
    const mix = Number(p.previsaoVendas) || 0;
    return acc + (val * mix);
  }, 0) : 332;

  const ticketAnualPonderado = planos ? planos.reduce((acc, p) => {
    const val = Number(p.anualMensal) || (Number(p.anualVista) / 12) || Number(p.mensal) || 0;
    const mix = Number(p.previsaoVendas) || 0;
    return acc + (val * mix);
  }, 0) : 265.6;

  const ticketPonderado1a = (ticketMensalPonderado * propMensal) + (ticketAnualPonderado * propAnual);

  const impostoPct = 0.08; 
  let accumulatedCaixa = 0;
  let runningClientesAtivos = 0;

  return projecaoCurrent.map((m, index) => {
    // Core KPIs
    const novosLiquidos = Number(m.novosLiquidosMeta || 0);

    // Clientes Meta: No 1º mês = novosLiquidos (ex: 5). Nos meses seguintes = Clientes Ativos do mês anterior + novosLiquidos do mês atual (ex: 5 + 7 = 12)
    let clientesAtivosMeta;
    if (m.isManualClients) {
      clientesAtivosMeta = Number(m.clientesAtivosMeta || 0);
    } else if (index === 0) {
      clientesAtivosMeta = novosLiquidos;
    } else {
      clientesAtivosMeta = Math.max(0, runningClientesAtivos + novosLiquidos);
    }
    runningClientesAtivos = clientesAtivosMeta;

    // Churn: Clientes Meta * Taxa Churn (arredondado: >= 0.5 para cima, < 0.5 para baixo via Math.round)
    const calculatedChurn = Math.max(0, Math.round(clientesAtivosMeta * (churnRatePct / 100)));
    const churn = m.isManualChurn ? Number(m.churn || 0) : calculatedChurn;

    // 1. Novos Brutos Necessários: Novos líquidos + Churn
    const novosBrutosNecessarios = m.isManualNovosBrutos ? Number(m.novosBrutosNecessarios || 0) : (novosLiquidos + churn);

    // 2. MRRs
    const currentProjMonthIndex = getMonthYearIndex(m.month);

    const calculatedAluguelValor = aluguel ? aluguel.reduce((acc, a) => {
      const launchIndex = getMonthYearIndex(a.previsaoLancamento);
      if (launchIndex > 0 && currentProjMonthIndex < launchIndex) {
        return acc; // Módulo ainda não lançado neste mês
      }
      const aMensal = Number(a.mensal) || 0;
      const aAnualMensal = Number(a.anualMensal) || (Number(a.anualVista) / 12) || aMensal;
      const pricePonderado = (aMensal * propMensal) + (aAnualMensal * propAnual);
      const mix = Number(a.previsaoVendas) || 0;
      return acc + (pricePonderado * mix);
    }, 0) : 0;

    const calculatedPacotesValor = pacotes ? pacotes.reduce((acc, p) => {
      const launchIndex = getMonthYearIndex(p.previsaoLancamento);
      if (launchIndex > 0 && currentProjMonthIndex < launchIndex) {
        return acc; // Pacote ainda não lançado neste mês
      }
      const val = Number(p.valor) || 0;
      const mix = Number(p.previsaoVendas) || 0;
      return acc + (val * mix);
    }, 0) : 0;

    const mrrMeta = m.isManualMrrMeta ? Number(m.mrrMeta || 0) : Math.round(clientesAtivosMeta * (weightedPlanos || 332));
    const mrrAluguel = m.isManualMrrAluguel ? Number(m.mrrAluguel || 0) : Math.round(clientesAtivosMeta * calculatedAluguelValor);
    const mrrPacotes = m.isManualMrrPacotes ? Number(m.mrrPacotes || 0) : Math.round(clientesAtivosMeta * calculatedPacotesValor);
    const mrrTotal = mrrMeta + mrrAluguel + mrrPacotes;

    // 3. Comissões e Bônus Venda Anual
    const calculatedComissaoVendas = Math.round(novosBrutosNecessarios * ticketPonderado1a * (comissaoVendasPct / 100));
    const calculatedBonusVendaAnual = Math.round((novosBrutosNecessarios * propAnual) * ticketAnualPonderado * (bonusAnualPct / 100));

    const comissaoVendas = calculatedComissaoVendas;
    const bonusVendaAnual = calculatedBonusVendaAnual;

    // 3.1 Comissão de Suporte: 1ª parcela/à vista em Anuais no próprio mês + 2ª parcela em Mensais no mês seguinte
    const comissaoSuporteAnualAtual = (novosBrutosNecessarios * propAnual) * ticketAnualPonderado * (comissaoSuportePct / 100);
    let comissaoSuporteMensalAnterior = 0;
    if (index > 0) {
      const prevMonthObj = projecaoCurrent[index - 1];
      const prevNovosLiquidos = Number(prevMonthObj?.novosLiquidosMeta || 0);
      const prevManualChurn = prevMonthObj?.isManualChurn ? Number(prevMonthObj.churn || 0) : Math.max(0, Math.round(prevNovosLiquidos * (churnRatePct / 100)));
      const prevNovosBrutos = prevMonthObj?.isManualNovosBrutos ? Number(prevMonthObj.novosBrutosNecessarios || 0) : (prevNovosLiquidos + prevManualChurn);
      comissaoSuporteMensalAnterior = (prevNovosBrutos * propMensal) * ticketMensalPonderado * (comissaoSuportePct / 100);
    }
    const comissaoSuporte = Math.round(comissaoSuporteAnualAtual + comissaoSuporteMensalAnterior);

    // 4. Receita Empresa Após Regra (Deduce comissão vendas e bônus de venda anual)
    const receitaEmpresa = m.isManualReceita ? Number(m.receitaEmpresa || 0) : (mrrTotal - comissaoVendas - bonusVendaAnual);

    // 5. Aquisição - Tráfego (60%)
    const novosTrafego = m.isManualNovosTrafego ? Number(m.novosTrafego || 0) : Number((novosBrutosNecessarios * 0.6).toFixed(1));
    const cacTrafego = m.isManualCacTrafego ? Number(m.cacTrafego || 0) : Math.max(160, 250 - (index * 6));
    const investimentoTrafego = m.isManualInvestTrafego ? Number(m.investimentoTrafego || 0) : Math.round(novosTrafego * cacTrafego);

    // 6. Aquisição - Lista (25%)
    const novosLista = m.isManualNovosLista ? Number(m.novosLista || 0) : Number((novosBrutosNecessarios * 0.25).toFixed(2));
    const contatosFrios = m.isManualContatosFrios ? Number(m.contatosFrios || 0) : Math.round(novosLista * 50);
    const custoListaFria = m.isManualCustoLista ? Number(m.custoListaFria || 0) : Number((contatosFrios * 0.5).toFixed(2));

    // 7. Aquisição - Influencer (15%)
    const novosInfluencer = m.isManualNovosInfluencer ? Number(m.novosInfluencer || 0) : Number((novosBrutosNecessarios * 0.15).toFixed(2));
    const custo1aInfluencer = m.isManualCusto1aInfluencer ? Number(m.custo1aInfluencer || 0) : Number((novosInfluencer * 265.6).toFixed(2));
    const custoRecorrenteInfluencer = m.isManualCustoRecorInfluencer ? Number(m.custoRecorrenteInfluencer || 0) : Number((mrrTotal * 0.015).toFixed(2));

    // 8. Equipe (Pró-labores e Suporte)
    // Se não editado manualmente, usa valores fixos ou os que já vinham na planilha
    const proLaboreDev = m.isManualProLaboreDev ? Number(m.proLaboreDev || 0) : (clientesAtivosMeta > 30 ? 2500 : 0);
    const proLaboreGestor = m.isManualProLaboreGestor ? Number(m.proLaboreGestor || 0) : (clientesAtivosMeta > 50 ? 2000 : 0);
    const proLaboreMkt = m.isManualProLaboreMkt ? Number(m.proLaboreMkt || 0) : (clientesAtivosMeta > 70 ? 3000 : 0);
    const proLaboreFin = m.isManualProLaboreFin ? Number(m.proLaboreFin || 0) : (clientesAtivosMeta > 100 ? 1500 : 0);
    
    const suporteFixo = m.isManualSuporteFixo ? Number(m.suporteFixo || 0) : Math.round(clientesAtivosMeta * 22.7);
    const apoioTecnico = m.isManualApoioTecnico ? Number(m.apoioTecnico || 0) : (clientesAtivosMeta > 100 ? 3500 : 0);
    const sdr = m.isManualSdr ? Number(m.sdr || 0) : (clientesAtivosMeta > 100 ? 2000 : 0);
    const marketingCriacao = m.isManualMktCriacao ? Number(m.marketingCriacao || 0) : (clientesAtivosMeta > 150 ? 1500 : 0);
    const bonusMetas = m.isManualBonusMetas ? Number(m.bonusMetas || 0) : 0;

    // 9. Infraestrutura
    const infraestruturaCost = m.isManualInfra ? Number(m.infraestrutura || 0) : calculateInfraForClients(clientesAtivosMeta, infraestrutura);

    // 10. Taxas de Pagamento
    const taxasPagamentoValor = m.isManualTaxasPagamento ? Number(m.taxasPagamento || 0) : Number((receitaEmpresa * 0.015).toFixed(2));

    // 11. Resultado Bruto
    const opex = (
      comissaoSuporte + 
      investimentoTrafego + custoListaFria + custo1aInfluencer + custoRecorrenteInfluencer +
      proLaboreDev + proLaboreGestor + proLaboreMkt + proLaboreFin +
      suporteFixo + apoioTecnico + sdr + marketingCriacao + bonusMetas +
      infraestruturaCost + taxasPagamentoValor
    );
    const resultadoBruto = m.isManualResultadoBruto ? Number(m.resultadoBruto || 0) : (receitaEmpresa - opex);

    // 12. Impostos e Resultado Líquido
    const impostos = m.isManualImpostos ? Number(m.impostos || 0) : Math.round(receitaEmpresa * impostoPct);
    const resultadoLiquido = m.isManualResultado ? Number(m.resultadoLiquido || 0) : (resultadoBruto - impostos);

    // 13. Caixa
    const receitaCaixa = m.isManualReceitaCaixa ? Number(m.receitaCaixa || 0) : (receitaEmpresa * 1.3); // Exemplo de antecipação
    const impostosCaixa8 = m.isManualImpostosCaixa ? Number(m.impostosCaixa8 || 0) : Math.round(receitaCaixa * impostoPct);
    const resultadoCaixa = m.isManualResultadoCaixa ? Number(m.resultadoCaixa || 0) : (receitaCaixa - opex - impostosCaixa8);

    accumulatedCaixa += resultadoCaixa;
    const saldoCaixaAcumulado = m.isManualCaixa ? Number(m.saldoCaixaAcumulado || 0) : accumulatedCaixa;

    return {
      ...m,
      clientesAtivosMeta,
      churn,
      novosLiquidosMeta: novosLiquidos,
      novosBrutosNecessarios,
      mrrMeta,
      mrrAluguel,
      mrrPacotes,
      mrrTotal,
      receitaEmpresa,
      comissaoVendas,
      bonusVendaAnual,
      comissaoSuporte,
      novosTrafego,
      cacTrafego,
      investimentoTrafego,
      novosLista,
      contatosFrios,
      custoListaFria,
      novosInfluencer,
      custo1aInfluencer,
      custoRecorrenteInfluencer,
      proLaboreDev,
      proLaboreGestor,
      proLaboreMkt,
      proLaboreFin,
      suporteFixo,
      apoioTecnico,
      sdr,
      marketingCriacao,
      bonusMetas,
      infraestrutura: infraestruturaCost,
      taxasPagamento: taxasPagamentoValor,
      impostos,
      resultadoBruto,
      resultadoLiquido,
      receitaCaixa,
      impostosCaixa8,
      resultadoCaixa,
      saldoCaixaAcumulado
    };
  });
}
