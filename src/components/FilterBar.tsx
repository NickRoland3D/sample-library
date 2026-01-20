'use client'

import { Search, X, Filter } from 'lucide-react'
import { ProductType } from '@/types/database'

interface FilterBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedType: string | null
  onTypeChange: (type: string | null) => void
  productTypes: ProductType[]
  totalResults: number
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  productTypes,
  totalResults,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search samples..."
              className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Product type filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mr-2">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter:</span>
          </div>
          <button
            onClick={() => onTypeChange(null)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              selectedType === null
                ? 'bg-primary-100 text-primary-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {productTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => onTypeChange(type.name)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedType === type.name
                  ? 'bg-primary-100 text-primary-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          {totalResults} {totalResults === 1 ? 'sample' : 'samples'} found
          {(searchQuery || selectedType) && (
            <button
              onClick={() => {
                onSearchChange('')
                onTypeChange(null)
              }}
              className="ml-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </p>
      </div>
    </div>
  )
}
