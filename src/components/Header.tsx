'use client'

import { useState } from 'react'
import { Plus, LogOut, User, Menu, X } from 'lucide-react'
import Button from '@/components/ui/Button'

interface HeaderProps {
'use client'
  
import { useState } from 'react'
  import { Plus, LogOut, User, Menu, X, Settings } from 'lucide-react'
    import Button from '@/components/ui/Button'
      
interface HeaderProps {
    user: { email: string; full_name?: string | null } | null
    onAddNew: () => void
    onSignOut: () => void
    onManageTypes: () => void
}

export default function Header({ user, onAddNew, onSignOut, onManageTypes }: HeaderProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
      
    return (
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                          {/* Logo */}
                                  <div className="flex items-center gap-3">
                                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                                                            <span className="text-white font-bold text-lg">S</span>span>
                                              </div>div>
                                              <div>
                                                            <h1 className="text-lg font-bold text-gray-900">Sample Library</h1>h1>
                                                            <p className="text-xs text-gray-500 hidden sm:block">Design file repository</p>p>
                                              </div>div>
                                  </div>div>
                        
                          {/* Desktop nav */}
                                  <div className="hidden md:flex items-center gap-4">
                                    {user && (
                          <>
                                          <Button variant="primary" onClick={onAddNew}>
                                                            <Plus className="w-4 h-4" />
                                                            Add Sample
                                          </Button>Button>
                                          <button
                                                              onClick={onManageTypes}
                                                              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                              title="Manage Product Types"
                                                            >
                                                            <Settings className="w-5 h-5" />
                                          </button>button>
                                          <div className="h-6 w-px bg-gray-200" />
                                          <div className="flex items-center gap-3">
                                                            <div className="text-right">
                                                                                <p className="text-sm font-medium text-gray-700">
                                                                                  {user.full_name || user.email}
                                                                                  </p>p>
                                                              {user.full_name && (
                                                  <p className="text-xs text-gray-500">{user.email}</p>p>
                                                                                )}
                                                            </div>div>
                                                            <button
                                                                                  onClick={onSignOut}
                                                                                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                                                                  title="Sign out"
                                                                                >
                                                                                <LogOut className="w-5 h-5" />
                                                            </button>button>
                                          </div>div>
                          </>>
                        )}
                                  </div>div>
                        
                          {/* Mobile menu button */}
                                  <button
                                                className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                              >
                                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                  </button>button>
                        </div>div>
                </div>div>
          
            {/* Mobile menu */}
            {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white">
                              <div className="px-4 py-4 space-y-4">
                                {user && (
                                    <>
                                                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                                                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                                                          <User className="w-5 h-5 text-gray-500" />
                                                                      </div>div>
                                                                      <div>
                                                                                          <p className="text-sm font-medium text-gray-700">
                                                                                            {user.full_name || user.email}
                                                                                            </p>p>
                                                                        {user.full_name && (
                                                            <p className="text-xs text-gray-500">{user.email}</p>p>
                                                                                          )}
                                                                      </div>div>
                                                    </div>div>
                                                    <Button variant="primary" className="w-full" onClick={onAddNew}>
                                                                      <Plus className="w-4 h-4" />
                                                                      Add Sample
                                                    </Button>Button>
                                                    <Button variant="secondary" className="w-full" onClick={onManageTypes}>
                                                                      <Settings className="w-4 h-4" />
                                                                      Manage Product Types
                                                    </Button>Button>
                                                    <Button variant="secondary" className="w-full" onClick={onSignOut}>
                                                                      <LogOut className="w-4 h-4" />
                                                                      Sign Out
                                                    </Button>Button>
                                    </>>
                                  )}
                              </div>div>
                    </div>div>
                )}
          </header>header>
        )
}</></></header>user: { email: string; full_name?: string | null } | null
  onAddNew: () => void
  onSignOut: () => void
}

export default function Header({ user, onAddNew, onSignOut }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Sample Library</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Design file repository</p>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <>
                <Button variant="primary" onClick={onAddNew}>
                  <Plus className="w-4 h-4" />
                  Add Sample
                </Button>
                <div className="h-6 w-px bg-gray-200" />
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {user.full_name || user.email}
                    </p>
                    {user.full_name && (
                      <p className="text-xs text-gray-500">{user.email}</p>
                    )}
                  </div>
                  <button
                    onClick={onSignOut}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-4">
            {user && (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {user.full_name || user.email}
                    </p>
                    {user.full_name && (
                      <p className="text-xs text-gray-500">{user.email}</p>
                    )}
                  </div>
                </div>
                <Button variant="primary" className="w-full" onClick={onAddNew}>
                  <Plus className="w-4 h-4" />
                  Add Sample
                </Button>
                <Button variant="secondary" className="w-full" onClick={onSignOut}>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
