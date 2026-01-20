'use client'

import { FolderOpen, Plus, Search } from 'lucide-react'
import Button from '@/components/ui/Button'

interface EmptyStateProps {
  type: 'no-samples' | 'no-results'
  onAddNew?: () => void
  onClearFilters?: () => void
}

export default function EmptyState({ type, onAddNew, onClearFilters }: EmptyStateProps) {
  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No samples found</h3>
        <p className="text-gray-500 text-center max-w-md mb-6">
          We couldn't find any samples matching your search. Try adjusting your filters or search
          terms.
        </p>
        {onClearFilters && (
          <Button variant="secondary" onClick={onClearFilters}>
            Clear filters
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-6">
        <FolderOpen className="w-10 h-10 text-primary-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No samples yet</h3>
      <p className="text-gray-500 text-center max-w-md mb-6">
        Get started by adding your first sample. Upload a photo and design files to build your
        library.
      </p>
      {onAddNew && (
        <Button variant="primary" size="lg" onClick={onAddNew}>
          <Plus className="w-5 h-5" />
          Add Your First Sample
        </Button>
      )}
    </div>
  )
}
