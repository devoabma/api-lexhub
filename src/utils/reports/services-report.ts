import PDFDocument from 'pdfkit'
import { OAB_LOGO } from './oab-logo'

export interface ReportPoint {
  label: string
  total: number
}

export interface ServicesReportData {
  periodLabel: string
  generatedAt: string
  generatedBy: string
  total: number
  previous: { label: string; total: number }
  assistance: { personally: number; remote: number }
  overallTotal: number
  series: { title: string; points: ReportPoint[] }
  yearly: { year: number; total: number; partial: boolean }[]
  topLawyers: { name: string; oab: string; total: number }[]
  topAgents: { name: string; total: number }[]
}

type Doc = PDFKit.PDFDocument

interface Column {
  header: string
  width: number
  align?: 'left' | 'center' | 'right'
}

const PAGE_MARGIN = 40
const FOOTER_HEIGHT = 28
const FONT = 'Helvetica'
const FONT_BOLD = 'Helvetica-Bold'

// Cores da identidade visual da OAB Maranhão (as mesmas do frontend)
const COLORS = {
  navy: '#003552',
  blue: '#004b87',
  red: '#d71920',
  green: '#15803d',
  text: '#1e293b',
  muted: '#64748b',
  border: '#e2e8f0',
  surface: '#f1f5f9',
  white: '#ffffff',
}

const numberFormat = new Intl.NumberFormat('pt-BR')
const percentFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

function formatNumber(value: number) {
  return numberFormat.format(value)
}

function formatShare(part: number, whole: number) {
  return `${percentFormat.format(whole > 0 ? (part / whole) * 100 : 0)}%`
}

// Sem registros no período anterior não há base de comparação
function formatVariation(current: number, previous: number) {
  if (previous === 0) {
    return null
  }

  const variation = ((current - previous) / previous) * 100

  return `${variation >= 0 ? '+' : ''}${percentFormat.format(variation)}%`
}

function contentWidth(doc: Doc) {
  return doc.page.width - PAGE_MARGIN * 2
}

function bottomLimit(doc: Doc) {
  return doc.page.height - PAGE_MARGIN - FOOTER_HEIGHT
}

function ensureSpace(doc: Doc, height: number) {
  if (doc.y + height > bottomLimit(doc)) {
    doc.addPage()
  }
}

// Corta o texto com reticências para caber na largura (usa a fonte atual)
function fitText(doc: Doc, text: string, width: number) {
  if (doc.widthOfString(text) <= width) {
    return text
  }

  let fitted = text

  while (fitted.length > 0 && doc.widthOfString(`${fitted}…`) > width) {
    fitted = fitted.slice(0, -1)
  }

  return `${fitted.trimEnd()}…`
}

// Teto do eixo Y com 4 divisões inteiras e "redondas" (ex.: 123 → 160)
function niceMax(value: number) {
  const rough = value / 4

  if (rough <= 1) {
    return 4
  }

  const magnitude = 10 ** Math.floor(Math.log10(rough))

  for (const factor of [1, 2, 2.5, 4, 5]) {
    const step = factor * magnitude

    if (step >= rough && Number.isInteger(step)) {
      return step * 4
    }
  }

  return magnitude * 40
}

function drawHeader(doc: Doc, data: ServicesReportData) {
  const width = contentWidth(doc)
  const top = PAGE_MARGIN
  const logoWidth = 140
  const textX = PAGE_MARGIN + logoWidth + 20
  const textWidth = width - logoWidth - 20

  doc.image(OAB_LOGO, PAGE_MARGIN, top, { width: logoWidth })

  doc
    .font(FONT_BOLD)
    .fontSize(16)
    .fillColor(COLORS.navy)
    .text('Relatório de Atendimentos', textX, top, {
      width: textWidth,
      align: 'right',
    })

  doc
    .font(FONT)
    .fontSize(11)
    .fillColor(COLORS.text)
    .text(fitText(doc, data.periodLabel, textWidth), textX, top + 20, {
      width: textWidth,
      align: 'right',
      lineBreak: false,
    })

  doc.fontSize(8).fillColor(COLORS.muted)
  doc.text(
    fitText(
      doc,
      `Gerado em ${data.generatedAt} por ${data.generatedBy}`,
      textWidth
    ),
    textX,
    top + 36,
    { width: textWidth, align: 'right', lineBreak: false }
  )

  const ruleY = top + 56
  doc.rect(PAGE_MARGIN, ruleY, width * 0.8, 3).fill(COLORS.blue)
  doc.rect(PAGE_MARGIN + width * 0.8, ruleY, width * 0.2, 3).fill(COLORS.red)

  doc.x = PAGE_MARGIN
  doc.y = ruleY + 18
}

