'use client'

import { useState } from 'react'
import { ExternalLink, Calendar, User } from 'lucide-react'
import { Sample } from '@/types/database'

interface SampleCardProps {
  sample: Sample
  onClick: () => void
}

export default function SampleCard({ sample, onClick }: SampleCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1"
    >
      {/* Image container */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-gray-200 flex items-center justify-center mb-2">
                <ExternalLink className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500">Image unavailable</p>
            </div>
          </div>
        ) : (
          <img
            src={sample.thumbnail_url}
            alt={sample.name}
            className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

        {/* Product type badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-700 shadow-sm">
            {sample.product_type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
          {sample.name}
        </h3>
        {sample.notes && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{sample.notes}</p>
        )}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(sample.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}
