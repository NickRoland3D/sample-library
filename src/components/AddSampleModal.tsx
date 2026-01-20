'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Loader2, Link as LinkIcon } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import FileDropzone from '@/components/FileDropzone'
import { ProductType } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface AddSampleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  productTypes: ProductType[]
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
  const [samplePhoto, setSamplePhoto] = useState<File[]>([])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('form')
        setName('')
        setProductType('')
        setNotes('')
        setOnedriveFolderUrl('')
        setSamplePhoto([])
        setError(null)
        setUploadProgress({ step: '', progress: 0 })
      }, 300)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim() || !productType || samplePhoto.length === 0 || !onedriveFolderUrl.trim()) {
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
      formData.append('samplePhoto', samplePhoto[0])

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

  const handleRemovePhoto = (index: number) => {
    setSamplePhoto((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Sample" size="lg">
      {step === 'form' && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Sample name */}
          <Input
            id="name"
            label="Sample Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Bain's Whisky Label Design"
          />

          {/* Product type */}
          <Select
            id="productType"
            label="Product Type *"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            placeholder="Select a product type"
            options={productTypes.map((pt) => ({ value: pt.name, label: pt.name }))}
          />

          {/* Sample photo */}
          <FileDropzone
            label="Sample Photo *"
            files={samplePhoto}
            onFilesSelected={(files) => setSamplePhoto(files.slice(0, 1))}
            onRemoveFile={handleRemovePhoto}
            accept={{
              'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
            }}
            maxFiles={1}
            helperText="Upload a photo of the physical sample (JPG, PNG, WebP)"
            isImage
          />

          {/* OneDrive folder link */}
          <div>
            <label
              htmlFor="onedriveFolderUrl"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              OneDrive Folder Link *
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                <LinkIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input
                id="onedriveFolderUrl"
                type="url"
                value={onedriveFolderUrl}
                onChange={(e) => setOnedriveFolderUrl(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-colors"
                placeholder="https://onedrive.live.com/..."
              />
            </div>
            <p className="mt-1.5 text-sm text-gray-500">
              Paste the share link to the OneDrive folder containing your design files
            </p>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-colors resize-none"
              placeholder="Any additional notes about this sample..."
            />
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
        </form>
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
