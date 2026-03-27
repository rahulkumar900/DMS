'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createVendor } from '@/app/actions/team'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", 
  "Ladakh", "Lakshadweep", "Puducherry"
]

interface CreateVendorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName?: string
  onSuccess: (vendor: { id: string, name: string, pan_gst?: string }) => void
}

export function CreateVendorModal({ open, onOpenChange, initialName = '', onSuccess }: CreateVendorModalProps) {
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: initialName,
    pan_gst: '',
    state: ''
  })

  // Synchronize initialName when it changes
  React.useEffect(() => {
    if (open) {
      setFormData(prev => ({ ...prev, name: initialName }))
    }
  }, [initialName, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error('Vendor name is required')
      return
    }

    setLoading(true)
    try {
      const result = await createVendor(formData)
      if (result.error) {
        toast.error(result.error)
      } else if (result.success && result.vendor) {
        toast.success('Vendor created successfully')
        onSuccess(result.vendor)
        onOpenChange(false)
        setFormData({ name: '', pan_gst: '', state: '' })
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Vendor</DialogTitle>
          <DialogDescription>
            Add a new vendor with all details. Name and PAN/GST must be unique.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vendor Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="Full Legal Name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pan_gst">PAN / GST Number</Label>
            <Input
              id="pan_gst"
              name="pan_gst"
              placeholder="e.g. 27AAAAA0000A1Z5"
              value={formData.pan_gst}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor_state">State</Label>
            <select
              id="vendor_state"
              name="state"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.state}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Vendor'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
