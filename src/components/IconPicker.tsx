'use client'

import { useState } from 'react'
import {
  Wine,
  Beer,
  Coffee,
  CupSoda,
  GlassWater,
  Martini,
  Milk,
  FlaskConical,
  FlaskRound,
  Flame,
  Package,
  Box,
  Cylinder,
  Sparkles,
  Gift,
  ShoppingBag,
  Droplet,
  Palette,
  CircleDot,
  type LucideIcon,
} from 'lucide-react'

// Icon mapping - maps icon names to components
export const ICON_MAP: Record<string, LucideIcon> = {
  wine: Wine,
  beer: Beer,
  coffee: Coffee,
  'cup-soda': CupSoda,
  'glass-water': GlassWater,
  martini: Martini,
  milk: Milk,
  'flask-round': FlaskRound,
  'flask-conical': FlaskConical,
  flame: Flame,
  package: Package,
  box: Box,
  cylinder: Cylinder,
  sparkles: Sparkles,
  gift: Gift,
  'shopping-bag': ShoppingBag,
  droplet: Droplet,
  palette: Palette,
  'circle-dot': CircleDot,
}

// Grouped icons for better UX in the picker
export const ICON_GROUPS = {
  'Bottles & Glasses': ['wine', 'beer', 'martini', 'glass-water', 'cup-soda', 'coffee', 'milk'],
  'Containers': ['flask-round', 'flask-conical', 'cylinder', 'box', 'package'],
  'Other': ['flame', 'sparkles', 'gift', 'shopping-bag', 'droplet', 'palette', 'circle-dot'],
}

// Get icon component by name
export function getIconComponent(iconName: string | null): LucideIcon {
  if (!iconName || !ICON_MAP[iconName]) {
    return CircleDot // Default icon
  }
  return ICON_MAP[iconName]
}

interface IconPickerProps {
  selectedIcon: string | null
  onSelectIcon: (icon: string) => void
}

export default function IconPicker({ selectedIcon, onSelectIcon }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const SelectedIconComponent = getIconComponent(selectedIcon)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-center w-10 h-10 rounded-lg border-2 transition-all
          ${isOpen
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
          }
        `}
        title="Choose icon"
      >
        <SelectedIconComponent className={`w-5 h-5 ${selectedIcon ? 'text-gray-700' : 'text-gray-400'}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-64">
            <div className="text-xs font-medium text-gray-500 mb-2 px-1">Choose an icon</div>

            {Object.entries(ICON_GROUPS).map(([groupName, icons]) => (
              <div key={groupName} className="mb-3 last:mb-0">
                <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1.5 px-1">
                  {groupName}
                </div>
                <div className="flex flex-wrap gap-1">
                  {icons.map((iconName) => {
                    const IconComponent = ICON_MAP[iconName]
                    const isSelected = selectedIcon === iconName

                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => {
                          onSelectIcon(iconName)
                          setIsOpen(false)
                        }}
                        className={`
                          p-2 rounded-lg transition-all
                          ${isSelected
                            ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-500'
                            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
                          }
                        `}
                        title={iconName.replace(/-/g, ' ')}
                      >
                        <IconComponent className="w-5 h-5" />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
