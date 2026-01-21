'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Loader2, Link as LinkIcon, Upload, X } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ProductType, DifficultyLevel } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface AddSampleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  productTypes: ProductType[]
  prefilledImage?: File | null
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
  prefilledImage,
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
  const [samplePhoto, setSamplePhoto] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Optional specs
  const [printTime, setPrintTime] = useState('')
  const [inkUsage, setInkUsage] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyLevel | ''>('')

  // Handle prefilled image from drag-and-drop
  useEffect(() => {
    if (prefilledImage && isOpen) {
      setSamplePhoto(prefilledImage)
      const url = URL.createObjectURL(prefilledImage)
      setImagePreview(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [prefilledImage, isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('form')
        setName('')
        setProductType('')
        setNotes('')
        setOnedriveFolderUrl('')
        setSamplePhoto(null)
        setImagePreview(null)
        setPrintTime('')
        setInkUsage('')
        setDifficulty('')
        setError(null)
        setUploadProgress({ step: '', progress: 0 })
      }, 300)
    }
  }, [isOpen])

  // Set default product type when productTypes load
  useEffect(() => {
    if (productTypes.length > 0 && !productType) {
      setProductType(productTypes[0].id)
    }
  }, [productTypes, productType])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSamplePhoto(file)
      const url = URL.createObjectURL(file)
      setImagePreview(url)
    }
  }

  const handleRemoveImage = () => {
    setSamplePhoto(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !productType || !samplePhoto || !onedriveFolderUrl.trim()) {
      setError('Please fill in all required fields')
      return
    }

    // Basic URL validation
    if (!onedriveFolderUrl.includes('onedrive') && !onedriveFolderUrl.includes('sharepoint')) {
      setError('Please enter a valid OneDrive or SharePoint link')
      return
    }

    setStep('uploading')
    setError(null)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('name', name.trim())
      formData.append('productType', productType)
      formData.append('notes', notes.trim())
      formData.append('onedriveFolderUrl', onedriveFolderUrl.trim())
      formData.append('samplePhoto', samplePhoto)

      // Add optional specs
      if (printTime) formData.append('printTimeMinutes', printTime)
      if (inkUsage) formData.append('inkUsageMl', inkUsage)
      if (difficulty) formData.append('difficulty', difficulty)

      setUploadProgress({ step: 'Uploading sample photo...', progress: 50 })

      // Get the auth token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      {step === 'form' && (
        <div className="flex flex-col md:flex-row max-h-[85vh]">
          {/* Image Section */}
          <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-6 min-h-[300px]">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-w-full max-h-[400px] object-contain rounded-lg shadow-sm"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-full min-h-[250px] border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-600">Click to upload photo</span>
                <span className="text-xs text-gray-400 mt-1">JPG, PNG, WebP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="md:w-1/2 p-6 overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Add New Sample</h2>

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Sample name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sample Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Blue Ocean Vodka Bottle"
                />
              </div>

              {/* Product type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type *
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OneDrive Folder Link *
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="url"
                    value={onedriveFolderUrl}
                    onChange={(e) => setOnedriveFolderUrl(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-colors"
                    placeholder="https://onedrive.live.com/..."
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-colors resize-none"
                  placeholder="Any additional notes..."
                />
              </div>

              {/* Optional Specs */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Optional Specifications
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Print Time (min)
                    </label>
                    <Input
                      type="number"
                      value={printTime}
                      onChange={(e) => setPrintTime(e.target.value)}
                      placeholder="45"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Ink Usage (ml)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      value={inkUsage}
                      onChange={(e) => setInkUsage(e.target.value)}
                      placeholder="12.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as DifficultyLevel | '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value="">--</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Add Sample
                </Button>
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
