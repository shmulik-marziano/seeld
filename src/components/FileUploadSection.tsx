import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { SourceFileType } from '@/types';
import JSZip from 'jszip';

interface FileUploadSectionProps {
  customerId: string;
}

type UploadState = 'idle' | 'uploading' | 'parsing' | 'done' | 'error';

interface FileUpload {
  file: File;
  type: SourceFileType;
  state: UploadState;
  productsFound?: number;
  error?: string;
}

export function FileUploadSection({ customerId }: FileUploadSectionProps) {
  const { addSourceFile, refreshData } = useApp();
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectFileType = (file: File): SourceFileType => {
    const name = file.name.toLowerCase();
    if (name.includes('hb') || name.includes('הר') || name.includes('ביטוח') || name.endsWith('.xlsx') || name.endsWith('.xls')) return 'הר ביטוח';
    return 'מסלקה';
  };

  const isBinaryFile = (file: File): boolean => {
    const name = file.name.toLowerCase();
    return name.endsWith('.xlsx') || name.endsWith('.xls');
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get pure base64
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = async (file: File): Promise<string> => {
    return await file.text();
  };

  const extractFilesFromZip = async (zipFile: File): Promise<File[]> => {
    const zip = await JSZip.loadAsync(zipFile);
    const extracted: File[] = [];
    const validExts = ['.csv', '.xlsx', '.xls', '.xml', '.txt', '.json'];

    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const ext = path.substring(path.lastIndexOf('.')).toLowerCase();
      if (!validExts.includes(ext)) continue;
      const blob = await entry.async('blob');
      const fileName = path.split('/').pop() || path;
      extracted.push(new File([blob], fileName, { type: blob.type }));
    }
    return extracted;
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Extract ZIPs
    const expandedFiles: File[] = [];
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.zip')) {
        toast.info(`פורס קובץ ZIP: ${file.name}...`);
        try {
          const inner = await extractFilesFromZip(file);
          if (inner.length === 0) {
            toast.warning(`לא נמצאו קבצים מתאימים ב-${file.name}`);
          } else {
            toast.success(`נמצאו ${inner.length} קבצים ב-${file.name}`);
            expandedFiles.push(...inner);
          }
        } catch {
          toast.error(`שגיאה בפריסת ${file.name}`);
        }
      } else {
        expandedFiles.push(file);
      }
    }

    if (expandedFiles.length === 0) return;

    const newUploads: FileUpload[] = expandedFiles.map(file => ({
      file,
      type: detectFileType(file),
      state: 'idle' as UploadState,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Process each file
    for (let i = 0; i < newUploads.length; i++) {
      const upload = newUploads[i];
      const idx = uploads.length + i;

      // Update state to uploading
      setUploads(prev => prev.map((u, j) => j === idx ? { ...u, state: 'uploading' } : u));

      try {
        // Record source file
        await addSourceFile({
          customerId,
          type: upload.type,
          fileName: upload.file.name,
          analysisStatus: 'בניתוח',
        });

        // Upload to storage
        const filePath = `${customerId}/${Date.now()}_${upload.file.name}`;
        await supabase.storage.from('source-files').upload(filePath, upload.file);

        // Update state to parsing
        setUploads(prev => prev.map((u, j) => j === idx ? { ...u, state: 'parsing' } : u));

        // Read file content - binary files as base64, text files as text
        let bodyPayload: Record<string, any> = {
          fileName: upload.file.name,
          fileType: upload.type,
          customerId,
        };

        if (isBinaryFile(upload.file)) {
          try {
            bodyPayload.fileBase64 = await readFileAsBase64(upload.file);
          } catch {
            throw new Error('Failed to read binary file');
          }
        } else {
          try {
            const text = await readFileAsText(upload.file);
            bodyPayload.fileContent = text.substring(0, 80000);
          } catch {
            throw new Error('Failed to read text file');
          }
        }

        // Call edge function to parse
        const response = await supabase.functions.invoke('parse-insurance-file', {
          body: bodyPayload,
        });

        if (response.error) throw new Error(response.error.message || 'Parse failed');

        const result = response.data;
        if (result.error) throw new Error(result.error);

        setUploads(prev => prev.map((u, j) => j === idx ? { ...u, state: 'done', productsFound: result.count } : u));
        toast.success(`${upload.file.name}: נמצאו ${result.count} מוצרים`);

        // Refresh data to show new products
        await refreshData();
      } catch (err: any) {
        console.error('Upload error:', err);
        setUploads(prev => prev.map((u, j) => j === idx ? { ...u, state: 'error', error: err.message } : u));
        toast.error(`שגיאה בעיבוד ${upload.file.name}`);
      }
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Upload className="h-4 w-4" />
          ייבוא קבצי מסלקה / הר ביטוח
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50 hover:bg-muted/30'
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (e.dataTransfer.files.length > 0) {
              const input = fileInputRef.current;
              if (input) {
                const dt = new DataTransfer();
                Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
                input.files = dt.files;
                input.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          }}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm font-medium">{dragging ? 'שחרר כאן' : 'לחץ או גרור קבצים להעלאה'}</p>
          <p className="text-xs text-muted-foreground mt-1">CSV, XLSX, XML, TXT, ZIP</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".csv,.xlsx,.xls,.xml,.txt,.zip"
            className="hidden"
            onChange={handleFilesSelected}
          />
        </div>

        {uploads.length > 0 && (
          <div className="space-y-2">
            {uploads.map((upload, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                {upload.state === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {upload.state === 'parsing' && <Loader2 className="h-4 w-4 animate-spin text-accent" />}
                {upload.state === 'done' && <CheckCircle2 className="h-4 w-4 text-success" />}
                {upload.state === 'error' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                {upload.state === 'idle' && <FileText className="h-4 w-4 text-muted-foreground" />}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{upload.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {upload.type}
                    {upload.state === 'uploading' && ' · מעלה...'}
                    {upload.state === 'parsing' && ' · מנתח עם AI...'}
                    {upload.state === 'done' && ` · נמצאו ${upload.productsFound} מוצרים`}
                    {upload.state === 'error' && ` · ${upload.error}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
