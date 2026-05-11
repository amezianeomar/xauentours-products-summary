import { useState, useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartNoAxesColumn, Gem, LayoutGrid, Tag, SearchX, X } from 'lucide-react'
import products from '../products.json'

type Product = {
  title: string
  price: string
  category: string
  image_url: string | null
  link: string
}

type EnrichedProduct = Product & {
  cities: string[]
  isGuided: boolean
  isPrivate: boolean
}

const parsedProducts = products as Product[]

const CITIES = ['Tangier', 'Chefchaouen', 'Asilah', 'Tetouan', 'Akchour', 'Cap Spartel', 'Rabat', 'Larache', 'Fes']

const inferCities = (title: string): string[] => {
  const titleLower = title.toLowerCase()
  return CITIES.filter((city) => titleLower.includes(city.toLowerCase()))
}

const inferGuided = (title: string, category: string): boolean => {
  const combined = `${title} ${category}`.toLowerCase()
  return combined.includes('guided') || combined.includes('guide')
}

const inferPrivate = (title: string): boolean => {
  return title.toLowerCase().includes('private')
}

const enrichProducts = (prods: Product[]): EnrichedProduct[] => {
  return prods.map((p) => ({
    ...p,
    cities: inferCities(p.title),
    isGuided: inferGuided(p.title, p.category),
    isPrivate: inferPrivate(p.title),
  }))
}

const enrichedProducts = enrichProducts(parsedProducts)

const parsePrice = (value: string): number => {
  const cleaned = value.replace(/[^\d.,]/g, '')
  if (!cleaned) return 0

  if (cleaned.includes(',') && cleaned.includes('.')) {
    return Number(cleaned.replace(/,/g, '')) || 0
  }

  if (cleaned.includes(',') && !cleaned.includes('.')) {
    return Number(cleaned.replace(',', '.')) || 0
  }

  return Number(cleaned) || 0
}