function drawKpis(doc: Doc, data: ServicesReportData) {
  const gap = 10
  const height = 74
  const width = (contentWidth(doc) - gap * 3) / 4
  const inner = width - 20
  const top = doc.y
  const variation = formatVariation(data.total, data.previous.total)
  const { personally, remote } = data.assistance

  const cards = [
    {
      label: 'No período',
      value: formatNumber(data.total),
      note: variation
        ? `${variation} sobre o período anterior`
        : 'Sem registros no período anterior para comparar',
      noteColor: !variation
        ? COLORS.muted
        : data.total >= data.previous.total
          ? COLORS.green
          : COLORS.red,
    },
    {
      label: 'Período anterior',
      value: formatNumber(data.previous.total),
      note: data.previous.label,
      noteColor: COLORS.muted,
    },
    {
      label: 'Presencial · Remoto',
      value: `${formatNumber(personally)} · ${formatNumber(remote)}`,
      note:
        personally + remote > 0
          ? `${formatShare(personally, personally + remote)} presencial`
          : 'Sem atendimentos no período',
      noteColor: COLORS.muted,
    },
    {
      label: 'Total geral',
      value: formatNumber(data.overallTotal),
      note: 'Todo o histórico do sistema',
      noteColor: COLORS.muted,
    },
  ]

  cards.forEach((card, index) => {
    const x = PAGE_MARGIN + index * (width + gap)

    doc.rect(x, top, width, height).fill(COLORS.surface)
    doc.rect(x, top, width, 2).fill(COLORS.blue)

    doc
      .font(FONT_BOLD)
      .fontSize(7)
      .fillColor(COLORS.muted)
      .text(fitText(doc, card.label.toUpperCase(), inner), x + 10, top + 10, {
        width: inner,
        lineBreak: false,
      })

    // Reduz a fonte do valor até caber no card
    let valueSize = 18
    doc.font(FONT_BOLD)
    while (
      valueSize > 10 &&
      doc.fontSize(valueSize).widthOfString(card.value) > inner
    ) {
      valueSize -= 1
    }

    doc.fillColor(COLORS.navy).text(card.value, x + 10, top + 22, {
      width: inner,
      lineBreak: false,
    })

    doc
      .font(FONT)
      .fontSize(7.5)
      .fillColor(card.noteColor)
      .text(card.note, x + 10, top + 46, {
        width: inner,
        height: 20,
        ellipsis: true,
      })
  })

  doc.x = PAGE_MARGIN
  doc.y = top + height + 22
}

function drawSectionTitle(doc: Doc, title: string, reserve: number) {
  ensureSpace(doc, 24 + reserve)

  doc
    .font(FONT_BOLD)
    .fontSize(11)
    .fillColor(COLORS.navy)
    .text(title, PAGE_MARGIN, doc.y, { width: contentWidth(doc) })

  doc.moveDown(0.5)
}

