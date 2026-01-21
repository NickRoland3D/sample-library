'use client'

import { Plus } from 'lucide-react'

interface FloatingActionButtonProps {
  onClick: () => void
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-50
        flex items-center justify-center
        w-14 h-14 rounded-full
        bg-primary-500 hover:bg-primary-600
        text-white shadow-lg hover:shadow-xl
        transition-all duration-300 ease-out
        hover:scale-110 active:scale-95
        group
      "
      title="Add new sample"
    >
      <Plus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />

      {/* Tooltip on hover */}
      <span className="
        absolute right-full mr-3 px-3 py-1.5
        bg-gray-900 text-white text-sm font-medium
        rounded-lg whitespace-nowrap
        opacity-0 group-hover:opacity-100
        translate-x-2 group-hover:translate-x-0
        transition-all duration-200
        pointer-events-none
      ">
        Add Sample
      </span>
    </button>
  )
}
