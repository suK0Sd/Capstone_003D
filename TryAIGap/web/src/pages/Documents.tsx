import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  File as FileIcon,
  FileCheck2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderOpen,
  ShieldCheck,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { ApiError } from '@/api/client';
import { deleteDocument, downloadDocument, fetchAreas, fetchDocuments, uploadDocument } from '@/api';
import type { DocumentListItem } from '@/api/types';
import {
  ACCEPT_ATTR,
  documentKind,
  exceedsBackendCap,
  formatBytes,
  validateDocumentFile,
} from '@/lib/documents';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAssessment } from '@/store/assessmentStore';
import { cn } from '@/lib/utils';

const KIND_ICONS = {
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  image: FileImage,
  other: FileIcon,
} as const;

interface UploadNotice {
  kind: 'error' | 'info';
  text: string;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Evidence manager: drag&drop upload, filterable paged list, download, delete. */
export default function Documents() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { assessment, status: assessmentStatus, reload } = useAssessment();

  const [page, setPage] = useState(1);
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [linkArea, setLinkArea] = useState<string>('none');
  const [dragOver, setDragOver] = useState(false);
  const [notices, setNotices] = useState<UploadNotice[]>([]);
  const [toDelete, setToDelete] = useState<DocumentListItem | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  if (assessmentStatus === 'idle') void reload();

  const areasQuery = useQuery({
    queryKey: ['areas', assessment?.id],
    queryFn: () => fetchAreas(assessment!.id),
    enabled: !!assessment,
  });

