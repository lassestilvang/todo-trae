'use client';

import { useRef, useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { Attachment } from '@/types';
import { Upload, File, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface AttachmentManagerProps {
  taskId: string;
  attachments: Attachment[];
}

export function AttachmentManager({ taskId, attachments }: AttachmentManagerProps) {
  const { addAttachment, deleteAttachment } = useTaskStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of Array.from(files)) {
        // In a real app, you would upload to a file storage service
        // For now, we'll create a mock file path and store the file info
        const filePath = `/uploads/${taskId}/${file.name}`;
        
        const attachment: Attachment = {
          id: crypto.randomUUID(),
          taskId,
          filename: file.name,
          filePath,
          fileSize: file.size,
          mimeType: file.type,
          createdAt: new Date(),
        };

        addAttachment(attachment);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
    return '📎';
  };

  const handleDownload = (attachment: Attachment) => {
    // In a real app, this would download from your file storage service
    console.log('Download requested for:', attachment.filename);
    // For demo purposes, we'll create a blob URL
    const link = document.createElement('a');
    link.href = '#';
    link.download = attachment.filename;
    link.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <File className="w-3.5 h-3.5" />
          Attachments
        </h4>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-8 px-3 bg-primary/10 text-primary hover:bg-primary/20 transition-all rounded-xl border border-primary/20"
            aria-label="Upload attachment"
          >
            <Upload className="w-3.5 h-3.5 mr-2" />
            <span className="text-xs font-bold uppercase tracking-tight">{isUploading ? 'Uploading...' : 'Add File'}</span>
          </Button>
        </motion.div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="*/*"
      />

      {attachments.length > 0 && (
        <ul className="grid grid-cols-1 gap-2" role="list" aria-label="Attachments">
          <AnimatePresence mode="popLayout">
            {attachments.map((attachment) => (
              <motion.li
                key={attachment.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ y: -2 }}
                className="flex items-center gap-3 p-3 rounded-2xl glass-card group hover:bg-white/10 hover:border-primary/30 transition-all border border-border/30 shadow-sm focus-within:ring-2 focus-within:ring-primary/50"
                aria-label={`Attachment: ${attachment.filename}`}
              >
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors shadow-inner" aria-hidden="true">
                  <span className="text-xl leading-none" role="img">{getFileIcon(attachment.mimeType)}</span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate text-foreground/90 group-hover:text-primary transition-colors">{attachment.filename}</p>
                  <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-tight mt-0.5">
                    {formatFileSize(attachment.fileSize)}
                  </p>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(attachment)}
                      className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-xl"
                      aria-label={`Download ${attachment.filename}`}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAttachment(attachment.id)}
                      className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                      aria-label={`Delete ${attachment.filename}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {attachments.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-10 rounded-2xl border-2 border-dashed border-border/20 bg-muted/5 flex flex-col items-center justify-center group hover:border-primary/20 transition-colors"
        >
          <div className="p-4 rounded-2xl bg-muted/10 w-fit mb-3 group-hover:bg-primary/5 group-hover:text-primary transition-all">
            <File className="w-8 h-8 text-muted-foreground/40 group-hover:text-primary/40" />
          </div>
          <p className="text-sm font-bold text-muted-foreground/80">No attachments yet</p>
          <p className="text-xs text-muted-foreground/50 mt-1 uppercase tracking-widest font-medium">Click &quot;Add&quot; to upload files</p>
        </motion.div>
      )}
    </div>
  );
}