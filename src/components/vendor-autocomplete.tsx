'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { searchVendors } from '@/app/actions/team'
import { useDebounce } from '@/hooks/use-debounce'
import { CreateVendorModal } from './create-vendor-modal'

interface Vendor {
  id: string
  name: string
  pan_gst?: string
}

interface VendorAutocompleteProps {
  onSelect: (vendorName: string, gstPan?: string) => void
  defaultValue?: string
  disabled?: boolean
}

export function VendorAutocomplete({ onSelect, defaultValue = '', disabled }: VendorAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultValue)
  const [query, setQuery] = React.useState('')
  const [vendors, setVendors] = React.useState<Vendor[]>([])
  const [loading, setLoading] = React.useState(false)
  const [showModal, setShowModal] = React.useState(false)
  
  const debouncedQuery = useDebounce(query, 300)

  React.useEffect(() => {
    if (debouncedQuery.length < 2) {
      setVendors([])
      return
    }

    const fetchVendors = async () => {
      setLoading(true)
      const results = await searchVendors(debouncedQuery)
      setVendors(results as Vendor[])
      setLoading(false)
    }

    fetchVendors()
  }, [debouncedQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value || "Select or type vendor name..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search vendors..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && <div className="p-4 flex justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>}
            <CommandEmpty>
              {query.length > 0 ? (
                <div className="p-3 border-t">
                  <p className="text-sm font-medium mb-2">No vendor found for "{query}"</p>
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="w-full justify-center gap-2"
                    onClick={() => {
                      setShowModal(true)
                    }}
                  >
                    Create Vendor: {query}
                  </Button>
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search...
                </div>
              )}
            </CommandEmpty>
            <CommandGroup>
              {vendors.map((vendor) => (
                <CommandItem
                  key={vendor.id}
                  value={vendor.name}
                  onSelect={(currentValue) => {
                    setValue(currentValue)
                    onSelect(vendor.name, vendor.pan_gst)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === vendor.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{vendor.name}</span>
                    {vendor.pan_gst && <span className="text-xs text-muted-foreground">{vendor.pan_gst}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      <input type="hidden" name="vendor" value={value} />
      
      <CreateVendorModal 
        open={showModal} 
        onOpenChange={setShowModal}
        initialName={query}
        onSuccess={(vendor) => {
          setValue(vendor.name)
          onSelect(vendor.name, vendor.pan_gst)
          setOpen(false)
        }}
      />
    </Popover>
  )
}
