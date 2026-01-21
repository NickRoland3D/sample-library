'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Copy,
  Check,
  Edit2,
  Trash2,
  Clock,
  Droplets,
  Gauge,
  ExternalLink,
  Loader2,
  Save,
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Sample, ProductType, DifficultyLevel } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface SampleDetailModalProps {
  sample: Sample | null
  isOpen: boolean
  onClose: () => void
  productTypes: ProductType[]
  onSampleUpdate: () => void
  onSampleDelete: (id: string) => void
}

export default function SampleDetailModal({
  sample,
  isOpen,
  onClose,
  productTypes,
  onSampleUpdate,
  onSampleDelete,
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
  const [editDifficulty, setEditDifficulty] = useState<DifficultyLevel | ''>('')

  // Reset form when sample changes
  useEffect(() => {
    if (sample) {
      setEditName(sample.name)
      setEditProductType(sample.product_type)
      setEditNotes(sample.notes || '')
      setEditPrintTime(sample.print_time_minutes?.toString() || '')
      setEditInkUsage(sample.ink_usage_ml?.toString() || '')
      setEditDifficulty(sample.difficulty || '')
      setIsEditing(false)
      setError(null)
    }
  }, [sample])

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

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) throw new Error('Not authenticated')

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
          print_time_minutes: editPrintTime ? parseInt(editPrintTime) : null,
          ink_usage_ml: editInkUsage ? parseFloat(editInkUsage) : null,
          difficulty: editDifficulty || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update sample')
      }

      setIsEditing(false)
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

  const getProductTypeName = (id: string) => {
    return productTypes.find(pt => pt.id === id)?.name || id
  }

  const hasSpecs = sample.print_time_minutes || sample.ink_usage_ml || sample.difficulty

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="xl">
      <div className="flex flex-col md:flex-row max-h-[85vh]">
        {/* Image Section */}
        <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-4 md:p-6">
          <img
            src={sample.thumbnail_url}
            alt={sample.name}
            className="max-w-full max-h-[400px] md:max-h-[500px] object-contain rounded-lg shadow-sm"
          />
        </div>

        {/* Info Section */}
        <div className="md:w-1/2 p-6 overflow-y-auto">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isEditing ? (
            /* Edit Mode */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sample Name *
                </label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Sample name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type
                </label>
                <select
                  value={editProductType}
                  onChange={(e) => setEditProductType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {productTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add any notes about this sample..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
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
                      value={editPrintTime}
                      onChange={(e) => setEditPrintTime(e.target.value)}
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
                      value={editInkUsage}
                      onChange={(e) => setEditInkUsage(e.target.value)}
                      placeholder="12.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={editDifficulty}
                      onChange={(e) => setEditDifficulty(e.target.value as DifficultyLevel | '')}
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

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false)
                    // Reset to original values
                    setEditName(sample.name)
                    setEditProductType(sample.product_type)
                    setEditNotes(sample.notes || '')
                    setEditPrintTime(sample.print_time_minutes?.toString() || '')
                    setEditInkUsage(sample.ink_usage_ml?.toString() || '')
                    setEditDifficulty(sample.difficulty || '')
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-4">
              {/* Header */}
              <div>
                <span className="inline-block px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full mb-2">
                  {getProductTypeName(sample.product_type)}
                </span>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {sample.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Added {new Date(sample.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Copy Link Button */}
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
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
                  className="flex items-center gap-2 w-full px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm font-medium">Open in OneDrive</span>
                </a>
              )}

              {/* Notes */}
              {sample.notes && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">
                    {sample.notes}
                  </p>
                </div>
              )}

              {/* Specs */}
              {hasSpecs && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-3">
                    {sample.print_time_minutes && (
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <Clock className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-900">
                          {sample.print_time_minutes} min
                        </p>
                        <p className="text-xs text-gray-500">Print Time</p>
                      </div>
                    )}
                    {sample.ink_usage_ml && (
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <Droplets className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-900">
                          {sample.ink_usage_ml} ml
                        </p>
                        <p className="text-xs text-gray-500">Ink Usage</p>
                      </div>
                    )}
                    {sample.difficulty && (
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <Gauge className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                        <p className="text-sm font-medium text-gray-900">
                          {sample.difficulty}
                        </p>
                        <p className="text-xs text-gray-500">Difficulty</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(true)}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600 hover:bg-red-50 hover:border-red-200"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
