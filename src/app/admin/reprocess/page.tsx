'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { RefreshCw, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ReprocessPage() {
  const supabase = createClient()
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{
    message: string
    total?: number
    processed?: number
    failed?: number
    errors?: string[]
  } | null>(null)

  const handleReprocess = async () => {
    setIsProcessing(true)
    setResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        setResult({ message: 'Not authenticated. Please log in first.' })
        return
      }

      const response = await fetch('/api/admin/reprocess-images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        message: error instanceof Error ? error.message : 'An error occurred'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gallery
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Reprocess All Images
          </h1>
          <p className="text-gray-600 mb-6">
            This will normalize all existing sample images by trimming whitespace
            and adding consistent 10% padding. Images will be made square for
            consistent gallery display.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-amber-800 text-sm">
              <strong>Note:</strong> This process may take a few minutes depending on
              how many images you have. Do not close this page while processing.
            </p>
          </div>

          <Button
            onClick={handleReprocess}
            disabled={isProcessing}
            isLoading={isProcessing}
            variant="primary"
            size="lg"
            className="w-full"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
            {isProcessing ? 'Processing...' : 'Start Reprocessing'}
          </Button>

          {result && (
            <div className={`mt-6 p-4 rounded-lg ${
              result.failed === 0 || !result.failed
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.failed === 0 || !result.failed ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    result.failed === 0 || !result.failed ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                  {result.total !== undefined && (
                    <p className="text-sm text-gray-600 mt-1">
                      Total: {result.total} |
                      Processed: {result.processed} |
                      Failed: {result.failed}
                    </p>
                  )}
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-700">Errors:</p>
                      <ul className="text-sm text-red-600 list-disc list-inside">
                        {result.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
