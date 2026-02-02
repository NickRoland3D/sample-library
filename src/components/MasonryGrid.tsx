'use client'

import { useState, useCallback } from 'react'
import { Upload, ImagePlus, Grid, LayoutGrid } from 'lucide-react'
import { Sample, ProductType } from '@/types/database'

interface MasonryGridProps {
  samples: Sample[]
  productTypes: ProductType[]
  onSampleClick: (sample: Sample) => void
  onDropImage: (files: File[]) => void
}

// Grid size configurations
const GRID_SIZES = {
  small: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  medium: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  large: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3',
}

export default function MasonryGrid({
  samples,
  productTypes,
  onSampleClick,
  onDropImage,
}: MasonryGridProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [gridSize, setGridSize] = useState<'small' | 'medium' | 'large'>('medium')

  const getProductTypeName = (typeId: string) => {
    const type = productTypes.find(pt => pt.id === typeId)
    return type?.name || typeId
  }

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
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length > 0) {
      onDropImage(imageFiles)
    }
  }, [onDropImage])

  if (samples.length === 0) {
    return (
      <div
        className={`
          flex-1 flex flex-col items-center justify-center p-8 m-6 rounded-2xl border-2 border-dashed
          transition-all duration-300 ease-in-out
          ${isDragOver
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-200 bg-gray-50/50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`p-4 rounded-full mb-4 transition-colors ${isDragOver ? 'bg-primary-100' : 'bg-gray-100'}`}>
          <ImagePlus className={`w-12 h-12 ${isDragOver ? 'text-primary-500' : 'text-gray-400'}`} />
        </div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          {isDragOver ? 'Drop your image here!' : 'No samples yet'}
        </h3>
        <p className="text-gray-500 text-center max-w-md">
          {isDragOver
            ? 'Release to start adding a new sample'
            : 'Drag and drop an image here to add your first sample, or click the + button'
          }
        </p>
      </div>
    )
  }

  return (
    <div
      className={`
        flex-1 overflow-y-auto p-6 transition-all duration-300
        ${isDragOver ? 'bg-primary-50/50' : 'bg-gray-50'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-40 bg-primary-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
            <div className="p-4 rounded-full bg-primary-100 mb-4">
              <Upload className="w-12 h-12 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800">Drop to add sample</h3>
            <p className="text-gray-500 mt-1">Release to start adding a new sample</p>
          </div>
        </div>
      )}

      {/* Size Slider - Subtle control */}
      <div className="flex items-center justify-end mb-4 gap-2">
        <Grid className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="range"
          min="0"
          max="2"
          value={gridSize === 'small' ? 0 : gridSize === 'medium' ? 1 : 2}
          onChange={(e) => {
            const val = parseInt(e.target.value)
            setGridSize(val === 0 ? 'small' : val === 1 ? 'medium' : 'large')
          }}
          className="w-20 h-1 bg-gray-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-gray-400 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:hover:bg-gray-500 [&::-webkit-slider-thumb]:transition-colors"
        />
        <LayoutGrid className="w-3.5 h-3.5 text-gray-400" />
      </div>

      {/* Uniform Grid */}
      <div className={`grid ${GRID_SIZES[gridSize]} gap-4`}>
        {samples.map((sample) => (
          <div
            key={sample.id}
            className="group cursor-pointer"
            onClick={() => onSampleClick(sample)}
          >
            <div className="relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              {/* Image with fixed aspect ratio */}
              <div className="relative aspect-[4/5] flex items-center justify-center">
                <img
                  src={sample.thumbnail_url}
                  alt={sample.name}
                  className="max-w-full max-h-full object-contain"
                  loading="lazy"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Info overlay - only visible on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {/* Product type badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-full shadow-sm">
                      {getProductTypeName(sample.product_type)}
                    </span>
                  </div>

                  {/* Title at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-medium text-white truncate">
                      {sample.name}
                    </h3>
                    {sample.notes && (
                      <p className="text-xs text-white/80 mt-1 line-clamp-2">
                        {sample.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
