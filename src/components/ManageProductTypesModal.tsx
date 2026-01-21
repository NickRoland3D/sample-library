'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [editingName, setEditingName] = useState('')
  const [editingIcon, setEditingIcon] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<'name' | 'icon' | null>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const shouldSaveOnBlurRef = useRef(true)

  // Focus input or open icon picker when entering edit mode
  useEffect(() => {
    if (editingId && editingField === 'name' && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingId, editingField])

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

  const startEditingName = (type: ProductType) => {
    setEditingId(type.id)
    setEditingName(type.name)
    setEditingIcon(type.icon)
    setEditingField('name')
  }

  const startEditingIcon = (type: ProductType) => {
    setEditingId(type.id)
    setEditingName(type.name)
    setEditingIcon(type.icon)
    setEditingField('icon')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditingName('')
    setEditingIcon(null)
    setEditingField(null)
  }

  const saveEditing = async () => {
    if (!editingId || !editingName.trim()) {
      cancelEditing()
      return
    }

    const currentType = productTypes.find(t => t.id === editingId)
    if (!currentType) {
      cancelEditing()
      return
    }

    // Check if anything changed
    const nameChanged = editingName.trim() !== currentType.name
    const iconChanged = editingIcon !== currentType.icon

    if (!nameChanged && !iconChanged) {
      cancelEditing()
      return
    }

    // Check for duplicate name
    if (nameChanged) {
      const exists = productTypes.some(
        (pt) => pt.id !== editingId && pt.name.toLowerCase() === editingName.trim().toLowerCase()
      )
      if (exists) {
        setError('A product type with this name already exists')
        return
      }
    }

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const updateData: { name?: string; icon?: string | null } = {}
      if (nameChanged) updateData.name = editingName.trim()
      if (iconChanged) updateData.icon = editingIcon

      const response = await fetch(`/api/product-types?id=${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update product type')
      }

      cancelEditing()
      onProductTypesChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product type')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEditing()
    } else if (e.key === 'Escape') {
      shouldSaveOnBlurRef.current = false
      cancelEditing()
    }
  }

  const handleInputBlur = () => {
    // Delay to allow clicks on icon picker to register
    setTimeout(() => {
      if (shouldSaveOnBlurRef.current && editingId) {
        saveEditing()
      }
      shouldSaveOnBlurRef.current = true
    }, 200)
  }

  const handleIconPickerClick = () => {
    // Prevent blur from saving while interacting with icon picker
    shouldSaveOnBlurRef.current = false
    // Re-enable after a short delay
    setTimeout(() => {
      shouldSaveOnBlurRef.current = true
    }, 300)
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
      <div className="p-6 overflow-visible">
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
            <div className="space-y-2">
              {productTypes.map((type) => {
                const isEditing = editingId === type.id
                const IconComponent = getIconComponent(isEditing ? editingIcon : type.icon)

                return (
                  <div
                    key={type.id}
                    className={`flex items-center gap-3 p-3 rounded-lg group transition-colors ${
                      isEditing
                        ? 'bg-primary-50 ring-2 ring-primary-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {/* Icon - double-click to edit icon */}
                    {isEditing ? (
                      <div onMouseDown={handleIconPickerClick}>
                        <IconPicker
                          selectedIcon={editingIcon}
                          onSelectIcon={setEditingIcon}
                        />
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 flex items-center justify-center rounded-lg bg-white border-2 border-gray-200 cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-colors"
                        onDoubleClick={() => startEditingIcon(type)}
                        title="Double-click to change icon"
                      >
                        <IconComponent className="w-5 h-5 text-gray-500" stroke={1.5} />
                      </div>
                    )}

                    {/* Name - double-click to edit name */}
                    {isEditing ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        onBlur={handleInputBlur}
                        className="flex-1 px-2 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        disabled={isSaving}
                      />
                    ) : (
                      <span
                        className="text-sm text-gray-700 font-medium flex-1 cursor-pointer hover:text-primary-600 transition-colors py-1"
                        onDoubleClick={() => startEditingName(type)}
                        title="Double-click to rename"
                      >
                        {type.name}
                      </span>
                    )}

                    {/* Actions */}
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteType(type.id, type.name)
                        }}
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
                    )}
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
