'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image } from 'lucide-react'

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void
  files: File[]
  onRemoveFile: (index: number) => void
  accept?: Record<string, string[]>
  maxFiles?: number
  label: string
  helperText?: string
  isImage?: boolean
}

export default function FileDropzone({
  onFilesSelected,
  files,
  onRemoveFile,
  accept,
  maxFiles = 10,
  label,
  helperText,
  isImage = false,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles)
    },
    [onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>

      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className={`p-3 rounded-full ${isDragActive ? 'bg-primary-100' : 'bg-gray-100'}`}>
            <Upload className={`w-6 h-6 ${isDragActive ? 'text-primary-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-xs text-gray-500 mt-1">or click to browse</p>
          </div>
        </div>
      </div>

      {helperText && (
        <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
            >
              {isImage && file.type.startsWith('image/') ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveFile(index)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