  const docsQuery = useQuery({
    queryKey: ['documents', assessment?.id, page, areaFilter],
    queryFn: () =>
      fetchDocuments(page, {
        assessmentId: assessment?.id,
        areaKey: areaFilter === 'all' ? undefined : areaFilter,
      }),
    enabled: !!assessment,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, area }: { file: File; area: string | null }) =>
      uploadDocument(file, {
        assessmentId: assessment!.id,
        areaKey: area ?? undefined,
      }),
    onSuccess: (_data, { file }) => {
      setNotices((n) => [...n, { kind: 'info', text: t('documents.uploadSuccess', { name: file.name }) }]);
      void queryClient.invalidateQueries({ queryKey: ['documents', assessment?.id] });
    },
    onError: (err, { file }) => {
      let text = t('documents.uploadGenericError', { name: file.name });
      if (err instanceof ApiError && err.status === 413) {
        text = t('documents.uploadTooLarge', { name: file.name });
      }
      setNotices((n) => [...n, { kind: 'error', text }]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => deleteDocument(docId),
    onSuccess: () => {
      setToDelete(null);
      void queryClient.invalidateQueries({ queryKey: ['documents', assessment?.id] });
    },
  });

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    for (const file of list) {
      const val = validateDocumentFile(file);
      if (!val.ok) {
        setNotices((n) => [
          ...n,
          {
            kind: 'error',
            text:
              val.error === 'too_large'
                ? t('documents.validationTooLarge', { name: file.name })
                : t('documents.validationType', { name: file.name }),
          },
        ]);
        continue;
      }
      if (exceedsBackendCap(file.size)) {
        setNotices((n) => [
          ...n,
          { kind: 'error', text: t('documents.uploadTooLarge', { name: file.name }) },
        ]);
        continue;
      }
      uploadMutation.mutate({ file, area: linkArea === 'none' ? null : linkArea });
    }
  }

  const areas = areasQuery.data?.items ?? [];
  const areaName = (key?: string | null) =>
    key ? (areas.find((a) => a.area_key === key)?.name ?? key) : '—';

  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
    [i18n.language],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <FolderOpen className="h-3 w-3" />
              Módulo 4: Evidencias y Políticas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('documents.title')}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {t('documents.sub')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold py-1 px-3 bg-card/60">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-primary" /> Almacenamiento seguro
          </Badge>
        </div>
      </div>

      {!assessment && (
        <SpotlightCard className="rounded-2xl border border-primary/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-foreground">{t('common.noAssessment')}</p>
              <p className="text-xs text-muted-foreground mt-1">Regístrate para vincular documentos de respaldo a tu diagnóstico.</p>
            </div>
            <Button asChild size="sm" className="brand-gradient text-white rounded-xl text-xs h-9">
              <Link to="/onboarding">{t('common.startDiagnostic')}</Link>
            </Button>
          </div>
        </SpotlightCard>
      )}

      {/* Zona de Carga Drag & Drop */}
      <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Subir nuevo archivo de respaldo</h2>
            <p className="text-xs text-muted-foreground">Formatos soportados: PDF, DOCX, XLSX, PNG, JPG (Máx 25 MB)</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Vincular a área:</span>
            <Select value={linkArea} onValueChange={setLinkArea}>
              <SelectTrigger className="h-8 text-xs w-44 rounded-lg bg-card">
                <SelectValue placeholder="General (sin área)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General (sin área)</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a.area_key} value={a.area_key}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) void handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInput.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer',
            dragOver
              ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
              : 'border-border/70 bg-card/40 hover:border-primary/50 hover:bg-muted/30',
          )}
        >
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={ACCEPT_ATTR}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) void handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient text-white shadow-md mb-3">
            <UploadCloud className="h-6 w-6" />
          </div>
          <p className="text-xs sm:text-sm font-bold text-foreground">
            Arrastra tus archivos aquí o <span className="text-primary underline">haz clic para explorar</span>
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Políticas de seguridad, inventarios de datos, manuales de procesos o contratos de proveedores de IA.
          </p>
        </div>

        {/* Notificaciones de subida */}
        {notices.length > 0 && (
          <div className="space-y-2 pt-2">
            {notices.map((n, i) => (
              <Alert
                key={i}
                variant={n.kind === 'error' ? 'destructive' : 'default'}
                className="text-xs rounded-xl py-2 px-3"
              >
                <AlertDescription>{n.text}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </SpotlightCard>

      {/* Listado de Documentos */}
      <SpotlightCard className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-primary" />
            <h2 className="text-base font-bold text-foreground">Archivos Almacenados</h2>
            <Badge variant="secondary" className="text-xs font-semibold">
              {docsQuery.data?.items.length ?? 0}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={areaFilter} onValueChange={(v) => { setAreaFilter(v); setPage(1); }}>
              <SelectTrigger className="h-8 text-xs w-40 rounded-lg bg-card">
                <SelectValue placeholder="Todas las áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las áreas</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a.area_key} value={a.area_key}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {docsQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : !docsQuery.data?.items.length ? (
          <Empty className="py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen className="h-10 w-10 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-bold">No hay documentos adjuntados</EmptyTitle>
              <EmptyDescription className="text-xs">
                Sube evidencias para respaldar tus respuestas del cuestionario y hacerlas auditables.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-bold">Archivo</TableHead>
                  <TableHead className="font-bold">Área</TableHead>
                  <TableHead className="font-bold">Tamaño</TableHead>
                  <TableHead className="font-bold">Fecha de subida</TableHead>
                  <TableHead className="text-right font-bold">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docsQuery.data.items.map((doc: DocumentListItem) => {
                  const kind = documentKind(doc.mime_type);
                  const Icon = KIND_ICONS[kind] ?? FileIcon;

                  return (
                    <TableRow key={doc.id} className="hover:bg-muted/30 text-xs content-auto">
                      <TableCell className="font-semibold text-foreground flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="truncate max-w-xs">{doc.filename}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {areaName(doc.area_key)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-[11px]">
                        {formatBytes(doc.size_bytes)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.created_at ? dateFmt.format(new Date(doc.created_at)) : '—'}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            const blob = await downloadDocument(doc.id);
                            saveBlob(blob, doc.filename);
                          }}
                          className="h-7 w-7 p-0 rounded-lg text-primary hover:bg-primary/10 cursor-pointer"
                          title="Descargar"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setToDelete(doc)}
                          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SpotlightCard>

      {/* Modal de confirmación para eliminar */}
      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold">¿Eliminar evidencia?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Se eliminará permanentemente el archivo <strong>{toDelete?.filename}</strong> de tu repositorio de evidencias.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs rounded-xl"
              onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
