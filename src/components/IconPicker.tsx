'use client'

import { useState, useRef, useEffect, type FC } from 'react'
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
import {
  customIcons,
  AerosolCanIcon,
  BeerBottleIcon,
  CandleJarIcon,
  ChampagneBottleIcon,
  CosmeticJarIcon,
  DropperBottleIcon,
  LiquorBottleIcon,
  LotionPumpIcon,
  MasonJarIcon,
  PerfumeBottleIcon,
  SodaCanIcon,
  SprayBottleIcon,
  VialIcon,
} from './icons/CustomIcons'

// Custom icon wrapper to match LucideIcon interface
type IconComponent = LucideIcon | FC<{ className?: string; size?: number | string }>

// Icon mapping - maps icon names to components (Lucide icons)
export const LUCIDE_ICON_MAP: Record<string, LucideIcon> = {
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

// Custom icons map
export const CUSTOM_ICON_MAP: Record<string, FC<{ className?: string; size?: number | string }>> = {
  'aerosol-can': AerosolCanIcon,
  'beer-bottle': BeerBottleIcon,
  'candle-jar': CandleJarIcon,
  'champagne-bottle': ChampagneBottleIcon,
  'cosmetic-jar': CosmeticJarIcon,
  'dropper-bottle': DropperBottleIcon,
  'liquor-bottle': LiquorBottleIcon,
  'lotion-pump': LotionPumpIcon,
  'mason-jar': MasonJarIcon,
  'perfume-bottle': PerfumeBottleIcon,
  'soda-can': SodaCanIcon,
  'spray-bottle': SprayBottleIcon,
  'vial': VialIcon,
}

// Combined icon map
export const ICON_MAP: Record<string, IconComponent> = {
  ...LUCIDE_ICON_MAP,
  ...CUSTOM_ICON_MAP,
}

// Grouped icons for better UX in the picker
export const ICON_GROUPS = {
  'Bottles': ['beer-bottle', 'champagne-bottle', 'liquor-bottle', 'wine', 'beer', 'martini'],
  'Jars & Containers': ['mason-jar', 'candle-jar', 'cosmetic-jar', 'flask-round', 'flask-conical', 'cylinder'],
  'Cans & Sprays': ['soda-can', 'aerosol-can', 'spray-bottle', 'cup-soda'],
  'Cosmetics & Dispensers': ['perfume-bottle', 'dropper-bottle', 'lotion-pump', 'vial'],
  'Other': ['glass-water', 'coffee', 'milk', 'flame', 'sparkles', 'gift', 'shopping-bag', 'droplet', 'palette', 'box', 'package', 'circle-dot'],
}

// Get icon component by name
export function getIconComponent(iconName: string | null): IconComponent {
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
  const [openUpward, setOpenUpward] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const SelectedIconComponent = getIconComponent(selectedIcon)

  // Check if dropdown should open upward based on available space
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - buttonRect.bottom
      const dropdownHeight = 280 // Approximate height of dropdown

      setOpenUpward(spaceBelow < dropdownHeight)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
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

          {/* Dropdown - positioned upward or downward based on space */}
          <div
            ref={dropdownRef}
            className={`absolute left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-64 ${
              openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
          >
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
