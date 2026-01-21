'use client'

import { useState } from 'react'
import { Plus, Trash2, AlertCircle, Loader2, Package } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ProductType } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import IconPicker, { getIconComponent } from '@/components/IconPicker'

interface ManageProductTypesModalProps {
  isOpen: boolean
  onClose: () => void
  productTypes: ProductType[]
  onProductTypesChange: () => void
}

export default function ManageProductTypesModal({
  isOpen,
  onClose,
  productTypes,
  onProductTypesChange,
}: ManageProductTypesModalProps) {
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeIcon, setNewTypeIcon] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingIcon, setEditingIcon] = useState<string | null>(null)
  const [isSavingIcon, setIsSavingIcon] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTypeName.trim()) {
      setError('Please enter a product type name')
      return
    }

    const exists = productTypes.some(
      (pt) => pt.name.toLowerCase() === newTypeName.trim().toLowerCase()
    )
    if (exists) {
      setError('This product type already exists')
      return
    }

    setIsAdding(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/product-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ name: newTypeName.trim(), icon: newTypeIcon }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add product type')
      }

      setNewTypeName('')
      setNewTypeIcon(null)
      onProductTypesChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product type')
    } finally {
      setIsAdding(false)
    }
  }

  const handleIconChange = async (id: string, icon: string) => {
    // Update local state immediately for responsiveness
    setEditingIcon(icon)
    setIsSavingIcon(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/product-types?id=${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ icon }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update icon')
      }

      setEditingId(null)
      setEditingIcon(null)
      onProductTypesChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update icon')
    } finally {
      setIsSavingIcon(false)
    }
  }

  const handleDeleteType = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/product-types?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete product type')
      }

      onProductTypesChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product type')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Product Types" size="md">
      <div className="p-6">
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleAddType} className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Add New Product Type
          </label>
          <div className="flex gap-2 items-center">
            <IconPicker
              selectedIcon={newTypeIcon}
              onSelectIcon={setNewTypeIcon}
            />
            <Input
              id="newTypeName"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              placeholder="e.g., Candle Jar"
              className="flex-1"
            />
            <Button type="submit" variant="primary" disabled={isAdding}>
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add
            </Button>
          </div>
        </form>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Current Product Types ({productTypes.length})
          </h3>

          {productTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No product types yet</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {productTypes.map((type) => {
                const IconComponent = getIconComponent(type.icon)
                const isEditing = editingId === type.id

                return (
                  <div
                    key={type.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors"
                  >
                    {isEditing ? (
                      <IconPicker
                        selectedIcon={editingIcon}
                        onSelectIcon={(icon) => handleIconChange(type.id, icon)}
                      />
                    ) : (
                      <div
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border-2 border-gray-200 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        onDoubleClick={() => {
                          setEditingId(type.id)
                          setEditingIcon(type.icon)
                        }}
                        title="Double-click to change icon"
                      >
                        <IconComponent className="w-5 h-5 text-gray-500" stroke={1.5} />
                      </div>
                    )}
                    <span className="text-sm text-gray-700 font-medium flex-1">
                      {type.name}
                    </span>
                    <button
                      onClick={() => handleDeleteType(type.id, type.name)}
                      disabled={deletingId === type.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                      title={`Delete ${type.name}`}
                    >
                      {deletingId === type.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  )
}
