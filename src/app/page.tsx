'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/Header'
import FilterBar from '@/components/FilterBar'
import SampleCard from '@/components/SampleCard'
import SampleModal from '@/components/SampleModal'
import AddSampleModal from '@/components/AddSampleModal'
import EmptyState from '@/components/EmptyState'
import { Sample, ProductType, Profile } from '@/types/database'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  // Auth state
  const [user, setUser] = useState<Profile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  // Data state
  const [samples, setSamples] = useState<Sample[]>([])
  const [productTypes, setProductTypes] = useState<ProductType[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null)
  const [showSampleModal, setShowSampleModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  // Check auth
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setUser(
        profile || {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || null,
          avatar_url: null,
          created_at: new Date().toISOString(),
        }
      )
      setAuthLoading(false)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      if (_event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase])

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return

      setDataLoading(true)

      // Load samples
      const { data: samplesData } = await supabase
        .from('samples')
        .select('*')
        .order('created_at', { ascending: false })

      if (samplesData) {
        setSamples(samplesData)
      }

      // Load product types
      const { data: typesData } = await supabase
        .from('product_types')
        .select('*')
        .order('name')

      if (typesData) {
        setProductTypes(typesData)
      }

      setDataLoading(false)
    }

    loadData()
  }, [authLoading, supabase])

  // Filter samples
  const filteredSamples = useMemo(() => {
    return samples.filter((sample) => {
      const matchesSearch =
        !searchQuery ||
        sample.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sample.notes?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = !selectedType || sample.product_type === selectedType

      return matchesSearch && matchesType
    })
  }, [samples, searchQuery, selectedType])

  // Handlers
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleSampleClick = (sample: Sample) => {
    setSelectedSample(sample)
    setShowSampleModal(true)
  }

  const handleAddSuccess = async () => {
    // Reload samples
    const { data: samplesData } = await supabase
      .from('samples')
      .select('*')
      .order('created_at', { ascending: false })

    if (samplesData) {
      setSamples(samplesData)
    }
  }

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onAddNew={() => setShowAddModal(true)}
        onSignOut={handleSignOut}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {samples.length === 0 ? (
          <EmptyState type="no-samples" onAddNew={() => setShowAddModal(true)} />
        ) : (
          <>
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              productTypes={productTypes}
              totalResults={filteredSamples.length}
            />

            {filteredSamples.length === 0 ? (
              <EmptyState
                type="no-results"
                onClearFilters={() => {
                  setSearchQuery('')
                  setSelectedType(null)
                }}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSamples.map((sample) => (
                  <SampleCard
                    key={sample.id}
                    sample={sample}
                    onClick={() => handleSampleClick(sample)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <SampleModal
        sample={selectedSample}
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
      />

      <AddSampleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
        productTypes={productTypes}
      />
    </div>
  )
}
