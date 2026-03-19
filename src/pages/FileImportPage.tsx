import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Upload, FileSpreadsheet, FolderArchive, Users, User, Loader2,
  CheckCircle2, AlertTriangle, XCircle, Eye, ExternalLink, UserPlus,
  Link2, History, FileText, BarChart3, Search, Download, Brain, Sparkles, Pencil, Save
} from 'lucide-react';
import {
  detectFileType, getFileTypeLabel, readFileAsBase64, extractFilesFromZip,
  parseExcelFile, parsePdfFile, findCustomerByIdNumber, upsertCustomer, upsertProducts,
  createSourceFile, logImportActivity, uploadFileToStorage,
  createImportBatch, updateImportBatch, createImportBatchItem, updateImportBatchItem,
  loadImportHistory,
  type ImportFileType, type ImportMode, type ImportBatch, type ImportItem, type ImportSummary,
  type ParsedCustomer, type ParsedProduct,
} from '@/services/import-service';
import * as XLSX from 'xlsx';

type ProcessingState = 'idle' | 'parsing' | 'parsing_ai' | 'matching' | 'processing' | 'done' | 'error' | 'preview';

interface PreviewEntry {
  customer: ParsedCustomer;
  products: ParsedProduct[];
  sourceFile?: string;
  excluded?: boolean;
}

interface FileUploadEntry {
  file: File;
  detectedType: ImportFileType;
  state: ProcessingState;
  error?: string;
  parsedData?: {
    customers: Array<{ customer: ParsedCustomer; products: ParsedProduct[] }>;
  };
  items: ImportItem[];
  batchId?: string;
  previewEntries?: PreviewEntry[];
  filesToProcess?: { file: File; type: ImportFileType }[];
}

