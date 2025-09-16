import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { SearchFiltersForm } from '@/components/search/SearchFiltersForm'

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="heading-xl mb-8 text-center">Search for Sustainable Venues</h1>
        <SearchFiltersForm />
      </main>
      <Footer />
    </div>
  )
}