function App() {
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set())
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set())

  const filteredProducts = useMemo(() => {
    if (selectedCities.size === 0 && selectedTypes.size === 0) {
      return enrichedProducts
    }

    return enrichedProducts.filter((product) => {
      const cityMatch =
        selectedCities.size === 0 || product.cities.some((city) => selectedCities.has(city))

      const typeMatch =
        selectedTypes.size === 0 ||
        selectedTypes.has('Guided' as any) === product.isGuided ||
        selectedTypes.has('Not Guided' as any) === !product.isGuided ||
        (selectedTypes.has('Private' as any) && product.isPrivate)

      return cityMatch && typeMatch
    })
  }, [selectedCities, selectedTypes])

  const handleCityToggle = (city: string) => {
    const newCities = new Set(selectedCities)
    if (newCities.has(city)) {
      newCities.delete(city)
    } else {
      newCities.add(city)
    }
    setSelectedCities(newCities)
  }

  const handleTypeToggle = (type: string) => {
    const newTypes = new Set(selectedTypes)
    if (newTypes.has(type)) {
      newTypes.delete(type)
    } else {
      newTypes.add(type)
    }
    setSelectedTypes(newTypes)
  }

  const resetFilters = () => {
    setSelectedCities(new Set())
    setSelectedTypes(new Set())
  }

  // Dynamic stats based on filtered products
  const categoryCounts = filteredProducts.reduce<Record<string, number>>((acc, product) => {
    acc[product.category] = (acc[product.category] ?? 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(categoryCounts)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)

  const prices = filteredProducts
    .map((product) => parsePrice(product.price))
    .filter((n) => n > 0)
  const averagePrice =
    prices.length > 0 ? prices.reduce((sum, value) => sum + value, 0) / prices.length : 0
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0

  const statCards = [
    {
      label: 'Total Products',
      value: String(filteredProducts.length),
      icon: LayoutGrid,
    },
    {
      label: 'Average Price',
      value: `€${averagePrice.toFixed(2)}`,
      icon: ChartNoAxesColumn,
    },
    {
      label: 'Top Price',
      value: `€${highestPrice.toFixed(2)}`,
      icon: Gem,
    },
    {
      label: 'Categories',
      value: String(Object.keys(categoryCounts).length),
      icon: Tag,
    },
  ]

  // Get unique cities from all products
  const allCities = Array.from(
    new Set(enrichedProducts.flatMap((p) => p.cities))
  ).sort()

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="dark-romantic-glow pointer-events-none fixed inset-0 -z-10" />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.28em] text-amber-300/80">Xauen Tours</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
            Products Intelligence Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
            A premium bento-style analytics view with dynamic filtering built from the live scraped catalog.
          </p>
        </header>

        {/* Dynamic Statistics Bento Grid */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          {statCards.map((card) => {
            const Icon = card.icon

            return (
              <article
                key={card.label}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl md:p-6 xl:col-span-3 transition-all duration-500"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
                    <p className="mt-3 text-3xl font-semibold text-slate-50">{card.value}</p>
                  </div>
                  <span className="rounded-2xl border border-white/15 bg-rose-500/15 p-2 text-rose-200">
                    <Icon size={18} />
                  </span>
                </div>
              </article>
            )
          })}

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl md:p-6 xl:col-span-8 transition-all duration-500">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-100 sm:text-xl">Products by Category</h2>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Distribution</p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 12, right: 12, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                    contentStyle={{
                      borderRadius: '14px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      backgroundColor: 'rgba(2,6,23,0.9)',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="rgba(251,113,133,0.9)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl md:p-6 xl:col-span-4 transition-all duration-500">
            <h2 className="text-lg font-medium text-slate-100 sm:text-xl">Data Source</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Filtered from the complete 25-item products.json catalog with smart city & service-type inference.
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Catalog Integrity</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-300">
                {filteredProducts.length} / {enrichedProducts.length} items
              </p>
            </div>
          </article>
        </section>

        {/* Advanced Filter Controls */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all duration-500">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-100">Advanced Filters</h3>
            {(selectedCities.size > 0 || selectedTypes.size > 0) && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 rounded-full bg-rose-500/20 px-4 py-1.5 text-xs uppercase tracking-wider text-rose-200 transition hover:bg-rose-500/30"
              >
                <X size={14} />
                Reset
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* City Filters */}
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-400">Destinations</p>
              <div className="flex flex-wrap gap-2">
                {allCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => handleCityToggle(city)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      selectedCities.has(city)
                        ? 'border-indigo-400/80 bg-indigo-500/15 text-indigo-100 shadow-lg shadow-indigo-500/20'
                        : 'border border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {/* Service Type Filters */}
            <div>
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-slate-400">Service Type</p>
              <div className="flex flex-wrap gap-2">
                {['Guided', 'Not Guided', 'Private'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeToggle(type)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                      selectedTypes.has(type)
                        ? 'border-purple-400/80 bg-purple-500/15 text-purple-100 shadow-lg shadow-purple-500/20'
                        : 'border border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Product Catalog Section */}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100">Product Catalog</h2>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              {filteredProducts.length > 0 ? 'Responsive Grid' : 'No Results'}
            </p>
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-16 text-center backdrop-blur-xl">
              <SearchX size={48} className="mx-auto mb-4 text-slate-400" />
              <h3 className="text-xl font-semibold text-slate-200">No products match your filters</h3>
              <p className="mt-2 text-slate-400">Try adjusting your filter selections</p>
              <button
                onClick={resetFilters}
                className="mt-6 rounded-full bg-indigo-500/20 px-6 py-2.5 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/30"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <a
                  key={product.link}
                  href={product.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-rose-300/40 hover:bg-white/[0.07]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-slate-900/80">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-slate-900 text-slate-500">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 p-4">
                    <div className="flex flex-wrap gap-1">
                      <p className="text-xs uppercase tracking-[0.2em] text-rose-200/80">{product.category}</p>
                      {product.isPrivate && (
                        <span className="rounded px-2 py-0.5 bg-purple-500/20 text-xs text-purple-200">
                          Private
                        </span>
                      )}
                    </div>
                    <h3 className="line-clamp-2 text-base font-medium leading-snug text-slate-100">
                      {product.title}
                    </h3>
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-sm font-semibold text-amber-200">{product.price || 'N/A'}</p>
                      {product.cities.length > 0 && (
                        <p className="text-xs text-slate-400">{product.cities.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
