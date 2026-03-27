'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Site {
  id: string
  name: string
}

export function SiteFilter({ sites }: { sites: Site[] }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const currentSite = searchParams.get('site') || 'all'
  const selectedSite = sites.find(s => s.id === currentSite)

  const handleValueChange = (value: string | null) => {
    if (!value) return
    const params = new URLSearchParams(searchParams)
    if (value === 'all') {
      params.delete('site')
    } else {
      params.set('site', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="w-[250px]">
      <Select value={currentSite} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue>
            {currentSite === 'all' ? 'All Sites' : (selectedSite?.name || 'Loading...')}
          </SelectValue>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Sites</SelectItem>
          {sites.map((site) => (
            <SelectItem key={site.id} value={site.id}>
              {site.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
