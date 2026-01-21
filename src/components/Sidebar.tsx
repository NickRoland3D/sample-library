'use client'

import { useState } from 'react'
import { Plus, ChevronLeft, ChevronRight, Package } from 'lucide-react'
import { ProductType } from '@/types/database'

interface SidebarProps {
  productTypes: ProductType[]
  selectedType: string | null
  onTypeChange: (type: string | null) => void
  onManageTypes: () => void
  sampleCounts: Record<string, number>
  totalSamples: number
}

export default function Sidebar({
  productTypes,
  selectedType,
  onTypeChange,
  onManageTypes,
  sampleCounts,
  totalSamples,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <aside
      className={`
        relative flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-gray-200 ${isCollapsed ? 'px-3 justify-center' : 'px-4'}`}>
        {!isCollapsed && (
          <img
            src="/roland-logo.svg"
            alt="Roland"
            className="h-7 w-auto"
          />
        )}
        {isCollapsed && (
          <img
            src="/roland-logo.svg"
            alt="Roland"
            className="h-6 w-auto"
            style={{ clipPath: 'inset(0 70% 0 0)' }}
          />
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 z-10 p-1 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Category List */}
      <nav className="flex-1 overflow-y-auto py-4">
        {/* All Samples */}
        <button
          onClick={() => onTypeChange(null)}
          className={`
            w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200
            ${selectedType === null
              ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
              : 'text-gray-700 hover:bg-gray-50'
            }
          `}
        >
          <Package className={`w-5 h-5 flex-shrink-0 ${selectedType === null ? 'text-primary-500' : 'text-gray-400'}`} />
          {!isCollapsed && (
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className="font-medium truncate">All Samples</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${selectedType === null ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                {totalSamples}
              </span>
            </div>
          )}
        </button>

        {/* Divider */}
        <div className={`my-3 border-t border-gray-100 ${isCollapsed ? 'mx-2' : 'mx-4'}`} />

        {/* Product Types */}
        <div className="space-y-1">
          {productTypes.map((type) => {
            const count = sampleCounts[type.id] || 0
            const isActive = selectedType === type.id

            return (
              <button
                key={type.id}
                onClick={() => onTypeChange(type.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200
                  ${isActive
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                title={isCollapsed ? `${type.name} (${count})` : undefined}
              >
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-primary-500' : 'bg-gray-300'}`}
                />
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{type.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Add Type Button */}
      <div className={`p-4 border-t border-gray-100 ${isCollapsed ? 'px-2' : ''}`}>
        <button
          onClick={onManageTypes}
          className={`
            flex items-center justify-center gap-2 w-full py-2.5 text-gray-500 hover:text-primary-600
            hover:bg-primary-50 rounded-lg transition-all duration-200 border border-dashed border-gray-300
            hover:border-primary-300
          `}
          title="Manage Product Types"
        >
          <Plus className="w-4 h-4" />
          {!isCollapsed && <span className="text-sm">Manage Types</span>}
        </button>
      </div>
    </aside>
  )
}
