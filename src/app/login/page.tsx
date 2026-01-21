'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { AlertCircle } from 'lucide-react'

// Allowed email domains for registration
const ALLOWED_DOMAINS = ['rolanddg.co.jp', 'rolanddga.com', 'rolanddg.com']

function isAllowedEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return domain ? ALLOWED_DOMAINS.includes(domain) : false
}

// Sample images for the animated background
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400',
  'https://images.unsplash.com/photo-1586153077373-a614b5e6f7b4?w=400',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400',
  'https://images.unsplash.com/photo-1570194065650-d99fb4b38b7f?w=400',
  'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
  'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400',
  'https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=400',
  'https://images.unsplash.com/photo-1600612253971-422e7f7faeb6?w=400',
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
  'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=400',
  'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400',
]

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

  // Fetch actual gallery images from Supabase
  useEffect(() => {
    async function fetchSampleImages() {
      const { data: samples } = await supabase
        .from('samples')
        .select('image_url')
        .not('image_url', 'is', null)
        .limit(24)

      if (samples && samples.length > 0) {
        const images = samples
          .map((s: { image_url: string | null }) => s.image_url)
          .filter((url): url is string => url !== null)
        setGalleryImages(images)
      } else {
        // Fallback to placeholder images
        setGalleryImages(SAMPLE_IMAGES)
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

  // Create duplicated images for seamless loop
  const displayImages = [...galleryImages, ...galleryImages]

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/90 to-gray-900/95 z-10" />

        {/* Scrolling image grid */}
        <div className="absolute inset-0 flex gap-4 animate-scroll-slow">
          {[0, 1, 2, 3].map((colIndex) => (
            <div
              key={colIndex}
              className={`flex flex-col gap-4 ${colIndex % 2 === 0 ? 'animate-scroll-up' : 'animate-scroll-down'}`}
              style={{
                animationDuration: `${60 + colIndex * 10}s`,
                width: '25%',
                minWidth: '200px'
              }}
            >
              {displayImages.map((img, imgIndex) => (
                <div
                  key={`${colIndex}-${imgIndex}`}
                  className="aspect-square rounded-2xl overflow-hidden opacity-40"
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md relative z-20">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white rounded-xl p-4 mb-4">
            <img
              src="/roland-logo.svg"
              alt="Roland DG"
              className="h-8"
            />
          </div>
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
