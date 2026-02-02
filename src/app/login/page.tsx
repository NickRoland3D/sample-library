'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { AlertCircle } from 'lucide-react'
import { ALLOWED_EMAIL_DOMAINS } from '@/lib/constants'

function isAllowedEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? ALLOWED_EMAIL_DOMAINS.includes(domain) : false
}

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<string[]>([])

  // Fetch gallery images from Supabase - dynamically updates as new samples are added
  useEffect(() => {
    async function fetchSampleImages() {
      const { data: samples } = await supabase
        .from('samples')
        .select('thumbnail_url')
        .not('thumbnail_url', 'is', null)
        .limit(48)

      if (samples && samples.length > 0) {
        const images = samples
          .map((s: { thumbnail_url: string | null }) => s.thumbnail_url)
          .filter((url): url is string => url !== null)
        setGalleryImages(images)
      }
    }
    fetchSampleImages()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        router.push('/')
        router.refresh()
      } else {
        // Validate email domain for registration
        if (!isAllowedEmail(email)) {
          throw new Error('Registration is restricted to Roland employees. Please use your Roland email address.')
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        })

        if (error) throw error

        setMessage('Check your email for a confirmation link!')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Create columns with offset images for visual variety
  const getColumnImages = (colIndex: number) => {
    const offset = colIndex * 3
    const images = []
    for (let i = 0; i < 8; i++) {
      images.push(galleryImages[(offset + i) % galleryImages.length])
    }
    // Duplicate for seamless loop
    return [...images, ...images]
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background - only shows when gallery has images */}
      {galleryImages.length > 0 && (
        <div className="absolute inset-0 overflow-hidden">
          {/* Scrolling image columns */}
          <div className="absolute inset-0 flex justify-center gap-3 px-4">
            {[0, 1, 2, 3, 4, 5].map((colIndex) => (
              <div
                key={colIndex}
                className={`flex-shrink-0 w-48 flex flex-col gap-3 ${
                  colIndex % 2 === 0 ? 'animate-scroll-up' : 'animate-scroll-down'
                }`}
                style={{
                  animationDuration: `${80 + colIndex * 15}s`,
                }}
              >
                {getColumnImages(colIndex).map((img, imgIndex) => (
                  <div
                    key={`${colIndex}-${imgIndex}`}
                    className="w-48 h-48 rounded-xl overflow-hidden flex-shrink-0"
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover opacity-30"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/40 to-gray-900/60" />
        </div>
      )}

      {/* Login Card */}
      <div className="w-full max-w-md relative z-20">
        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src="/rolandhybrid.svg"
            alt="Roland DG"
            className="h-12 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">Rotary Sample Gallery</h1>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="flex items-center gap-2 p-3 mb-6 bg-green-50 text-green-700 rounded-lg text-sm">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <Input
                id="fullName"
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            )}

            <Input
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />

            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              helperText={!isLogin ? 'Must be at least 6 characters' : undefined}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                  setMessage(null)
                }}
                className="ml-1 font-medium text-primary-600 hover:text-primary-700"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-500">
          Roland DG Corporation
        </p>
      </div>
    </div>
  )
}