function drawBarChart(doc: Doc, points: ReportPoint[]) {
  const height = 180
  const axisWidth = 30
  const labelsHeight = 16
  const ticks = 4
  const top = doc.y
  const left = PAGE_MARGIN + axisWidth
  const width = contentWidth(doc) - axisWidth
  const plotTop = top + 12
  const plotBottom = top + height - labelsHeight
  const plotHeight = plotBottom - plotTop
  const max = niceMax(Math.max(...points.map(point => point.total)))

  doc.lineWidth(0.5)

  for (let tick = 0; tick <= ticks; tick++) {
    const y = plotBottom - (plotHeight / ticks) * tick

    doc
      .moveTo(left, y)
      .lineTo(left + width, y)
      .strokeColor(COLORS.border)
      .stroke()

    doc
      .font(FONT)
      .fontSize(7)
      .fillColor(COLORS.muted)
      .text(formatNumber((max / ticks) * tick), PAGE_MARGIN, y - 3.5, {
        width: axisWidth - 6,
        align: 'right',
        lineBreak: false,
      })
  }

  // Com muitos pontos (dias do mês) as barras e os rótulos ficam menores
  const slot = width / points.length
  const barWidth = Math.min(slot * 0.62, 28)
  const isDense = points.length > 16
  const valueSize = isDense ? 5.5 : 7
  const labelSize = isDense ? 6 : 7.5

  points.forEach((point, index) => {
    const slotX = left + slot * index
    const barHeight = (plotHeight * point.total) / max

    if (barHeight > 0) {
      doc
        .rect(
          slotX + (slot - barWidth) / 2,
          plotBottom - barHeight,
          barWidth,
          barHeight
        )
        .fill(COLORS.blue)

      doc
        .font(FONT_BOLD)
        .fontSize(valueSize)
        .fillColor(COLORS.text)
        .text(
          formatNumber(point.total),
          slotX,
          plotBottom - barHeight - valueSize - 2,
          { width: slot, align: 'center', lineBreak: false }
        )
    }

    doc
      .font(FONT)
      .fontSize(labelSize)
      .fillColor(COLORS.muted)
      .text(point.label, slotX, plotBottom + 4, {
        width: slot,
        align: 'center',
        lineBreak: false,
      })
  })

  doc.x = PAGE_MARGIN
  doc.y = top + height + 14
}

function drawTable(
  doc: Doc,
  columns: Column[],
  rows: string[][],
  emptyMessage: string
) {
  const rowHeight = 18
  const padding = 6
  const width = contentWidth(doc)

  const drawHeaderRow = () => {
    const y = doc.y
    let x = PAGE_MARGIN

    doc.rect(PAGE_MARGIN, y, width, rowHeight).fill(COLORS.navy)
    doc.font(FONT_BOLD).fontSize(7.5).fillColor(COLORS.white)

    for (const column of columns) {
      doc.text(column.header, x + padding, y + 5.5, {
        width: column.width - padding * 2,
        align: column.align ?? 'left',
        lineBreak: false,
      })
      x += column.width
    }

    doc.y = y + rowHeight
  }

  ensureSpace(doc, rowHeight * 2)
  drawHeaderRow()

  if (rows.length === 0) {
    const y = doc.y

    doc
      .font(FONT)
      .fontSize(8.5)
      .fillColor(COLORS.muted)
      .text(emptyMessage, PAGE_MARGIN + padding, y + 5, {
        width: width - padding * 2,
        lineBreak: false,
      })

    doc.y = y + rowHeight
  }

  rows.forEach((row, rowIndex) => {
    // Tabela que continua na página seguinte repete o cabeçalho
    if (doc.y + rowHeight > bottomLimit(doc)) {
      doc.addPage()
      drawHeaderRow()
    }

    const y = doc.y
    let x = PAGE_MARGIN

    if (rowIndex % 2 === 1) {
      doc.rect(PAGE_MARGIN, y, width, rowHeight).fill(COLORS.surface)
    }

    doc.font(FONT).fontSize(8.5).fillColor(COLORS.text)

    row.forEach((cell, cellIndex) => {
      const column = columns[cellIndex]
      const cellWidth = column.width - padding * 2

      doc.text(fitText(doc, cell, cellWidth), x + padding, y + 5, {
        width: cellWidth,
        align: column.align ?? 'left',
        lineBreak: false,
      })
      x += column.width
    })

    doc.y = y + rowHeight
  })

  doc
    .moveTo(PAGE_MARGIN, doc.y)
    .lineTo(PAGE_MARGIN + width, doc.y)
    .lineWidth(0.5)
    .strokeColor(COLORS.border)
    .stroke()

  doc.x = PAGE_MARGIN
  doc.y += 18
}

