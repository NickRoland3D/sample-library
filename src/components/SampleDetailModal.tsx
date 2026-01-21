'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Sample, ProductType } from '@/types/database'
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

  // Reset form when sample changes
  useEffect(() => {
    if (sample) {
      setEditName(sample.name)
      setEditProductType(sample.product_type)
      setEditNotes(sample.notes || '')
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

  const hasSpecs = sample.print_time_minutes || sample.ink_usage_ml

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" size="xl">
      <div className="flex flex-col md:flex-row max-h-[85vh]">
        {/* Image Section */}
        <div className="md:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6 md:p-8">
          <img
            src={sample.thumbnail_url}
            alt={sample.name}
            className="max-w-full max-h-[400px] md:max-h-[500px] object-contain rounded-2xl shadow-lg"
          />
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add any notes about this sample..."
                  rows={3}
                  className="w-full px-4 py-3.5 bg-gray-50 border-0 rounded-2xl focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
                />
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
                  onClick={() => {
                    setIsEditing(false)
                    // Reset to original values
                    setEditName(sample.name)
                    setEditProductType(sample.product_type)
                    setEditNotes(sample.notes || '')
                  }}
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
                    {sample.notes}
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
                          {sample.print_time_minutes} min
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
                  onClick={() => setIsEditing(true)}
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
    </Modal>
  )
}
