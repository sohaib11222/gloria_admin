import React, { useState } from 'react'
import { Copy as CopyIcon, Check } from 'lucide-react'
import { copyToClipboard } from '../../lib/utils'
import { Button } from './Button'
import toast from 'react-hot-toast'

interface CopyProps {
  text: string
  label?: string
  className?: string
}

export const Copy: React.FC<CopyProps> = ({ text, label = 'Copy', className }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await copyToClipboard(text)
      setCopied(true)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className={className}
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
      <span className="ml-2">{copied ? 'Copied!' : label}</span>
    </Button>
  )
}
