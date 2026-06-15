import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

export default function PDageUpload() {
  const navigate = useNavigate();
  const { session } = useApp();
  const [file, setFile] = useState<File | null>(null);
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'zip') {
      toast.error('יש להעלות קובץ PDF או ZIP בלבד');
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleSubmit = async () => {
    if (!file || !fullName.trim() || !idNumber.trim() || !session) {
      toast.error('יש למלא את כל השדות ולהעלות קובץ');
      return;
    }

    setUploading(true);
    try {
      const userId = session.user.id;
      const ext = file.name.split('.').pop()?.toLowerCase();
      const filePath = `${userId}/${Date.now()}_${file.name}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('correction-files')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Create or find customer
      const { data: existingCustomer } = await supabase
        .from('pdage_customers')
        .select('id')
        .eq('id_number', idNumber.trim())
        .eq('user_id', userId)
        .maybeSingle();

      let customerId: string;
      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase.from('pdage_customers').update({ full_name: fullName.trim() }).eq('id', customerId);
      } else {
        const { data: newCustomer, error: custError } = await supabase
          .from('pdage_customers')
          .insert({ user_id: userId, full_name: fullName.trim(), id_number: idNumber.trim() })
          .select('id')
          .single();
        if (custError) throw custError;
        customerId = newCustomer.id;
      }

      // Create correction job
      const { data: job, error: jobError } = await supabase
        .from('correction_jobs')
        .insert({
          user_id: userId,
          customer_id: customerId,
          source_file_path: filePath,
          original_file_name: file.name,
          file_type: ext || 'pdf',
          status: 'pending',
        })
        .select('id')
        .single();
      if (jobError) throw jobError;

      // Log activity
      await supabase.from('correction_activity_log').insert({
        job_id: job.id,
        action_type: 'upload',
        title: 'קובץ הועלה',
        details: `הקובץ ${file.name} הועלה בהצלחה`,
      });

      toast.success('הקובץ הועלה בהצלחה');
      navigate(`/app/pdage/job/${job.id}/deficiency`);
    } catch (err) {
      console.error(err);
      toast.error('שגיאה בהעלאת הקובץ: ' + (err.message || ''));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">העלאת מסמך</h1>
        <p className="text-sm text-muted-foreground">העלה PDF או ZIP ומלא את פרטי הלקוח</p>
      </div>

      {/* File upload */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">קובץ מקור</CardTitle>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-xl p-6 sm:p-10 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">גרור קובץ לכאן או לחץ לבחירה</p>
              <p className="text-xs text-muted-foreground/60 mt-1">PDF או ZIP בלבד</p>
              <input
                id="file-input"
                type="file"
                accept=".pdf,.zip"
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
              <FileText className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB · {file.name.endsWith('.zip') ? 'ZIP' : 'PDF'}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer details */}
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">פרטי לקוח</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fullName">שם מלא *</Label>
            <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="ישראל ישראלי" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="idNumber">תעודת זהות *</Label>
            <Input id="idNumber" value={idNumber} onChange={e => setIdNumber(e.target.value)} placeholder="000000000" className="mt-1" dir="ltr" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={uploading || !file || !fullName.trim() || !idNumber.trim()} size="lg" className="gap-2">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'מעלה...' : 'המשך לבחירת חוסר'}
        </Button>
      </div>
    </div>
  );
}
