'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/TopBar'
import Sidebar from '@/components/Sidebar'
import MasonryGrid from '@/components/MasonryGrid'
import SampleDetailModal from '@/components/SampleDetailModal'
import AddSampleModal from '@/components/AddSampleModal'
import ManageProductTypesModal from '@/components/ManageProductTypesModal'
import FloatingActionButton from '@/components/FloatingActionButton'
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
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showManageTypesModal, setShowManageTypesModal] = useState(false)
  const [droppedImage, setDroppedImage] = useState<File | null>(null)

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
    } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') {
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
        setSamples(samplesData as Sample[])
      }

      // Load product types
      const { data: typesData } = await supabase
        .from('product_types')
        .select('*')
        .order('name')

      if (typesData) {
        setProductTypes(typesData as ProductType[])
      }

      setDataLoading(false)
    }

    loadData()
  }, [authLoading, supabase])

  // Calculate sample counts per category
  const sampleCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    samples.forEach((sample) => {
      const typeId = sample.product_type
      counts[typeId] = (counts[typeId] || 0) + 1
    })
    return counts
  }, [samples])

  // Extract hashtags from a string
  const extractHashtags = (text: string | null | undefined): string[] => {
    if (!text) return []
    const matches = text.match(/#[\w-]+/g)
    return matches ? matches.map(tag => tag.toLowerCase()) : []
  }

  // Filter samples
  const filteredSamples = useMemo(() => {
    return samples.filter((sample) => {
      const query = searchQuery.toLowerCase().trim()

      // Check if searching for a hashtag
      if (query.startsWith('#')) {
        const searchTag = query
        const sampleTags = extractHashtags(sample.notes)
        return sampleTags.some(tag => tag.includes(searchTag))
      }

      // Regular search - includes name, notes, and hashtags
      const matchesSearch =
        !searchQuery ||
        sample.name.toLowerCase().includes(query) ||
        sample.notes?.toLowerCase().includes(query)

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
    setShowDetailModal(true)
  }

  const handleDropImage = (file: File) => {
    setDroppedImage(file)
    setShowAddModal(true)
  }

  const handleAddModalClose = () => {
    setShowAddModal(false)
    setDroppedImage(null)
  }

  const handleAddSuccess = async () => {
    // Reload samples
    const { data: samplesData } = await supabase
      .from('samples')
      .select('*')
      .order('created_at', { ascending: false })

    if (samplesData) {
      setSamples(samplesData as Sample[])
    }
  }

  const handleSampleUpdate = async () => {
    // Reload samples
    const { data: samplesData } = await supabase
      .from('samples')
      .select('*')
      .order('created_at', { ascending: false })

    if (samplesData) {
      const typedSamples = samplesData as Sample[]
      setSamples(typedSamples)
      // Update selected sample with fresh data
      if (selectedSample) {
        const updated = typedSamples.find((s) => s.id === selectedSample.id)
        if (updated) setSelectedSample(updated)
      }
    }
  }

  const handleSampleDelete = (id: string) => {
    setSamples((prev) => prev.filter((s) => s.id !== id))
    setSelectedSample(null)
  }

  const handleProductTypesChange = async () => {
    // Reload product types
    const { data: typesData } = await supabase
      .from('product_types')
      .select('*')
      .order('name')

    if (typesData) {
      setProductTypes(typesData as ProductType[])
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
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <TopBar
        user={user}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSignOut={handleSignOut}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          productTypes={productTypes}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          onManageTypes={() => setShowManageTypesModal(true)}
          sampleCounts={sampleCounts}
          totalSamples={samples.length}
        />

        {/* Masonry Grid */}
        <MasonryGrid
          samples={filteredSamples}
          productTypes={productTypes}
          onSampleClick={handleSampleClick}
          onDropImage={handleDropImage}
        />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setShowAddModal(true)} />

      {/* Modals */}
      <SampleDetailModal
        sample={selectedSample}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        productTypes={productTypes}
        onSampleUpdate={handleSampleUpdate}
        onSampleDelete={handleSampleDelete}
        samples={filteredSamples}
        onNavigate={setSelectedSample}
      />

      <AddSampleModal
        isOpen={showAddModal}
        onClose={handleAddModalClose}
        onSuccess={handleAddSuccess}
        productTypes={productTypes}
        prefilledImage={droppedImage}
        defaultProductType={selectedType}
      />

      <ManageProductTypesModal
        isOpen={showManageTypesModal}
        onClose={() => setShowManageTypesModal(false)}
        productTypes={productTypes}
        onProductTypesChange={handleProductTypesChange}
      />
    </div>
  )
}
