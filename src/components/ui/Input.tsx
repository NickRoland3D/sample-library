'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full px-4 py-3 text-sm rounded-xl border-2
            bg-gray-50
            transition-all duration-200
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-0 focus:bg-white
            ${error
              ? 'border-red-200 focus:border-red-400 focus:ring-red-100'
              : 'border-gray-100 focus:border-primary-400 focus:ring-primary-100'
            }
            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
