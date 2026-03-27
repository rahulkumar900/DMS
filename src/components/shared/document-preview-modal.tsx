'use client'

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  ExternalLink, 
  Download, 
  FileText, 
  Calendar, 
  User, 
  Building, 
  IndianRupee, 
  Hash, 
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Pencil
} from "lucide-react"
import { Document } from "@/lib/types"
import { cn, parseFileUrls } from "@/lib/utils"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DocumentPreviewModalProps {
  document: Document | null
  isOpen: boolean
  onClose: () => void
  onApprove?: (id: string) => Promise<any>
  onReject?: (id: string, remarks: string) => Promise<any>
  isActionPending?: boolean
  onEdit?: (doc: Document) => void
}

export function DocumentPreviewModal({ 
  document, 
  isOpen, 
  onClose,
  onApprove,
  onReject,
  onEdit,
  isActionPending = false
}: DocumentPreviewModalProps) {
  const [currentFileIndex, setCurrentFileIndex] = useState(0)

  useEffect(() => {
    if (isOpen) setCurrentFileIndex(0)
  }, [isOpen, document?.id])

  if (!document) return null

  const fileUrls = parseFileUrls(document.file_url)
  const currentUrl = fileUrls[currentFileIndex] || document.file_url
  const isImage = currentUrl?.match(/\.(jpg|jpeg|png|webp)$/i)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className=" w-[90vw] max-w-none  h-screen flex flex-col p-0 gap-0 border-none shadow-lg overflow-hidden sm:rounded-lg bg-background">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center justify-between mb-2">
            <Badge variant={
              document.status === 'APPROVED' ? 'default' : 
              document.status === 'REJECTED' ? 'destructive' : 'secondary'
            } className="px-3 py-0.5">
              {document.status}
            </Badge>
             <div className="flex items-center gap-2 mr-6">
               <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                  <a href={currentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
               </Button>
               <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                  <a href={currentUrl} download>
                    <Download className="h-4 w-4" />
                  </a>
               </Button>
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground pr-12">
            {document.vendors?.name || 'Unknown Vendor'}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Submitted {new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(document.created_at))}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-auto h-full w-full overflow-hidden grid lg:grid-cols-[1fr_300px]">
          {/* Document Preview Section */}
          <div className="bg-muted/30 flex flex-col items-center justify-center relative group border-r h-full min-h-[400px] lg:min-h-0 overflow-hidden">
            {isImage ? (
              <img 
                src={currentUrl} 
                alt="Bill preview" 
                className="max-h-[95%] max-w-[95%] object-contain shadow-md"
              />
            ) : (
              <iframe 
                src={`${currentUrl}#toolbar=0&view=FitH`} 
                title="Bill preview" 
                className="w-full h-full border-none"
              />
            )}

            {fileUrls.length > 1 && (
              <>
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-10 w-10 shadow-lg rounded-full bg-background/80 backdrop-blur-sm pointer-events-auto"
                    onClick={() => setCurrentFileIndex(prev => (prev > 0 ? prev - 1 : fileUrls.length - 1))}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="icon" 
                    className="h-10 w-10 shadow-lg rounded-full bg-background/80 backdrop-blur-sm pointer-events-auto"
                    onClick={() => setCurrentFileIndex(prev => (prev < fileUrls.length - 1 ? prev + 1 : 0))}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-background/80 backdrop-blur-sm rounded-full border shadow-sm text-[10px] font-bold">
                  File {currentFileIndex + 1} of {fileUrls.length}
                </div>
              </>
            )}
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Details Section */}
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" /> Bill Amount
                </p>
                <p className="text-3xl font-bold text-foreground tabular-nums">
                  ₹{Number(document.amount).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  { icon: Building, label: 'Site / Project', value: document.sites?.name },
                  { icon: Hash, label: 'Invoice No.', value: document.invoice_number },
                  { icon: User, label: 'Uploaded By', value: document.profiles?.full_name },
                  { icon: MapPin, label: 'Location / State', value: document.state }
                ].map((item, id) => (
                  <div key={id} className="space-y-1">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider flex items-center gap-2">
                      <item.icon className="h-3.5 w-3.5" /> {item.label}
                    </p>
                    <p className="text-sm font-medium">{item.value || 'N/A'}</p>
                  </div>
                ))}
              </div>

              {document.status === 'REJECTED' && document.remarks && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs font-bold">Rejection Remarks</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{document.remarks}</p>
                </div>
              )}
            </div>

            {/* Actions for PENDING status */}
            {document.status === 'PENDING' && (onApprove || onReject) && (
               <div className="pt-4 grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="border-destructive/50 text-destructive hover:bg-destructive/10"
                    onClick={() => onReject?.(document.id, '')}
                    disabled={isActionPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => onApprove?.(document.id)}
                    disabled={isActionPending}
                  >
                    {isActionPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    Approve
                  </Button>
               </div>
            )}

            {/* Edit Option for pending/rejected */}
            {(document.status === 'PENDING' || document.status === 'REJECTED') && onEdit && (
               <div className="pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                    onClick={() => {
                      onClose()
                      onEdit(document)
                    }}
                  >
                    <Pencil className="h-4 w-4" /> Edit Document Details
                  </Button>
               </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