function drawNotes(doc: Doc) {
  const notes = [
    'Os números consideram a data de registro de cada atendimento, no horário local do Maranhão (UTC-3), em qualquer situação (em andamento ou concluído).',
    'Atendimentos cancelados são excluídos do sistema e não entram na contagem.',
    'Quando o período ainda está em andamento, a comparação usa o mesmo intervalo de dias do período anterior.',
  ]

  ensureSpace(doc, 60)

  doc
    .font(FONT_BOLD)
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text('Notas', PAGE_MARGIN, doc.y, { width: contentWidth(doc) })

  doc.font(FONT).fontSize(7.5)

  for (const note of notes) {
    doc.text(`• ${note}`, { width: contentWidth(doc) })
  }
}

function drawFooters(doc: Doc) {
  const { start, count } = doc.bufferedPageRange()

  for (let index = start; index < start + count; index++) {
    doc.switchToPage(index)

    const width = contentWidth(doc)
    const y = doc.page.height - PAGE_MARGIN - 10

    // Escrever abaixo da margem inferior faria o pdfkit abrir outra página
    const { bottom } = doc.page.margins
    doc.page.margins.bottom = 0

    doc
      .moveTo(PAGE_MARGIN, y - 6)
      .lineTo(PAGE_MARGIN + width, y - 6)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke()

    doc.font(FONT).fontSize(7).fillColor(COLORS.muted)
    doc.text('OAB Seccional Maranhão · OAB Atende', PAGE_MARGIN, y, {
      width,
      lineBreak: false,
    })
    doc.text(`Página ${index - start + 1} de ${count}`, PAGE_MARGIN, y, {
      width,
      align: 'right',
      lineBreak: false,
    })

    doc.page.margins.bottom = bottom
  }
}

export function renderServicesReport(data: ServicesReportData) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    bufferPages: true,
    info: {
      Title: `Relatório de Atendimentos — ${data.periodLabel}`,
      Author: 'OAB Seccional Maranhão · OAB Atende',
    },
  })

  const chunks: Buffer[] = []
  const pdf = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })

  const width = contentWidth(doc)

  drawHeader(doc, data)
  drawKpis(doc, data)

  drawSectionTitle(doc, data.series.title, 180)
  drawBarChart(doc, data.series.points)

  drawSectionTitle(doc, 'Top 10 advogados(as) mais atendidos(as)', 36)
  drawTable(
    doc,
    [
      { header: '#', width: 28, align: 'center' },
      { header: 'Advogado(a)', width: width - 258 },
      { header: 'OAB', width: 80 },
      { header: 'Atendimentos', width: 80, align: 'right' },
      { header: '% do período', width: 70, align: 'right' },
    ],
    data.topLawyers.map((lawyer, index) => [
      String(index + 1),
      lawyer.name,
      lawyer.oab,
      formatNumber(lawyer.total),
      formatShare(lawyer.total, data.total),
    ]),
    'Nenhum atendimento no período.'
  )

  drawSectionTitle(doc, 'Top 3 funcionários(as) que mais atenderam', 36)
  drawTable(
    doc,
    [
      { header: '#', width: 28, align: 'center' },
      { header: 'Funcionário(a)', width: width - 178 },
      { header: 'Atendimentos', width: 80, align: 'right' },
      { header: '% do período', width: 70, align: 'right' },
    ],
    data.topAgents.map((agent, index) => [
      String(index + 1),
      agent.name,
      formatNumber(agent.total),
      formatShare(agent.total, data.total),
    ]),
    'Nenhum atendimento no período.'
  )

  drawSectionTitle(doc, 'Histórico anual', 36)
  drawTable(
    doc,
    [
      { header: 'Ano', width: width - 250 },
      { header: 'Atendimentos', width: 110, align: 'right' },
      { header: 'Variação sobre o ano anterior', width: 140, align: 'right' },
    ],
    data.yearly.map((entry, index) => {
      const previous = data.yearly[index - 1]
      const variation = previous
        ? formatVariation(entry.total, previous.total)
        : null

      return [
        entry.partial ? `${entry.year} (em andamento)` : String(entry.year),
        formatNumber(entry.total),
        entry.partial ? 'parcial' : (variation ?? '—'),
      ]
    }),
    'Nenhum atendimento registrado.'
  )

  drawNotes(doc)
  drawFooters(doc)

  doc.end()

  return pdf
}