export default function FileImportPage() {
  const navigate = useNavigate();
  const { session, data, refreshData } = useApp();
  const agentId = session?.user?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<FileUploadEntry[]>([]);
  const [importMode, setImportMode] = useState<ImportMode>('create_and_update');
  const [history, setHistory] = useState<ImportBatch[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [manualAssignItem, setManualAssignItem] = useState<ImportItem | null>(null);
  const [manualAssignSearch, setManualAssignSearch] = useState('');
  const [manualAssigning, setManualAssigning] = useState(false);
  const [detailItem, setDetailItem] = useState<ImportItem | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [previewDetailIdx, setPreviewDetailIdx] = useState<number | null>(null);
  const [editingPreviewIdx, setEditingPreviewIdx] = useState<number | null>(null);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const h = await loadImportHistory();
      setHistory(h);
    } catch (e) {
      console.error('Failed to load history:', e);
    }
    setHistoryLoading(false);
  };

  const getSummary = useCallback((): ImportSummary => {
    let customersCreated = 0, customersUpdated = 0, filesAttached = 0, filesFailed = 0, needsManualReview = 0, productsCreated = 0, productsUpdated = 0;
    for (const u of uploads) {
      for (const item of u.items) {
        if (item.action === 'create' && item.status === 'success') customersCreated++;
        if (item.action === 'update' && item.status === 'success') customersUpdated++;
        if (item.status === 'success') filesAttached++;
        if (item.status === 'error') filesFailed++;
        if (item.status === 'needs_review') needsManualReview++;
        productsCreated += item.productsCreated;
        productsUpdated += item.productsUpdated;
      }
    }
    return { customersCreated, customersUpdated, filesAttached, filesFailed, needsManualReview, productsCreated, productsUpdated };
  }, [uploads]);

  const exportResultsToExcel = useCallback(() => {
    const items = uploads.flatMap(u => u.items);
    if (items.length === 0) {
      toast.error('אין תוצאות לייצוא');
      return;
    }

    const sum = getSummary();

    const summaryData = [
      ['סיכום ייבוא', '', new Date().toLocaleString('he-IL')],
      [],
      ['מדד', 'כמות'],
      ['לקוחות נוצרו', sum.customersCreated],
      ['לקוחות עודכנו', sum.customersUpdated],
      ['מוצרים חדשים', sum.productsCreated],
      ['מוצרים עודכנו', sum.productsUpdated],
      ['שגיאות', sum.filesFailed],
      ['דורשים בדיקה', sum.needsManualReview],
      ['סה"כ שורות', items.length],
    ];

    const detailHeaders = ['#', 'קובץ מקור', 'ת.ז.', 'שם לקוח', 'פעולה', 'סטטוס', 'מוצרים חדשים', 'מוצרים עודכנו', 'שגיאה'];
    const actionLabels: Record<string, string> = {
      create: 'נוצר', update: 'עודכן', skip: 'דולג', error: 'שגיאה',
      needs_review: 'דורש בדיקה', manual_assign: 'שיוך ידני', pending: 'ממתין',
    };
    const statusLabels: Record<string, string> = {
      success: 'הצליח', error: 'נכשל', needs_review: 'דורש בדיקה',
      pending: 'ממתין', duplicate: 'כפול', skipped: 'דולג',
    };

    const detailRows = items.map((item, i) => [
      item.rowNumber || i + 1,
      item.sourceFileName || '',
      item.customerIdNumber || '',
      item.customerName || '',
      actionLabels[item.action] || item.action,
      statusLabels[item.status] || item.status,
      item.productsCreated,
      item.productsUpdated,
      item.errorMessage || '',
    ]);

    const productHeaders = ['#', 'ת.ז. לקוח', 'שם לקוח', 'קטגוריה', 'חברה', 'סוג מוצר', 'מספר פוליסה', 'פרמיה חודשית', 'הפקדה חודשית', 'צבירה', 'מסלול'];
    const productRows: any[][] = [];
    let prodIdx = 0;
    for (const item of items) {
      if (item.parsedProducts && item.parsedProducts.length > 0) {
        for (const p of item.parsedProducts) {
          prodIdx++;
          productRows.push([
            prodIdx,
            item.customerIdNumber || '',
            item.customerName || '',
            p.category,
            p.company || '',
            p.productType || '',
            p.policyNumber || '',
            p.monthlyPremium ?? '',
            p.monthlyDeposit ?? '',
            p.accumulation ?? '',
            p.track || '',
          ]);
        }
      }
    }

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'סיכום');

    const wsDetails = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);
    wsDetails['!cols'] = [
      { wch: 5 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 35 },
    ];
    XLSX.utils.book_append_sheet(wb, wsDetails, 'פירוט');

    if (productRows.length > 0) {
      const wsProducts = XLSX.utils.aoa_to_sheet([productHeaders, ...productRows]);
      wsProducts['!cols'] = [
        { wch: 5 }, { wch: 12 }, { wch: 20 }, { wch: 8 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, wsProducts, 'מוצרים');
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `תוצאות_ייבוא_${timestamp}.xlsx`);
    toast.success('קובץ Excel יוצא בהצלחה');
  }, [uploads, getSummary]);

  const processFile = async (entry: FileUploadEntry, index: number) => {
    if (!agentId) return;

    const updateEntry = (updates: Partial<FileUploadEntry>) => {
      setUploads(prev => prev.map((u, i) => i === index ? { ...u, ...updates } : u));
    };

    try {
      // Step 1: Parse
      updateEntry({ state: 'parsing' });

      let filesToProcess: { file: File; type: ImportFileType }[] = [];

      if (entry.file.name.toLowerCase().endsWith('.zip')) {
        const inner = await extractFilesFromZip(entry.file);
        if (inner.length === 0) {
          updateEntry({ state: 'error', error: 'לא נמצאו קבצים מתאימים ב-ZIP' });
          return;
        }
        filesToProcess = inner.map(f => ({ file: f, type: detectFileType(f.name) }));
      } else {
        filesToProcess = [{ file: entry.file, type: entry.detectedType }];
      }

      // Step 2: Parse each file and collect preview data
      const allPreview: PreviewEntry[] = [];
      const errorItems: ImportItem[] = [];

      for (const { file, type } of filesToProcess) {
        if (file.name.toLowerCase().endsWith('.pdf')) {
          updateEntry({ state: 'parsing_ai' });
          try {
            const parsed = await parsePdfFile(file, file.name);
            for (const c of parsed.customers) {
              allPreview.push({ ...c, sourceFile: file.name });
            }
          } catch (err: any) {
            errorItems.push({
              id: crypto.randomUUID(),
              action: 'error',
              status: 'error',
              errorMessage: err.message || 'שגיאה בפיענוח PDF',
              productsCreated: 0,
              productsUpdated: 0,
              sourceFileName: file.name,
            });
          }
          continue;
        }

        if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls') && !file.name.toLowerCase().endsWith('.xml')) {
          errorItems.push({
            id: crypto.randomUUID(),
            customerName: undefined,
            action: 'needs_review',
            status: 'needs_review',
            errorMessage: 'סוג קובץ לא נתמך לפיענוח אוטומטי',
            productsCreated: 0,
            productsUpdated: 0,
            sourceFileName: file.name,
          });
          continue;
        }

        try {
          const parsed = await parseExcelFile(file, file.name);
          for (const c of parsed.customers) {
            allPreview.push({ ...c, sourceFile: file.name });
          }
        } catch (err: any) {
          errorItems.push({
            id: crypto.randomUUID(),
            action: 'error',
            status: 'error',
            errorMessage: err.message || 'שגיאה בפיענוח הקובץ',
            productsCreated: 0,
            productsUpdated: 0,
            sourceFileName: file.name,
          });
        }
      }

      // Show preview if we have data, otherwise show errors only
      if (allPreview.length > 0) {
        updateEntry({ state: 'preview', previewEntries: allPreview, items: errorItems, filesToProcess });
        setPreviewIndex(index);
      } else {
        // Only errors, no data to preview
        updateEntry({ state: 'error', items: errorItems, error: 'לא נמצאו נתונים לייבוא' });
      }
    } catch (err: any) {
      console.error('Parse error:', err);
      updateEntry({ state: 'error', error: err.message || 'שגיאה כללית בפיענוח' });
      toast.error(`שגיאה בפיענוח ${entry.file.name}`);
    }
  };

  const confirmImport = async (index: number) => {
    if (!agentId) return;
    const entry = uploads[index];
    if (!entry?.previewEntries) return;

    const updateEntry = (updates: Partial<FileUploadEntry>) => {
      setUploads(prev => prev.map((u, i) => i === index ? { ...u, ...updates } : u));
    };

    setPreviewIndex(null);

    try {
      updateEntry({ state: 'matching' });
      const allCustomers = entry.previewEntries.filter(pe => !pe.excluded);
      if (allCustomers.length === 0) {
        updateEntry({ state: 'error', error: 'כל השורות בוטלו - אין מה לייבא', previewEntries: undefined });
        toast.error('כל השורות בוטלו');
        return;
      }
      const filesToProcess = entry.filesToProcess || [];
      const allItems: ImportItem[] = [...(entry.items || [])];

      const batchId = await createImportBatch(agentId, entry.file.name, entry.detectedType, importMode);
      updateEntry({ batchId, state: 'processing' });

      let rowNum = 0;
      for (const { customer: parsed, products, sourceFile } of allCustomers) {
        rowNum++;
        const itemId = crypto.randomUUID();
        const customerName = parsed.fullName || [parsed.firstName, parsed.lastName].filter(Boolean).join(' ') || undefined;

        if (!parsed.idNumber) {
          const item: ImportItem = {
            id: itemId, rowNumber: rowNum, customerIdNumber: undefined,
            customerName, action: 'needs_review', status: 'needs_review',
            errorMessage: 'חסרה תעודת זהות',
            productsCreated: 0, productsUpdated: 0,
            sourceFileName: sourceFile,
            parsedCustomer: parsed, parsedProducts: products,
          };
          allItems.push(item);
          await createImportBatchItem(batchId, item);
          continue;
        }

        try {
          const existing = await findCustomerByIdNumber(parsed.idNumber);
          const { id: customerId, action } = await upsertCustomer(parsed, existing?.id || null, importMode, agentId);

          const prodResult = await upsertProducts(customerId, products, agentId);

          if (sourceFile) {
            await createSourceFile(customerId, sourceFile, entry.detectedType, agentId);
          }

          for (const { file: f } of filesToProcess) {
            try {
              await uploadFileToStorage(f, customerId);
            } catch { /* storage upload is best-effort */ }
          }

          await logImportActivity(
            action === 'create' ? 'לקוח חדש מיובא' : 'לקוח עודכן מייבוא',
            `${customerName || parsed.idNumber} - ${prodResult.created} מוצרים חדשים, ${prodResult.updated} עודכנו`,
            action === 'create' ? 'הצלחה' : 'מידע',
            agentId, customerId
          );

          const item: ImportItem = {
            id: itemId, rowNumber: rowNum,
            customerIdNumber: parsed.idNumber,
            customerName: customerName || existing?.fullName,
            action, status: 'success', customerId,
            productsCreated: prodResult.created,
            productsUpdated: prodResult.updated,
            sourceFileName: sourceFile,
            parsedCustomer: parsed, parsedProducts: products,
          };
          allItems.push(item);
          await createImportBatchItem(batchId, item);
        } catch (err: any) {
          const item: ImportItem = {
            id: itemId, rowNumber: rowNum,
            customerIdNumber: parsed.idNumber, customerName,
            action: 'error', status: 'error',
            errorMessage: err.message || 'שגיאה בעיבוד',
            productsCreated: 0, productsUpdated: 0,
            sourceFileName: sourceFile,
            parsedCustomer: parsed, parsedProducts: products,
          };
          allItems.push(item);
          await createImportBatchItem(batchId, item);
        }
      }

      const succeeded = allItems.filter(i => i.status === 'success').length;
      const failed = allItems.filter(i => i.status === 'error').length;
      const needsReview = allItems.filter(i => i.status === 'needs_review').length;
      await updateImportBatch(batchId, {
        status: 'completed',
        total_items: allItems.length,
        succeeded, failed, needs_review: needsReview,
      });

      await logImportActivity(
        'ייבוא קובץ הושלם',
        `${entry.file.name}: ${succeeded} הצליחו, ${failed} נכשלו, ${needsReview} דורשים בדיקה`,
        failed > 0 ? 'אזהרה' : 'הצלחה',
        agentId
      );

      updateEntry({ state: 'done', items: allItems, previewEntries: undefined });
      await refreshData();
      await loadHistory();

      toast.success(`ייבוא ${entry.file.name} הושלם: ${succeeded} הצליחו`);
    } catch (err: any) {
      console.error('Import error:', err);
      updateEntry({ state: 'error', error: err.message || 'שגיאה כללית בייבוא' });
      toast.error(`שגיאה בייבוא ${entry.file.name}`);
    }
  };

  const cancelPreview = (index: number) => {
    setPreviewIndex(null);
    setUploads(prev => prev.filter((_, i) => i !== index));
  };

  const togglePreviewEntry = (uploadIdx: number, entryIdx: number) => {
    setUploads(prev => prev.map((u, i) => {
      if (i !== uploadIdx || !u.previewEntries) return u;
      return {
        ...u,
        previewEntries: u.previewEntries.map((pe, j) =>
          j === entryIdx ? { ...pe, excluded: !pe.excluded } : pe
        ),
      };
    }));
  };

  const toggleAllPreviewEntries = (uploadIdx: number, exclude: boolean) => {
    setUploads(prev => prev.map((u, i) => {
      if (i !== uploadIdx || !u.previewEntries) return u;
      return {
        ...u,
        previewEntries: u.previewEntries.map(pe => ({ ...pe, excluded: exclude })),
      };
    }));
  };

  const updatePreviewCustomer = (uploadIdx: number, entryIdx: number, field: keyof ParsedCustomer, value: any) => {
    setUploads(prev => prev.map((u, i) => {
      if (i !== uploadIdx || !u.previewEntries) return u;
      return {
        ...u,
        previewEntries: u.previewEntries.map((pe, j) =>
          j === entryIdx ? { ...pe, customer: { ...pe.customer, [field]: value } } : pe
        ),
      };
    }));
  };

  const updatePreviewProduct = (uploadIdx: number, entryIdx: number, prodIdx: number, field: keyof ParsedProduct, value: any) => {
    setUploads(prev => prev.map((u, i) => {
      if (i !== uploadIdx || !u.previewEntries) return u;
      return {
        ...u,
        previewEntries: u.previewEntries.map((pe, j) => {
          if (j !== entryIdx) return pe;
          return {
            ...pe,
            products: pe.products.map((p, k) =>
              k === prodIdx ? { ...p, [field]: value } : p
            ),
          };
        }),
      };
    }));
  };

  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newEntries: FileUploadEntry[] = fileArray.map(file => ({
      file,
      detectedType: detectFileType(file.name),
      state: 'idle' as ProcessingState,
      items: [],
    }));

    const startIdx = uploads.length;
    setUploads(prev => [...prev, ...newEntries]);

    for (let i = 0; i < newEntries.length; i++) {
      await processFile(newEntries[i], startIdx + i);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateCustomerFromItem = (item: ImportItem) => {
    if (!item.parsedCustomer) return;
    const p = item.parsedCustomer;
    const params = new URLSearchParams();
    if (p.firstName) params.set('firstName', p.firstName);
    if (p.lastName) params.set('lastName', p.lastName);
    if (p.idNumber) params.set('idNumber', p.idNumber);
    if (p.mobilePhone) params.set('mobilePhone', p.mobilePhone);
    if (p.email) params.set('email', p.email);
    navigate(`/customers/new?${params.toString()}`);
  };

  const handleManualAssign = async (customerId: string, customerName: string) => {
    if (!agentId || !manualAssignItem) return;
    setManualAssigning(true);
    try {
      const item = manualAssignItem;
      // Create source file
      if (item.sourceFileName) {
        await createSourceFile(customerId, item.sourceFileName, 'unknown', agentId);
      }
      // Upsert products if any
      let prodResult = { created: 0, updated: 0 };
      if (item.parsedProducts && item.parsedProducts.length > 0) {
        prodResult = await upsertProducts(customerId, item.parsedProducts, agentId);
      }
      // Update the item in state
      setUploads(prev => prev.map(u => ({
        ...u,
        items: u.items.map(i => i.id === item.id ? {
          ...i,
          action: 'update' as const,
          status: 'success' as const,
          customerId,
          customerName,
          productsCreated: prodResult.created,
          productsUpdated: prodResult.updated,
          errorMessage: undefined,
        } : i),
      })));
      await logImportActivity('קובץ שויך ידנית ללקוח', `${customerName} - ${item.sourceFileName}`, 'הצלחה', agentId, customerId);
      await refreshData();
      toast.success(`קובץ שויך בהצלחה ל-${customerName}`);
      setManualAssignItem(null);
    } catch (err: any) {
      toast.error(err.message || 'שגיאה בשיוך');
    }
    setManualAssigning(false);
  };

  // Filter customers for manual assign dialog
  const filteredCustomers = manualAssignSearch.trim()
    ? data.customers.filter(c => 
        c.fullName?.includes(manualAssignSearch) ||
        c.firstName?.includes(manualAssignSearch) ||
        c.lastName?.includes(manualAssignSearch) ||
        c.idNumber?.includes(manualAssignSearch) ||
        c.mobilePhone?.includes(manualAssignSearch)
      )
    : data.customers.slice(0, 20);

  const allItems = uploads.flatMap(u => u.items);
  const filteredItems = statusFilter === 'all' ? allItems : allItems.filter(i => i.status === statusFilter);
  const summary = getSummary();
  const isProcessing = uploads.some(u => ['parsing', 'parsing_ai', 'matching', 'processing'].includes(u.state));

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="העלאת קבצים" subtitle="ייבוא קבצי לקוחות, הר ביטוח, דוחות ומסלקה" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 rounded-full bg-[#0a3d3d]/5 p-1">
          <TabsTrigger value="upload" className="gap-2 rounded-full data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white"><Upload className="h-4 w-4" />העלאה וייבוא</TabsTrigger>
          <TabsTrigger value="history" className="gap-2 rounded-full data-[state=active]:bg-[#0a3d3d] data-[state=active]:text-white"><History className="h-4 w-4" />היסטוריית ייבוא</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          {/* Upload Area */}
          <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-gradient-to-b from-[#0a3d3d]/3 to-transparent">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0a3d3d]/10 flex items-center justify-center">
                      <Upload className="h-3.5 w-3.5 text-[#0a3d3d]" />
                    </div>
                    העלאת קבצים
                  </CardTitle>
                  <CardDescription>גרור קבצים לכאן או לחץ לבחירה</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">מצב עבודה:</label>
                  <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create_and_update">יצירה + עדכון</SelectItem>
                      <SelectItem value="create_only">יצירה בלבד</SelectItem>
                      <SelectItem value="update_only">עדכון בלבד</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  dragging ? 'border-[#5ec6c6] bg-[#5ec6c6]/10 scale-[1.02]' : 'border-border/60 hover:border-[#5ec6c6]/50 hover:bg-[#5ec6c6]/5'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  if (e.dataTransfer.files.length > 0) handleFilesSelected(e.dataTransfer.files);
                }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0a3d3d]/8 flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-7 w-7 text-[#0a3d3d]/60" />
                </div>
                <p className="text-sm font-semibold">{dragging ? 'שחרר כאן' : 'לחץ או גרור קבצים להעלאה'}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  XLSX, XLS, XML, PDF, ZIP • CustomersExport, HbResults, דוח לסוכן, קיט טרום טיפול, מסלקה, פוליסות PDF
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                   accept=".xlsx,.xls,.zip,.csv,.xml,.pdf"
                  className="hidden"
                  onChange={(e) => e.target.files && handleFilesSelected(e.target.files)}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Type Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-[#5ec6c6]/20 hover:border-[#5ec6c6]/40 transition-colors cursor-pointer rounded-2xl" onClick={() => fileInputRef.current?.click()}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#5ec6c6]" />
                  ייבוא מרובה לקוחות
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  CustomersExport_*.xlsx — ייבוא והקמת לקוחות בכמויות גדולות
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#f4a261]/20 hover:border-[#f4a261]/40 transition-colors cursor-pointer rounded-2xl" onClick={() => fileInputRef.current?.click()}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-[#f4a261]" />
                  קובץ ללקוח בודד
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  HbResults, דוח לסוכן — ייבוא פרטי לקוח ומוצרים
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#90be6d]/20 hover:border-[#90be6d]/40 transition-colors cursor-pointer rounded-2xl" onClick={() => fileInputRef.current?.click()}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FolderArchive className="h-4 w-4 text-[#90be6d]" />
                  ZIP / קיט / מסלקה
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  קיט טרום טיפול, קבצי מסלקה — פריסה וייבוא אוטומטי
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Processing Status */}
          {uploads.length > 0 && (
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin text-[#5ec6c6]" /> : <FileSpreadsheet className="h-4 w-4 text-[#0a3d3d]" />}
                  סטטוס עיבוד קבצים
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {uploads.map((u, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    u.state === 'parsing_ai' 
                      ? 'bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/20 animate-fade-in' 
                      : 'bg-muted/30'
                  }`}>
                    {u.state === 'idle' && <FileText className="h-4 w-4 text-muted-foreground" />}
                    {u.state === 'parsing' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                    {u.state === 'parsing_ai' && (
                      <div className="relative">
                        <Brain className="h-5 w-5 text-primary animate-pulse" />
                        <Sparkles className="h-3 w-3 text-primary absolute -top-1 -right-1 animate-bounce" />
                      </div>
                    )}
                    {u.state === 'matching' && <Search className="h-4 w-4 animate-pulse text-primary" />}
                    {u.state === 'processing' && <Loader2 className="h-4 w-4 animate-spin text-accent-foreground" />}
                    {u.state === 'preview' && <Eye className="h-4 w-4 text-primary" />}
                    {u.state === 'done' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    {u.state === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getFileTypeLabel(u.detectedType)}
                        {u.state === 'parsing' && ' · מפענח קובץ...'}
                        {u.state === 'parsing_ai' && (
                          <span className="text-primary font-medium"> · 🤖 AI מנתח פוליסה...</span>
                        )}
                        {u.state === 'matching' && ' · מזהה לקוחות...'}
                        {u.state === 'processing' && ' · יוצר/מעדכן...'}
                        {u.state === 'preview' && (
                          <span className="text-primary font-medium"> · ממתין לאישור ייבוא ({u.previewEntries?.length} לקוחות)</span>
                        )}
                        {u.state === 'done' && ` · ${u.items.filter(i => i.status === 'success').length} הצליחו`}
                        {u.state === 'error' && ` · ${u.error}`}
                      </p>
                      {u.state === 'parsing_ai' && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] w-2/3" />
                          </div>
                          <span className="text-[10px] text-primary/70 whitespace-nowrap">מחלץ נתונים</span>
                        </div>
                      )}
                    </div>
                    {u.state === 'preview' ? (
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setPreviewIndex(i)}>
                          <Eye className="h-3 w-3" />
                          צפה ואשר
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => cancelPreview(i)}>
                          ביטול
                        </Button>
                      </div>
                    ) : (
                      <Badge variant={
                        u.state === 'done' ? 'default' :
                        u.state === 'error' ? 'destructive' :
                        u.state === 'parsing_ai' ? 'outline' :
                        'secondary'
                      }>
                        {u.state === 'parsing_ai' ? 'AI' : getFileTypeLabel(u.detectedType)}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Results Table */}
          {allItems.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    תוצאות ייבוא
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="סינון לפי סטטוס" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">הכל ({allItems.length})</SelectItem>
                        <SelectItem value="success">הצליח ({allItems.filter(i => i.status === 'success').length})</SelectItem>
                        <SelectItem value="error">נכשל ({allItems.filter(i => i.status === 'error').length})</SelectItem>
                        <SelectItem value="needs_review">דורש בדיקה ({allItems.filter(i => i.status === 'needs_review').length})</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={exportResultsToExcel}>
                      <Download className="h-3.5 w-3.5" />
                      ייצוא Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">#</TableHead>
                        <TableHead className="text-right">קובץ מקור</TableHead>
                        <TableHead className="text-right">ת.ז.</TableHead>
                        <TableHead className="text-right">שם לקוח</TableHead>
                        <TableHead className="text-right">פעולה</TableHead>
                        <TableHead className="text-right">מוצרים</TableHead>
                        <TableHead className="text-right">סטטוס</TableHead>
                        <TableHead className="text-right">פעולות</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.map((item, i) => (
                        <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetailItem(item)}>
                          <TableCell className="text-muted-foreground">{item.rowNumber || i + 1}</TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">{item.sourceFileName || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{item.customerIdNumber || '-'}</TableCell>
                          <TableCell>{item.customerName || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {item.action === 'create' ? 'נוצר' :
                               item.action === 'update' ? 'עודכן' :
                               item.action === 'skip' ? 'דולג' :
                               item.action === 'error' ? 'שגיאה' :
                               item.action === 'needs_review' ? 'דורש בדיקה' :
                               item.action === 'manual_assign' ? 'שיוך ידני' : 'ממתין'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {item.productsCreated > 0 && <span className="text-green-600">+{item.productsCreated}</span>}
                            {item.productsUpdated > 0 && <span className="text-blue-600 mr-1">↻{item.productsUpdated}</span>}
                            {item.productsCreated === 0 && item.productsUpdated === 0 && '-'}
                          </TableCell>
                          <TableCell>
                            {item.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                            {item.status === 'error' && (
                              <div className="flex items-center gap-1">
                                <XCircle className="h-4 w-4 text-destructive" />
                                <span className="text-xs text-destructive max-w-[120px] truncate" title={item.errorMessage}>
                                  {item.errorMessage}
                                </span>
                              </div>
                            )}
                            {item.status === 'needs_review' && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-xs text-amber-600 max-w-[120px] truncate" title={item.errorMessage}>
                                  {item.errorMessage || 'דורש בדיקה'}
                                </span>
                              </div>
                            )}
                            {item.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              {item.customerId && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/customers/${item.customerId}`)}>
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {!item.customerId && item.parsedCustomer && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCreateCustomerFromItem(item)} title="צור לקוח חדש">
                                  <UserPlus className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {!item.customerId && (
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setManualAssignItem(item); setManualAssignSearch(''); }} title="שייך ללקוח קיים">
                                  <Link2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {uploads.some(u => u.state === 'done') && (
            <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  סיכום ייבוא
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{summary.customersCreated}</p>
                    <p className="text-xs text-muted-foreground">לקוחות נוצרו</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{summary.customersUpdated}</p>
                    <p className="text-xs text-muted-foreground">לקוחות עודכנו</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-2xl font-bold text-primary">{summary.productsCreated + summary.productsUpdated}</p>
                    <p className="text-xs text-muted-foreground">מוצרים ({summary.productsCreated} חדשים)</p>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg">
                    <p className="text-2xl font-bold text-amber-500">{summary.needsManualReview}</p>
                    <p className="text-xs text-muted-foreground">דורשים בדיקה</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">אין היסטוריית ייבוא</p>
              </CardContent>
            </Card>
          ) : (
            history.map(batch => (
              <Card key={batch.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold">{batch.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {getFileTypeLabel(batch.fileType as ImportFileType)} • {new Date(batch.createdAt).toLocaleString('he-IL')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="default" className="text-xs">{batch.succeeded} הצליחו</Badge>
                      {batch.failed > 0 && <Badge variant="destructive" className="text-xs">{batch.failed} נכשלו</Badge>}
                      {batch.needsReview > 0 && <Badge variant="secondary" className="text-xs">{batch.needsReview} לבדיקה</Badge>}
                    </div>
                  </div>
                </CardHeader>
                {batch.items.length > 0 && (
                  <CardContent>
                    <div className="rounded-md border overflow-x-auto max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right">#</TableHead>
                            <TableHead className="text-right">ת.ז.</TableHead>
                            <TableHead className="text-right">שם</TableHead>
                            <TableHead className="text-right">פעולה</TableHead>
                            <TableHead className="text-right">סטטוס</TableHead>
                            <TableHead className="text-right">פעולות</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {batch.items.slice(0, 20).map((item, i) => (
                            <TableRow key={item.id}>
                              <TableCell className="text-muted-foreground">{item.rowNumber || i + 1}</TableCell>
                              <TableCell className="font-mono text-xs">{item.customerIdNumber || '-'}</TableCell>
                              <TableCell className="text-sm">{item.customerName || '-'}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {item.action === 'create' ? 'נוצר' : item.action === 'update' ? 'עודכן' : item.action}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {item.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                                {item.status === 'error' && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                                {item.status === 'needs_review' && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                              </TableCell>
                              <TableCell>
                                {item.customerId && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate(`/customers/${item.customerId}`)}>
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {batch.items.length > 20 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center text-xs text-muted-foreground">
                                ועוד {batch.items.length - 20} שורות...
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
      {/* Item Detail Dialog */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              פרטי שורת ייבוא
            </DialogTitle>
            <DialogDescription>
              {detailItem?.sourceFileName && <>קובץ: <strong>{detailItem.sourceFileName}</strong></>}
              {detailItem?.rowNumber && <span className="mr-2">• שורה {detailItem.rowNumber}</span>}
            </DialogDescription>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40">
                {detailItem.status === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {detailItem.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                {detailItem.status === 'needs_review' && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                <span className="text-sm font-medium">
                  {detailItem.status === 'success' ? 'הושלם בהצלחה' : detailItem.status === 'error' ? 'שגיאה' : 'דורש בדיקה'}
                </span>
                {detailItem.errorMessage && (
                  <span className="text-xs text-destructive mr-auto">{detailItem.errorMessage}</span>
                )}
              </div>

              {/* Customer Fields */}
              {detailItem.parsedCustomer && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    פרטי לקוח שחולצו
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {[
                      { label: 'שם פרטי', value: detailItem.parsedCustomer.firstName },
                      { label: 'שם משפחה', value: detailItem.parsedCustomer.lastName },
                      { label: 'שם מלא', value: detailItem.parsedCustomer.fullName },
                      { label: 'סוג זיהוי', value: detailItem.parsedCustomer.idType },
                      { label: 'מספר זהות', value: detailItem.parsedCustomer.idNumber },
                      { label: 'טלפון נייד', value: detailItem.parsedCustomer.mobilePhone },
                      { label: 'טלפון נוסף', value: detailItem.parsedCustomer.otherPhone },
                      { label: 'אימייל', value: detailItem.parsedCustomer.email },
                      { label: 'עיר', value: detailItem.parsedCustomer.city },
                      { label: 'רחוב', value: detailItem.parsedCustomer.street },
                      { label: 'מספר בית', value: detailItem.parsedCustomer.houseNumber },
                      { label: 'מיקוד', value: detailItem.parsedCustomer.zipCode },
                      { label: 'מין', value: detailItem.parsedCustomer.gender },
                      { label: 'תאריך לידה', value: detailItem.parsedCustomer.birthDate },
                      { label: 'מצב משפחתי', value: detailItem.parsedCustomer.maritalStatus },
                      { label: 'ילדים', value: detailItem.parsedCustomer.numberOfChildren?.toString() },
                      { label: 'עיסוק', value: detailItem.parsedCustomer.occupation },
                      { label: 'סטטוס תעסוקה', value: detailItem.parsedCustomer.employmentStatus },
                      { label: 'קופת חולים', value: detailItem.parsedCustomer.healthFund },
                      { label: 'גובה (ס"מ)', value: detailItem.parsedCustomer.height?.toString() },
                      { label: 'משקל (ק"ג)', value: detailItem.parsedCustomer.weight?.toString() },
                      { label: 'מעשן', value: detailItem.parsedCustomer.isSmoker === true ? 'כן' : detailItem.parsedCustomer.isSmoker === false ? 'לא' : undefined },
                      { label: 'מקור', value: detailItem.parsedCustomer.source },
                      { label: 'סטטוס', value: detailItem.parsedCustomer.status },
                    ].filter(f => f.value).map((field, idx) => (
                      <div key={idx} className="p-2 bg-muted/30 rounded text-sm">
                        <span className="text-muted-foreground text-xs">{field.label}</span>
                        <p className="font-medium truncate" title={field.value}>{field.value}</p>
                      </div>
                    ))}
                  </div>
                  {detailItem.parsedCustomer.internalNotes && (
                    <div className="mt-2 p-2 bg-muted/30 rounded text-sm">
                      <span className="text-muted-foreground text-xs">הערות פנימיות</span>
                      <p className="text-sm">{detailItem.parsedCustomer.internalNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Products */}
              {detailItem.parsedProducts && detailItem.parsedProducts.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    מוצרים שחולצו ({detailItem.parsedProducts.length})
                  </h4>
                  <div className="rounded-md border overflow-x-auto max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">קטגוריה</TableHead>
                          <TableHead className="text-right">חברה</TableHead>
                          <TableHead className="text-right">סוג מוצר</TableHead>
                          <TableHead className="text-right">מספר פוליסה</TableHead>
                          <TableHead className="text-right">פרמיה חודשית</TableHead>
                          <TableHead className="text-right">צבירה</TableHead>
                          <TableHead className="text-right">מסלול</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailItem.parsedProducts.map((p, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Badge variant={p.category === 'ביטוח' ? 'default' : 'secondary'} className="text-xs">
                                {p.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{p.company || '-'}</TableCell>
                            <TableCell className="text-xs">{p.productType || '-'}</TableCell>
                            <TableCell className="font-mono text-xs">{p.policyNumber || '-'}</TableCell>
                            <TableCell className="text-xs">{p.monthlyPremium ? `₪${p.monthlyPremium.toLocaleString()}` : '-'}</TableCell>
                            <TableCell className="text-xs">{p.accumulation ? `₪${p.accumulation.toLocaleString()}` : '-'}</TableCell>
                            <TableCell className="text-xs">{p.track || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* No parsed data */}
              {!detailItem.parsedCustomer && (!detailItem.parsedProducts || detailItem.parsedProducts.length === 0) && (
                <div className="py-6 text-center text-muted-foreground text-sm">
                  אין נתונים מפורטים לשורה זו
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewIndex !== null} onOpenChange={(open) => { if (!open) setPreviewIndex(null); setPreviewDetailIdx(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              תצוגה מקדימה לפני ייבוא
            </DialogTitle>
            <DialogDescription>
              {previewIndex !== null && uploads[previewIndex] && (
                <>
                  קובץ: <strong>{uploads[previewIndex].file.name}</strong> •{' '}
                  {uploads[previewIndex].previewEntries?.length || 0} לקוחות •{' '}
                  {uploads[previewIndex].previewEntries?.reduce((sum, e) => sum + e.products.length, 0) || 0} מוצרים
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {previewIndex !== null && uploads[previewIndex]?.previewEntries && (() => {
            const entries = uploads[previewIndex].previewEntries!;
            const includedCount = entries.filter(e => !e.excluded).length;
            const includedProducts = entries.filter(e => !e.excluded).reduce((sum, e) => sum + e.products.length, 0);
            const allExcluded = includedCount === 0;
            const allIncluded = includedCount === entries.length;

            return (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Users className="h-3 w-3" />
                  {includedCount} / {entries.length} לקוחות נבחרו
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <FileSpreadsheet className="h-3 w-3" />
                  {includedProducts} מוצרים
                </Badge>
                <Badge variant="secondary">{importMode === 'create_and_update' ? 'יצירה + עדכון' : importMode === 'create_only' ? 'יצירה בלבד' : 'עדכון בלבד'}</Badge>
                <div className="mr-auto">
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleAllPreviewEntries(previewIndex, allIncluded)}>
                    {allIncluded ? 'בטל הכל' : 'בחר הכל'}
                  </Button>
                </div>
              </div>

              {/* Customers list */}
              <div className="rounded-md border overflow-x-auto max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 text-center">
                        <Checkbox
                          checked={allIncluded}
                          onCheckedChange={(checked) => toggleAllPreviewEntries(previewIndex, !checked)}
                        />
                      </TableHead>
                      <TableHead className="text-right w-10">#</TableHead>
                      <TableHead className="text-right">שם לקוח</TableHead>
                      <TableHead className="text-right">ת.ז.</TableHead>
                      <TableHead className="text-right">טלפון</TableHead>
                      <TableHead className="text-right">קובץ מקור</TableHead>
                      <TableHead className="text-right">מוצרים</TableHead>
                      <TableHead className="text-right w-16">פרטים</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, idx) => {
                      const name = entry.customer.fullName || [entry.customer.firstName, entry.customer.lastName].filter(Boolean).join(' ') || '-';
                      return (
                        <TableRow key={idx} className={`cursor-pointer hover:bg-muted/50 ${entry.excluded ? 'opacity-40' : ''} ${previewDetailIdx === idx ? 'bg-primary/5' : ''}`} onClick={() => setPreviewDetailIdx(previewDetailIdx === idx ? null : idx)}>
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={!entry.excluded}
                              onCheckedChange={() => togglePreviewEntry(previewIndex, idx)}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className={`font-medium text-sm ${entry.excluded ? 'line-through' : ''}`}>{name}</TableCell>
                          <TableCell className="font-mono text-xs">{entry.customer.idNumber || <span className="text-amber-500">חסר</span>}</TableCell>
                          <TableCell className="text-xs">{entry.customer.mobilePhone || '-'}</TableCell>
                          <TableCell className="text-xs max-w-[120px] truncate">{entry.sourceFile || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{entry.products.length}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setPreviewDetailIdx(previewDetailIdx === idx ? null : idx); }}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Expanded detail for selected customer */}
              {previewDetailIdx !== null && entries[previewDetailIdx] && (() => {
                const pe = entries[previewDetailIdx];
                const isEditing = editingPreviewIdx === previewDetailIdx;

                const customerFields: { label: string; key: keyof ParsedCustomer; type?: 'text' | 'number' }[] = [
                  { label: 'שם פרטי', key: 'firstName' },
                  { label: 'שם משפחה', key: 'lastName' },
                  { label: 'שם מלא', key: 'fullName' },
                  { label: 'מספר זהות', key: 'idNumber' },
                  { label: 'טלפון נייד', key: 'mobilePhone' },
                  { label: 'אימייל', key: 'email' },
                  { label: 'עיר', key: 'city' },
                  { label: 'תאריך לידה', key: 'birthDate' },
                  { label: 'מין', key: 'gender' },
                  { label: 'קופת חולים', key: 'healthFund' },
                  { label: 'עיסוק', key: 'occupation' },
                  { label: 'מצב משפחתי', key: 'maritalStatus' },
                ];

                return (
                  <Card className="border-primary/20">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          פרטי לקוח - {pe.customer.fullName || [pe.customer.firstName, pe.customer.lastName].filter(Boolean).join(' ')}
                        </CardTitle>
                        <Button
                          variant={isEditing ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setEditingPreviewIdx(isEditing ? null : previewDetailIdx)}
                        >
                          {isEditing ? <><Save className="h-3 w-3" />סיום עריכה</> : <><Pencil className="h-3 w-3" />ערוך</>}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {customerFields
                          .filter(f => isEditing || pe.customer[f.key])
                          .map((field, fidx) => (
                          <div key={fidx} className="p-2 bg-muted/30 rounded text-sm">
                            <span className="text-muted-foreground text-xs">{field.label}</span>
                            {isEditing ? (
                              <Input
                                className="h-7 text-sm mt-0.5"
                                value={(pe.customer[field.key] as string) || ''}
                                onChange={(e) => updatePreviewCustomer(previewIndex, previewDetailIdx, field.key, e.target.value || undefined)}
                              />
                            ) : (
                              <p className="font-medium truncate">{String(pe.customer[field.key] || '-')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {pe.products.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold mb-1.5 flex items-center gap-1">
                            <FileSpreadsheet className="h-3 w-3" />
                            מוצרים ({pe.products.length})
                          </h5>
                          <div className="rounded-md border overflow-x-auto max-h-48 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-right">קטגוריה</TableHead>
                                  <TableHead className="text-right">חברה</TableHead>
                                  <TableHead className="text-right">סוג מוצר</TableHead>
                                  <TableHead className="text-right">מספר פוליסה</TableHead>
                                  <TableHead className="text-right">פרמיה</TableHead>
                                  <TableHead className="text-right">צבירה</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pe.products.map((p, pidx) => (
                                  <TableRow key={pidx}>
                                    <TableCell>
                                      {isEditing ? (
                                        <Select value={p.category} onValueChange={(v) => updatePreviewProduct(previewIndex, previewDetailIdx, pidx, 'category', v)}>
                                          <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="ביטוח">ביטוח</SelectItem>
                                            <SelectItem value="כסף">כסף</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <Badge variant={p.category === 'ביטוח' ? 'default' : 'secondary'} className="text-xs">{p.category}</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <Input className="h-7 text-xs w-24" value={p.company || ''} onChange={(e) => updatePreviewProduct(previewIndex, previewDetailIdx, pidx, 'company', e.target.value || undefined)} />
                                      ) : (
                                        <span className="text-xs">{p.company || '-'}</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <Input className="h-7 text-xs w-24" value={p.productType || ''} onChange={(e) => updatePreviewProduct(previewIndex, previewDetailIdx, pidx, 'productType', e.target.value || undefined)} />
                                      ) : (
                                        <span className="text-xs">{p.productType || '-'}</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <Input className="h-7 text-xs font-mono w-28" value={p.policyNumber || ''} onChange={(e) => updatePreviewProduct(previewIndex, previewDetailIdx, pidx, 'policyNumber', e.target.value || undefined)} />
                                      ) : (
                                        <span className="font-mono text-xs">{p.policyNumber || '-'}</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <Input className="h-7 text-xs w-20" type="number" value={p.monthlyPremium ?? ''} onChange={(e) => updatePreviewProduct(previewIndex, previewDetailIdx, pidx, 'monthlyPremium', e.target.value ? Number(e.target.value) : undefined)} />
                                      ) : (
                                        <span className="text-xs">{p.monthlyPremium ? `₪${p.monthlyPremium.toLocaleString()}` : '-'}</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <Input className="h-7 text-xs w-24" type="number" value={p.accumulation ?? ''} onChange={(e) => updatePreviewProduct(previewIndex, previewDetailIdx, pidx, 'accumulation', e.target.value ? Number(e.target.value) : undefined)} />
                                      ) : (
                                        <span className="text-xs">{p.accumulation ? `₪${p.accumulation.toLocaleString()}` : '-'}</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </div>
          );
          })()}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setPreviewIndex(null); setPreviewDetailIdx(null); }}>
              חזור
            </Button>
            {previewIndex !== null && (
              <>
                <Button variant="ghost" className="text-destructive" onClick={() => { cancelPreview(previewIndex); setPreviewDetailIdx(null); }}>
                  ביטול ייבוא
                </Button>
                <Button
                  disabled={!uploads[previewIndex]?.previewEntries?.some(e => !e.excluded)}
                  onClick={() => { setPreviewDetailIdx(null); confirmImport(previewIndex); }}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  אשר וייבא ({uploads[previewIndex]?.previewEntries?.filter(e => !e.excluded).length || 0} לקוחות)
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Assign Dialog */}
      <Dialog open={!!manualAssignItem} onOpenChange={(open) => !open && setManualAssignItem(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              שיוך ידני ללקוח קיים
            </DialogTitle>
            <DialogDescription>
              {manualAssignItem?.sourceFileName && (
                <span>קובץ: <strong>{manualAssignItem.sourceFileName}</strong></span>
              )}
              {manualAssignItem?.customerIdNumber && (
                <span className="mr-2">• ת.ז.: <strong>{manualAssignItem.customerIdNumber}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label>חפש לקוח לפי שם, ת.ז. או טלפון</Label>
              <Input
                placeholder="הקלד לחיפוש..."
                value={manualAssignSearch}
                onChange={(e) => setManualAssignSearch(e.target.value)}
                className="mt-1"
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-y-auto rounded-md border">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  לא נמצאו לקוחות
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם</TableHead>
                      <TableHead className="text-right">ת.ז.</TableHead>
                      <TableHead className="text-right">טלפון</TableHead>
                      <TableHead className="text-right w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map(c => (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="text-sm font-medium">{c.fullName || `${c.firstName} ${c.lastName}`}</TableCell>
                        <TableCell className="font-mono text-xs">{c.idNumber}</TableCell>
                        <TableCell className="text-xs">{c.mobilePhone}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={manualAssigning}
                            onClick={() => handleManualAssign(c.id, c.fullName || `${c.firstName} ${c.lastName}`)}
                          >
                            {manualAssigning ? <Loader2 className="h-3 w-3 animate-spin" /> : 'שייך'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
