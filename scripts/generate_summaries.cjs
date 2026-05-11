const fs = require('fs')
const path = require('path')

const PRODUCTS_PATH = path.resolve(__dirname, '..', 'products.json')

function safeReadJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch (err) {
    console.error('Failed to read', p, err)
    process.exit(1)
  }
}

function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

function splitParagraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function splitSentences(paragraph) {
  const parts = paragraph.split(/[.?!]\s+/).map((s) => s.trim()).filter(Boolean)
  return parts
}

function normalizeLine(line) {
  return line.replace(/\s+/g, ' ').trim()
}

function isBoilerplateLine(line) {
  if (!line) return true

  const badExact = new Set([
    'This website uses cookies to ensure you get the best experience on our website.OKPrivacy Policy',
    'Skip to content',
    'Privacy Policy',
    'BOOK NOW',
    'LOGIN',
    'VIEW ON MAP',
    'HomeTours',
    'ABOUT US',
    'DAY TRIPS',
    'TOURS',
    'TRANSFERS',
    'BLOG',
    'CONTACT',
    'ENGLISH',
    'Facebook',
    'Twitter',
    'Tripadvisor',
    'Instagram',
    'Pinterest',
    'Linkedin',
    'Servicios',
    'Excursiones de un día a Tánger',
    'Viajes a Marruecos',
    'Transferencias de transporte',
    'Coches de alquiler',
    'Comparar vuelos',
  ])

  if (badExact.has(line)) return true

  const badPrefixes = [
    '183;',
    '0 Reviews',
    'Adults',
    'Children',
    'Total amount',
    'TOTAL COST',
    'To save your wishlist please login.',
    'Información de contacto',
    'Moroccan Desert tour',
    'Xauentours.com es la principal empresa',
    '©2023.by SkyLine Digital',
  ]

  if (badPrefixes.some((prefix) => line.startsWith(prefix))) return true

  const badSectionHeads = [
    'Highlights',
    "What's included",
    'What is included',
    "What's not included",
    'What is not included',
    'What to bring',
    'Tour Pictures',
    'Check the map',
    'Video Tour',
    '- Booking -',
    'Price',
    'Quality',
    'Position',
    'Tourist guide',
  ]

  return badSectionHeads.includes(line)
}

function stripBoilerplateLines(text) {
  return text
    .split(/\n+/)
    .map(normalizeLine)
    .filter((line) => line && !isBoilerplateLine(line))
}

function isCutMarker(line) {
  return [
    'Highlights',
    "What's included",
    'What is included',
    "What's not included",
    'What is not included',
    'What to bring',
    'Tour Pictures',
    'Check the map',
    'Video Tour',
    '- Booking -',
    '0 Reviews',
    'VIEW ON MAP',
    'Price',
    'Quality',
    'Position',
    'Tourist guide',
  ].includes(line)
}

function looksLikeNavOrFooter(s) {
  const bad = [
    'This website uses cookies',
    'Skip to content',
    'Privacy Policy',
    'BOOK NOW',
    '©',
    'Login',
    'Facebook',
    'Instagram',
    'Tripadvisor',
    'Contact',
    'HomeTours',
  ]
  const up = s.toUpperCase()
  return bad.some((b) => up.includes(b.toUpperCase()))
}

function generateSummary(product) {
  const title = product.title || ''
  const category = product.category || ''
  const desc = product.description || ''

  if (!desc) return `${title} — ${category}`

  const rawLines = desc
    .split(/\n+/)
    .map(normalizeLine)
    .filter(Boolean)
  const normalizedTitle = title.toLowerCase().replace(/\s+/g, ' ').trim()
  const titleIndex = rawLines.findIndex((line) => line.toLowerCase().includes(normalizedTitle))
  const contentLines = titleIndex >= 0 ? rawLines.slice(titleIndex + 1) : rawLines

  const descriptionLines = []
  for (const line of contentLines) {
    if (isCutMarker(line)) break
    if (isBoilerplateLine(line)) continue
    descriptionLines.push(line)
  }

  const paragraphs = splitParagraphs(descriptionLines.join('\n\n'))
  const cleaned = paragraphs.filter((paragraph) => !looksLikeNavOrFooter(paragraph))

  const result = cleaned.join('\n\n').trim()

  if (result.length < 20) return `${title} — ${category}`

  return result
}

function main() {
  const products = safeReadJSON(PRODUCTS_PATH)
  let updated = 0

  for (const p of products) {
    const old = p.summary || ''
    const s = generateSummary(p)
    if (s !== old) {
      p.summary = s
      updated++
    }
  }

  writeJSON(PRODUCTS_PATH, products)
  console.log(`Finished. Summaries written for ${products.length} products (${updated} changed).`)
  console.log('Sample summaries:')
  products.slice(0, 6).forEach((p, i) => console.log(`${i + 1}. ${p.summary}`))
}

main()
