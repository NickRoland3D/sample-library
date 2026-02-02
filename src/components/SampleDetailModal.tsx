'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Copy,
  Check,
  Edit2,
  Trash2,
  Clock,
  Droplets,
  ExternalLink,
  Loader2,
  Save,
  Upload,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Sample, ProductType } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { parseTextWithHashtags } from '@/lib/hashtags'
import { compressImage } from '@/lib/imageCompression'

const MAX_IMAGES = 6

interface SampleDetailModalProps {
  sample: Sample | null
  isOpen: boolean
  onClose: () => void
  productTypes: ProductType[]
  onSampleUpdate: () => void
  onSampleDelete: (id: string) => void
  samples?: Sample[]
  onNavigate?: (sample: Sample) => void
}

// Represents one image in the unified edit pool
type EditImage =
  | { type: 'existing'; url: string }
  | { type: 'new'; file: File; previewUrl: string }

export default function SampleDetailModal({
  sample,
  isOpen,
  onClose,
  productTypes,
  onSampleUpdate,
  onSampleDelete,
  samples = [],
  onNavigate,
}: SampleDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editProductType, setEditProductType] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editPrintTime, setEditPrintTime] = useState('')
  const [editInkUsage, setEditInkUsage] = useState('')
  const [editOneDriveUrl, setEditOneDriveUrl] = useState('')

  // Unified image pool for edit mode
  const [editImages, setEditImages] = useState<EditImage[]>([])
  const [editTitleIndex, setEditTitleIndex] = useState(0)
  const [editPreviewIndex, setEditPreviewIndex] = useState(0)

  // View mode state
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  // Helper toast state
  const [showTitleHint, setShowTitleHint] = useState(false)

  // Drag state for edit mode
  const [isDragOver, setIsDragOver] = useState(false)

  // Reset form when sample changes
  useEffect(() => {
    if (sample) {
      setEditName(sample.name)
      setEditProductType(sample.product_type)
      setEditNotes(sample.notes || '')
      setEditPrintTime(sample.print_time_minutes?.toString() || '')
      setEditInkUsage(sample.ink_usage_ml?.toString() || '')
      setEditOneDriveUrl(sample.onedrive_folder_url || '')
      setActiveImageIndex(0)
      setIsEditing(false)
      setError(null)
      // Build unified image pool from existing data
      const pool: EditImage[] = [
        { type: 'existing', url: sample.thumbnail_url },
        ...(sample.gallery_image_urls || []).map(url => ({ type: 'existing' as const, url })),
      ]
      setEditImages(pool)
      setEditTitleIndex(0)
      setEditPreviewIndex(0)
    }
  }, [sample])

  // Clean up preview URLs when edit images change
  useEffect(() => {
    return () => {
      editImages.forEach(img => {
        if (img.type === 'new') URL.revokeObjectURL(img.previewUrl)
      })
    }
  }, []) // only on unmount

  // Show hint briefly when multiple images or title changes
  const prevEditCount = useRef(0)
  useEffect(() => {
    if (editImages.length >= 2 && prevEditCount.current < 2) {
      setShowTitleHint(true)
      const timer = setTimeout(() => setShowTitleHint(false), 3000)
      return () => clearTimeout(timer)
    }
    prevEditCount.current = editImages.length
  }, [editImages.length])

  useEffect(() => {
    if (editImages.length >= 2) {
      setShowTitleHint(true)
      const timer = setTimeout(() => setShowTitleHint(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [editTitleIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const getImageUrl = (img: EditImage) =>
    img.type === 'existing' ? img.url : img.previewUrl

  const addFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return
    setEditImages(prev => {
      const remaining = MAX_IMAGES - prev.length
      if (remaining <= 0) return prev
      const toAdd = imageFiles.slice(0, remaining)
      const newItems: EditImage[] = toAdd.map(f => ({
        type: 'new',
        file: f,
        previewUrl: URL.createObjectURL(f),
      }))
      return [...prev, ...newItems]
    })
  }, [])

  const handleRemoveEditImage = (index: number) => {
    const img = editImages[index]
    if (img.type === 'new') URL.revokeObjectURL(img.previewUrl)
    setEditImages(prev => prev.filter((_, i) => i !== index))
    setEditTitleIndex(prev => {
      if (index === prev) return 0
      if (index < prev) return prev - 1
      return prev
    })
    setEditPreviewIndex(prev => {
      if (index === prev) return 0
      if (index < prev) return prev - 1
      return prev
    })
  }

  const handleEditFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    addFiles(files)
    e.target.value = ''
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDropEdit = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }, [addFiles])

  // Navigation logic
  const currentIndex = sample ? samples.findIndex(s => s.id === sample.id) : -1
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < samples.length - 1 && currentIndex !== -1

  const handlePrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(samples[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(samples[currentIndex + 1])
    }
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || !onNavigate || samples.length <= 1 || !sample) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) return

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(samples[currentIndex - 1])
      } else if (e.key === 'ArrowRight' && currentIndex < samples.length - 1) {
        onNavigate(samples[currentIndex + 1])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onNavigate, samples, currentIndex, isEditing, sample])

  if (!sample) return null

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/sample/${sample.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!editName.trim()) {
      setError('Sample name is required')
      return
    }

    if (editImages.length === 0) {
      setError('At least one image is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) throw new Error('Not authenticated')

      const titleImg = editImages[editTitleIndex]
      const galleryImgs = editImages.filter((_, i) => i !== editTitleIndex)

      // Determine if we need FormData (new files present, or title changed to a new file)
      const hasNewFiles = editImages.some(img => img.type === 'new')
      const titleChanged = titleImg.type === 'new' || (titleImg.type === 'existing' && titleImg.url !== sample.thumbnail_url)

      if (hasNewFiles || titleChanged) {
        const formData = new FormData()
        formData.append('name', editName.trim())
        formData.append('product_type', editProductType)
        formData.append('notes', editNotes.trim() || '')
        if (editPrintTime) formData.append('print_time_minutes', editPrintTime)
        if (editInkUsage) formData.append('ink_usage_ml', editInkUsage)
        if (editOneDriveUrl.trim()) formData.append('onedrive_folder_url', editOneDriveUrl.trim())

        // Title image
        if (titleImg.type === 'new') {
          const compressed = await compressImage(titleImg.file)
          formData.append('samplePhoto', compressed)
        } else if (titleImg.url !== sample.thumbnail_url) {
          // Title changed to an existing gallery image - tell API via special field
          formData.append('newTitleUrl', titleImg.url)
        }

        // Gallery: existing URLs (excluding the one that became title)
        const existingGalleryUrls = galleryImgs
          .filter(img => img.type === 'existing')
          .map(img => (img as { type: 'existing'; url: string }).url)
        formData.append('gallery_image_urls', JSON.stringify(existingGalleryUrls))

        // Gallery: new files
        for (const img of galleryImgs) {
          if (img.type === 'new') {
            const compressed = await compressImage(img.file)
            formData.append('galleryImages', compressed)
          }
        }

        const response = await fetch(`/api/samples/${sample.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update sample')
        }
      } else {
        // No new files, no title change — JSON update
        const existingGalleryUrls = galleryImgs
          .filter(img => img.type === 'existing')
          .map(img => (img as { type: 'existing'; url: string }).url)

        const response = await fetch(`/api/samples/${sample.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: editName.trim(),
            product_type: editProductType,
            notes: editNotes.trim() || null,
            print_time_minutes: editPrintTime ? parseFloat(editPrintTime) : null,
            ink_usage_ml: editInkUsage ? parseFloat(editInkUsage) : null,
            onedrive_folder_url: editOneDriveUrl.trim() || null,
            gallery_image_urls: existingGalleryUrls,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update sample')
        }
      }

      setIsEditing(false)
      setActiveImageIndex(0)
      onSampleUpdate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sample')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${sample.name}"? This cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`/api/samples/${sample.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete sample')
      }

      onSampleDelete(sample.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sample')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    setIsEditing(false)
    setError(null)
    onClose()
  }

  const handleStartEdit = () => {
    // Rebuild pool from current sample data
    const pool: EditImage[] = [
      { type: 'existing', url: sample.thumbnail_url },
      ...(sample.gallery_image_urls || []).map(url => ({ type: 'existing' as const, url })),
    ]
    setEditImages(pool)
    setEditTitleIndex(0)
    setEditPreviewIndex(0)
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditName(sample.name)
    setEditProductType(sample.product_type)
    setEditNotes(sample.notes || '')
    setEditPrintTime(sample.print_time_minutes?.toString() || '')
    setEditInkUsage(sample.ink_usage_ml?.toString() || '')
    setEditOneDriveUrl(sample.onedrive_folder_url || '')
    // Clean up new file previews
    editImages.forEach(img => {
      if (img.type === 'new') URL.revokeObjectURL(img.previewUrl)
    })
    const pool: EditImage[] = [
      { type: 'existing', url: sample.thumbnail_url },
      ...(sample.gallery_image_urls || []).map(url => ({ type: 'existing' as const, url })),
    ]
    setEditImages(pool)
    setEditTitleIndex(0)
    setEditPreviewIndex(0)
    setError(null)
  }

  const getProductTypeName = (id: string) => {
    return productTypes.find(pt => pt.id === id)?.name || id
  }

  const hasSpecs = sample.print_time_minutes || sample.ink_usage_ml

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="xl">
      <div className="flex flex-col md:flex-row max-h-[85vh]">
        {/* Image Section */}
        <div
          className={`md:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6 md:p-8 rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none relative transition-colors ${
            isEditing && isDragOver ? 'from-primary-50 to-primary-100 ring-2 ring-inset ring-primary-300' : ''
          }`}
          onDragOver={isEditing ? handleDragOver : undefined}
          onDragLeave={isEditing ? handleDragLeave : undefined}
          onDrop={isEditing ? handleDropEdit : undefined}
        >
          {isEditing ? (
            <div className="w-full flex flex-col items-center">
              {/* Large preview */}
              {editImages.length > 0 ? (
                <div className="relative mb-4">
                  <img
                    src={getImageUrl(editImages[editPreviewIndex])}
                    alt="Preview"
                    className="max-w-full max-h-[300px] md:max-h-[400px] object-contain rounded-2xl shadow-lg"
                  />
                  {/* Star toggle on main image */}
                  <button
                    type="button"
                    onClick={() => setEditTitleIndex(editPreviewIndex)}
                    className={`absolute top-2 right-2 p-1.5 rounded-full transition-all shadow-md ${
                      editPreviewIndex === editTitleIndex
                        ? 'bg-primary-500 text-white'
                        : 'bg-white/90 text-gray-400 hover:text-primary-500 hover:bg-white'
                    }`}
                    title={editPreviewIndex === editTitleIndex ? 'This is the title image' : 'Set as title image'}
                  >
                    <Star className={`w-4 h-4 ${editPreviewIndex === editTitleIndex ? 'fill-white' : ''}`} />
                  </button>
                  {/* Title badge helper — fades in/out */}
                  {editImages.length > 1 && (
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium shadow-sm transition-opacity duration-500 ${
                      showTitleHint ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    } ${
                      editPreviewIndex === editTitleIndex
                        ? 'bg-primary-500 text-white'
                        : 'bg-white/90 text-gray-500'
                    }`}>
                      {editPreviewIndex === editTitleIndex ? '★ Title Image' : 'Click ★ to set as title'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full min-h-[200px] mb-4">
                  <Upload className="w-12 h-12 text-gray-400 mb-3" />
                  <span className="text-sm font-medium text-gray-600">
                    {isDragOver ? 'Drop images here!' : 'Drag & drop images here'}
                  </span>
                </div>
              )}

              {/* Thumbnail strip */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {editImages.map((img, index) => (
                  <div
                    key={index}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      index === editPreviewIndex
                        ? 'border-gray-800 ring-2 ring-gray-300'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => setEditPreviewIndex(index)}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt={`Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {index === editTitleIndex && (
                      <div className="absolute top-0.5 left-0.5 p-0.5 bg-primary-500 rounded-full">
                        <Star className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveEditImage(index) }}
                      className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
                {editImages.length < MAX_IMAGES && (
                  <label className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors">
                    <span className="text-gray-400 text-xl font-light">+</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleEditFileInput}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {editImages.length}/{MAX_IMAGES} images
                {editImages.length > 1 && ' · The ★ title image gets background processing'}
              </p>
            </div>
          ) : (
            <>
              {/* Main display image */}
              {(() => {
                const allImages = [sample.thumbnail_url, ...(sample.gallery_image_urls || [])]
                const displayUrl = allImages[activeImageIndex] || sample.thumbnail_url
                return (
                  <img
                    src={displayUrl}
                    alt={sample.name}
                    className="max-w-full max-h-[400px] md:max-h-[500px] object-contain rounded-2xl shadow-lg"
                  />
                )
              })()}

              {/* Gallery thumbnails */}
              {(sample.gallery_image_urls?.length ?? 0) > 0 && (
                <div className="flex items-center gap-2 mt-4">
                  {[sample.thumbnail_url, ...(sample.gallery_image_urls || [])].map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        activeImageIndex === idx
                          ? 'border-primary-500 ring-2 ring-primary-200'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Section */}
        <div className="md:w-1/2 p-6 md:p-8 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100">
              {error}
            </div>
          )}

          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Sample name"
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type
                </label>
                <select
                  value={editProductType}
                  onChange={(e) => setEditProductType(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 appearance-none cursor-pointer"
                  style={{ backgroundImage: 'none' }}
                >
                  {productTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Print Time & Ink Usage */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Print Time (min)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editPrintTime}
                    onChange={(e) => setEditPrintTime(e.target.value)}
                    placeholder="0.5"
                    className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ink Usage (ml)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editInkUsage}
                    onChange={(e) => setEditInkUsage(e.target.value)}
                    placeholder="12.5"
                    className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add notes... Use #tags for easy searching (e.g. #glossy #wine-red #2024)"
                  rows={3}
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  Tip: Use #hashtags to organize and find samples easily
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OneDrive Folder URL
                </label>
                <input
                  type="url"
                  value={editOneDriveUrl}
                  onChange={(e) => setEditOneDriveUrl(e.target.value)}
                  placeholder="https://onedrive.com/..."
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  Link to the OneDrive folder containing design files
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 text-gray-600 font-medium rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-5">
              {/* Header */}
              <div>
                <span className="inline-block px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full mb-3">
                  {getProductTypeName(sample.product_type)}
                </span>
                <h2 className="text-2xl font-bold text-gray-900">
                  {sample.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1.5">
                  Added {new Date(sample.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Copy Link Button */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-3 w-full px-5 py-4 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-700 transition-all duration-200 group"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                )}
                <span className="text-sm font-medium">
                  {copied ? 'Link copied!' : 'Copy Sample Link'}
                </span>
              </button>

              {/* OneDrive Link */}
              {sample.onedrive_folder_url && (
                <a
                  href={sample.onedrive_folder_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full px-5 py-4 bg-blue-50 hover:bg-blue-100 rounded-2xl text-blue-700 transition-all duration-200 group"
                >
                  <ExternalLink className="w-5 h-5 text-blue-500 group-hover:text-blue-600" />
                  <span className="text-sm font-medium">Open in OneDrive</span>
                </a>
              )}

              {/* Notes */}
              {sample.notes && (
                <div className="pt-5 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                    {parseTextWithHashtags(sample.notes).map((segment, index) => (
                      segment.type === 'hashtag' ? (
                        <span
                          key={index}
                          className="inline-block px-2 py-0.5 bg-primary-50 text-primary-600 rounded-md font-medium text-xs mx-0.5"
                        >
                          {segment.content}
                        </span>
                      ) : (
                        <span key={index}>{segment.content}</span>
                      )
                    ))}
                  </p>
                </div>
              )}

              {/* Specs */}
              {hasSpecs && (
                <div className="pt-5 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    {sample.print_time_minutes && (
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl text-center">
                        <Clock className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-900">
                          {sample.print_time_minutes < 1
                            ? `${Math.round(sample.print_time_minutes * 60)} sec`
                            : `${sample.print_time_minutes} min`}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Print Time</p>
                      </div>
                    )}
                    {sample.ink_usage_ml && (
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl text-center">
                        <Droplets className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-900">
                          {sample.ink_usage_ml} ml
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Ink Usage</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-5 border-t border-gray-100">
                <button
                  onClick={handleStartEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-all duration-200"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-all duration-200 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      {samples.length > 1 && onNavigate && !isEditing && (
        <>
          <button
            onClick={handlePrevious}
            disabled={!hasPrevious}
            className={`fixed left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-xl transition-all z-10 ${
              hasPrevious
                ? 'hover:bg-gray-50 hover:scale-110 text-gray-700'
                : 'opacity-30 cursor-not-allowed text-gray-400'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={handleNext}
            disabled={!hasNext}
            className={`fixed right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white shadow-xl transition-all z-10 ${
              hasNext
                ? 'hover:bg-gray-50 hover:scale-110 text-gray-700'
                : 'opacity-30 cursor-not-allowed text-gray-400'
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </Modal>
  )
}
