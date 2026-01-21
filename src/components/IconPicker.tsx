'use client'

import { useState, useRef, useEffect, type FC } from 'react'
import {
  IconBottle,
  IconBeer,
  IconCoffee,
  IconCandle,
  IconContainer,
  IconCup,
  IconFlask,
  IconFlask2,
  IconGlass,
  IconGlassChampagne,
  IconGlassCocktail,
  IconGlassFull,
  IconGlassGin,
  IconMug,
  IconPerfume,
  IconSpray,
  IconTipJar,
  IconVaccineBottle,
  IconBabyBottle,
  IconDroplet,
  IconFlame,
  IconSparkles,
  IconGift,
  IconShoppingBag,
  IconPalette,
  IconCircleDot,
  IconBox,
  IconPackage,
  type Icon,
} from '@tabler/icons-react'

// Icon component type
type IconComponent = Icon

// Icon mapping - maps icon names to Tabler components
export const ICON_MAP: Record<string, IconComponent> = {
  // Bottles
  'bottle': IconBottle,
  'beer': IconBeer,
  'baby-bottle': IconBabyBottle,
  'vaccine-bottle': IconVaccineBottle,

  // Glasses & Cups
  'glass': IconGlass,
  'glass-champagne': IconGlassChampagne,
  'glass-cocktail': IconGlassCocktail,
  'glass-full': IconGlassFull,
  'glass-gin': IconGlassGin,
  'cup': IconCup,
  'mug': IconMug,
  'coffee': IconCoffee,

  // Containers & Jars
  'container': IconContainer,
  'tip-jar': IconTipJar,
  'flask': IconFlask,
  'flask-2': IconFlask2,

  // Sprays & Cosmetics
  'spray': IconSpray,
  'perfume': IconPerfume,
  'candle': IconCandle,

  // Other
  'droplet': IconDroplet,
  'flame': IconFlame,
  'sparkles': IconSparkles,
  'gift': IconGift,
  'shopping-bag': IconShoppingBag,
  'palette': IconPalette,
  'circle-dot': IconCircleDot,
  'box': IconBox,
  'package': IconPackage,
}

// Grouped icons for better UX in the picker
export const ICON_GROUPS = {
  'Bottles': ['bottle', 'beer', 'baby-bottle', 'vaccine-bottle'],
  'Glasses & Cups': ['glass', 'glass-champagne', 'glass-cocktail', 'glass-full', 'glass-gin', 'cup', 'mug', 'coffee'],
  'Containers & Jars': ['container', 'tip-jar', 'flask', 'flask-2'],
  'Sprays & Cosmetics': ['spray', 'perfume', 'candle'],
  'Other': ['droplet', 'flame', 'sparkles', 'gift', 'shopping-bag', 'palette', 'box', 'package', 'circle-dot'],
}

// Get icon component by name
export function getIconComponent(iconName: string | null): IconComponent {
  if (!iconName || !ICON_MAP[iconName]) {
    return IconCircleDot // Default icon
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
      const dropdownHeight = 320 // Approximate height of dropdown

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
        <SelectedIconComponent className={`w-5 h-5 ${selectedIcon ? 'text-gray-700' : 'text-gray-400'}`} stroke={1.5} />
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
            className={`absolute left-0 z-50 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-72 max-h-80 overflow-y-auto ${
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
                        <IconComponent className="w-5 h-5" stroke={1.5} />
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
