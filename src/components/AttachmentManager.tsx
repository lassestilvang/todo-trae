'use client';

import { useRef, useState } from 'react';
import { useTaskStore } from '@/stores/taskStore';
import { Attachment } from '@/types';
import { Upload, File, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Attachments</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-6 px-2"
        >
          <Upload className="w-3 h-3 mr-1" />
          {isUploading ? 'Uploading...' : 'Add'}
        </Button>
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
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group hover:bg-muted/70"
            >
              <span className="text-lg">{getFileIcon(attachment.mimeType)}</span>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.filename}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.fileSize)}
                </p>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  className="h-6 w-6 p-0"
                >
                  <Download className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteAttachment(attachment.id)}
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <File className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No attachments yet</p>
          <p className="text-xs">Click &quot;Add&quot; to upload files</p>
        </div>
      )}
    </div>
  );
}