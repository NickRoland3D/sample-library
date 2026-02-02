'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertCircle, CheckCircle, Loader2, Link as LinkIcon, Upload, X, Star } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { ProductType } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { compressImage } from '@/lib/imageCompression'

const MAX_IMAGES = 6

interface AddSampleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  productTypes: ProductType[]
  prefilledImages?: File[]
  defaultProductType?: string | null
}

type UploadStep = 'form' | 'uploading' | 'success' | 'error'

interface UploadProgress {
  step: string
  progress: number
}

export default function AddSampleModal({
  isOpen,
  onClose,
  onSuccess,
  productTypes,
  prefilledImages,
  defaultProductType,
}: AddSampleModalProps) {
  const [step, setStep] = useState<UploadStep>('form')
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    step: '',
    progress: 0,
  })
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [productType, setProductType] = useState('')
  const [notes, setNotes] = useState('')
  const [onedriveFolderUrl, setOnedriveFolderUrl] = useState('')
  const [printTime, setPrintTime] = useState('')
  const [inkUsage, setInkUsage] = useState('')

  // Unified image pool
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [titleIndex, setTitleIndex] = useState(0)
  const [previewIndex, setPreviewIndex] = useState(0)

  // Helper toast state
  const [showTitleHint, setShowTitleHint] = useState(false)

  // Drag state
  const [isDragOver, setIsDragOver] = useState(false)

  // Handle prefilled images from drag-and-drop
  useEffect(() => {
    if (prefilledImages && prefilledImages.length > 0 && isOpen) {
      const files = prefilledImages.slice(0, MAX_IMAGES)
      setImages(files)
      const urls = files.map(f => URL.createObjectURL(f))
      setImagePreviews(urls)
      setTitleIndex(0)
      return () => urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [prefilledImages, isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('form')
        setName('')
        setProductType('')
        setNotes('')
        setOnedriveFolderUrl('')
        setPrintTime('')
        setInkUsage('')
        setImages([])
        setImagePreviews(prev => { prev.forEach(url => URL.revokeObjectURL(url)); return [] })
        setTitleIndex(0)
        setPreviewIndex(0)
        setError(null)
        setUploadProgress({ step: '', progress: 0 })
        setIsDragOver(false)
      }, 300)
    }
  }, [isOpen])

  // Set default product type when modal opens
  useEffect(() => {
    if (isOpen && productTypes.length > 0) {
      if (defaultProductType && productTypes.some(pt => pt.id === defaultProductType)) {
        setProductType(defaultProductType)
      } else {
        setProductType(productTypes[0].id)
      }
    }
  }, [isOpen, productTypes, defaultProductType])

  // Show hint briefly when multiple images exist or title changes
  const prevImageCount = useRef(0)
  useEffect(() => {
    if (images.length >= 2 && prevImageCount.current < 2) {
      setShowTitleHint(true)
      const timer = setTimeout(() => setShowTitleHint(false), 3000)
      return () => clearTimeout(timer)
    }
    prevImageCount.current = images.length
  }, [images.length])

  useEffect(() => {
    if (images.length >= 2) {
      setShowTitleHint(true)
      const timer = setTimeout(() => setShowTitleHint(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [titleIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    setImages(prev => {
      const remaining = MAX_IMAGES - prev.length
      if (remaining <= 0) return prev
      const toAdd = imageFiles.slice(0, remaining)
      const urls = toAdd.map(f => URL.createObjectURL(f))
      setImagePreviews(prevUrls => [...prevUrls, ...urls])
      return [...prev, ...toAdd]
    })
  }, [])

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setTitleIndex(prev => {
      if (index === prev) return 0
      if (index < prev) return prev - 1
      return prev
    })
    setPreviewIndex(prev => {
      if (index === prev) return 0
      if (index < prev) return prev - 1
      return prev
    })
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    addFiles(files)
    e.target.value = ''
  }

  // Drag handlers for the image panel
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    addFiles(files)
  }, [addFiles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !productType || images.length === 0 || !onedriveFolderUrl.trim()) {
      setError('Please fill in all required fields and add at least one image')
      return
    }

    if (!onedriveFolderUrl.includes('onedrive') && !onedriveFolderUrl.includes('sharepoint')) {
      setError('Please enter a valid OneDrive or SharePoint link')
      return
    }

    setStep('uploading')
    setError(null)

    try {
      setUploadProgress({ step: 'Compressing images...', progress: 20 })

      const titleFile = images[titleIndex]
      const galleryFiles = images.filter((_, i) => i !== titleIndex)

      const compressedTitle = await compressImage(titleFile)

      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('productType', productType)
      formData.append('notes', notes.trim())
      formData.append('onedriveFolderUrl', onedriveFolderUrl.trim())
      formData.append('samplePhoto', compressedTitle)
      if (printTime) formData.append('printTimeMinutes', printTime)
      if (inkUsage) formData.append('inkUsageMl', inkUsage)

      for (const galleryFile of galleryFiles) {
        const compressed = await compressImage(galleryFile)
        formData.append('galleryImages', compressed)
      }

      setUploadProgress({ step: 'Uploading...', progress: 50 })

      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) throw new Error('Not authenticated')

      const response = await fetch('/api/samples', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload sample')
      }

      setUploadProgress({ step: 'Complete!', progress: 100 })
      setStep('success')

      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1500)
    } catch (err) {
      setStep('error')
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  }

  const currentPreview = imagePreviews[previewIndex] || null
  const isPreviewingTitle = previewIndex === titleIndex

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      {step === 'form' && (
        <div className="flex flex-col md:flex-row max-h-[85vh]">
          {/* Image Section */}
          <div
            className={`md:w-1/2 bg-gray-100 flex flex-col items-center justify-center p-6 min-h-[300px] transition-colors ${
              isDragOver ? 'bg-primary-50 ring-2 ring-inset ring-primary-300' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Large preview */}
            {currentPreview ? (
              <div className="relative mb-4">
                <img
                  src={currentPreview}
                  alt="Preview"
                  className="max-w-full max-h-[300px] object-contain rounded-lg shadow-sm"
                />
                {/* Star toggle on main image */}
                <button
                  type="button"
                  onClick={() => setTitleIndex(previewIndex)}
                  className={`absolute top-2 right-2 p-1.5 rounded-full transition-all shadow-md ${
                    isPreviewingTitle
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/90 text-gray-400 hover:text-primary-500 hover:bg-white'
                  }`}
                  title={isPreviewingTitle ? 'This is the title image' : 'Set as title image'}
                >
                  <Star className={`w-4 h-4 ${isPreviewingTitle ? 'fill-white' : ''}`} />
                </button>
                {/* Title badge helper — fades in/out */}
                {images.length > 1 && (
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium shadow-sm transition-opacity duration-500 ${
                    showTitleHint ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  } ${
                    isPreviewingTitle
                      ? 'bg-primary-500 text-white'
                      : 'bg-white/90 text-gray-500'
                  }`}>
                    {isPreviewingTitle ? '★ Title Image' : 'Click ★ to set as title'}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full min-h-[200px] mb-4">
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-600">
                  {isDragOver ? 'Drop images here!' : 'Drag & drop images here'}
                </span>
                <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP (max {MAX_IMAGES})</span>
              </div>
            )}

            {/* Thumbnail strip */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {imagePreviews.map((preview, index) => (
                <div
                  key={index}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    index === previewIndex
                      ? 'border-gray-800 ring-2 ring-gray-300'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => setPreviewIndex(index)}
                >
                  <img
                    src={preview}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Star badge for title */}
                  {index === titleIndex && (
                    <div className="absolute top-0.5 left-0.5 p-0.5 bg-primary-500 rounded-full">
                      <Star className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(index) }}
                    className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
              {/* Add button */}
              {images.length < MAX_IMAGES && (
                <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors">
                  <span className="text-gray-400 text-xl font-light">+</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {images.length}/{MAX_IMAGES} images
              {images.length > 1 && ' · The ★ title image gets background processing'}
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="md:w-1/2 p-8 overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Add New Sample</h2>

            {error && (
              <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 text-red-700 rounded-2xl text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              {/* Sample name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sample Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Blue Ocean Vodka Bottle"
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Product type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Type *
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 appearance-none cursor-pointer"
                  style={{ backgroundImage: 'none' }}
                >
                  {productTypes.map((pt) => (
                    <option key={pt.id} value={pt.id}>
                      {pt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* OneDrive folder link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OneDrive Folder Link *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={onedriveFolderUrl}
                    onChange={(e) => setOnedriveFolderUrl(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    placeholder="https://onedrive.live.com/..."
                  />
                </div>
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
                    value={printTime}
                    onChange={(e) => setPrintTime(e.target.value)}
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
                    value={inkUsage}
                    onChange={(e) => setInkUsage(e.target.value)}
                    placeholder="12.5"
                    className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
                  placeholder="Add notes... Use #tags for easy searching (e.g. #glossy #wine-red #2024)"
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  Tip: Use #hashtags to organize and find samples easily
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-600 font-medium rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gray-900 text-white font-medium rounded-2xl hover:bg-gray-800 transition-all"
                >
                  Add Sample
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {step === 'uploading' && (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Uploading...</h3>
          <p className="text-sm text-gray-500 mb-4">{uploadProgress.step}</p>
          <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Sample Added!</h3>
          <p className="text-sm text-gray-500">
            Your sample has been added to the library.
          </p>
        </div>
      )}

      {step === 'error' && (
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Failed</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setStep('form')}>
              Try Again
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
