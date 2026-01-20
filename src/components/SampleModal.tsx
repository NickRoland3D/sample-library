'use client'

import { useState } from 'react'
import { ExternalLink, Calendar, User, FolderOpen, Download } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { Sample } from '@/types/database'

interface SampleModalProps {
  sample: Sample | null
  isOpen: boolean
  onClose: () => void
}

export default function SampleModal({ sample, isOpen, onClose }: SampleModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  if (!sample) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="md:w-1/2 bg-gray-100">
          <div className="aspect-square relative">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            )}
            <img
              src={sample.thumbnail_url}
              alt={sample.name}
              className={`w-full h-full object-contain transition-opacity duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </div>

        {/* Details */}
        <div className="md:w-1/2 p-6 flex flex-col">
          <div className="flex-1">
            {/* Header */}
            <div className="mb-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 mb-2">
                {sample.product_type}
              </span>
              <h2 className="text-xl font-bold text-gray-900">{sample.name}</h2>
            </div>

            {/* Notes */}
            {sample.notes && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-500 mb-1">Notes</h4>
                <p className="text-gray-700">{sample.notes}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>Added {new Date(sample.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => window.open(sample.onedrive_folder_url, '_blank')}
            >
              <FolderOpen className="w-4 h-4" />
              Open Design Files in OneDrive
            </Button>
            <p className="text-xs text-center text-gray-500">
              Opens folder containing AI, print files, and source assets
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
