'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type EventPhoto } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  Image as ImageIcon,
  FolderOpen,
  CheckCircle2,
  X,
  CloudUpload,
} from 'lucide-react';

/* ============================================================
   Photographer Cloudinary Upload Portal
   Simulates direct upload with progress indicators
   ============================================================ */

const CATEGORIES = [
  { value: 'preparatifs', label: 'Préparatifs' },
  { value: 'ceremonie', label: 'Cérémonie' },
  { value: 'couple', label: 'Couple' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'reception', label: 'Réception' },
  { value: 'soiree', label: 'Soirée' },
];

interface UploadItem {
  id: string;
  file: File;
  preview: string;
  category: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

export default function PhotographerUpload() {
  const { event, setEvent } = useAppStore();
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [category, setCategory] = useState('ceremonie');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const items: UploadItem[] = Array.from(files).map((file, i) => ({
        id: `upload_${Date.now()}_${i}`,
        file,
        preview: URL.createObjectURL(file),
        category,
        progress: 0,
        status: 'pending',
      }));
      setUploads((prev) => [...prev, ...items]);
    },
    [category]
  );

  const simulateUpload = useCallback(
    (itemId: string) => {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === itemId ? { ...u, status: 'uploading' as const, progress: 0 } : u
        )
      );

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploads((prev) =>
            prev.map((u) =>
              u.id === itemId ? { ...u, status: 'done' as const, progress: 100 } : u
            )
          );

          /* Add to event photos */
          const item = uploads.find((u) => u.id === itemId);
          if (item) {
            const newPhoto: EventPhoto = {
              id: `p_${Date.now()}`,
              eventId: event.id,
              cloudinaryPublicId: `demo/uploaded_${Date.now()}`,
              category: item.category,
              title: item.file.name.replace(/\.[^.]+$/, ''),
              originalUrl: item.preview,
              thumbnailUrl: item.preview,
              width: 1200,
              height: 800,
              uploadedAt: new Date().toISOString(),
            };
            setEvent({ photos: [...event.photos, newPhoto] });
          }
        } else {
          setUploads((prev) =>
            prev.map((u) =>
              u.id === itemId ? { ...u, progress: Math.min(progress, 99) } : u
            )
          );
        }
      }, 400);
    },
    [uploads, event, setEvent]
  );

  const handleUploadAll = () => {
    uploads
      .filter((u) => u.status === 'pending')
      .forEach((u) => simulateUpload(u.id));
  };

  const handleRemove = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const pendingCount = uploads.filter((u) => u.status === 'pending').length;
  const doneCount = uploads.filter((u) => u.status === 'done').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="font-script text-gold text-2xl mb-2">Espace Photographe</p>
        <h2 className="font-display-bold text-3xl">Dépôt de Photos</h2>
        <p className="text-muted-foreground mt-2 font-body">
          Téléversez vos photos en haute résolution. Elles seront automatiquement
          optimisées pour la galerie web.
        </p>
      </div>

      {/* Category selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-gold" />
          <span className="font-display text-sm">Catégorie :</span>
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48 border-gold/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-gold bg-gold/5'
            : 'border-gold/30 hover:border-gold/50 hover:bg-gold/3'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <CloudUpload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-gold' : 'text-muted-foreground'}`} />
        <p className="font-display text-lg mb-1">
          {isDragging ? 'Déposez vos fichiers ici' : 'Glissez-déposez vos photos'}
        </p>
        <p className="text-sm text-muted-foreground">
          ou cliquez pour parcourir — JPEG, PNG, RAW supportés
        </p>
      </div>

      {/* Upload queue */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            className="mt-6 space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">
                File d'envoi ({doneCount}/{uploads.length})
              </h3>
              {pendingCount > 0 && (
                <Button
                  className="btn-luxury bg-gold text-charcoal font-display"
                  size="sm"
                  onClick={handleUploadAll}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Tout envoyer ({pendingCount})
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
              {uploads.map((item) => (
                <div
                  key={item.id}
                  className="card-luxury rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={item.preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm truncate">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORIES.find((c) => c.value === item.category)?.label}
                    </p>
                    {item.status === 'uploading' && (
                      <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                        <motion.div
                          className="h-full bg-gold rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {item.status === 'done' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {item.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          simulateUpload(item.id);
                        }}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <div className="card-luxury rounded-xl p-4 text-center">
          <ImageIcon className="w-5 h-5 mx-auto text-gold mb-2" />
          <p className="font-display-bold text-2xl">{event.photos.length}</p>
          <p className="text-xs text-muted-foreground">Photos totales</p>
        </div>
        <div className="card-luxury rounded-xl p-4 text-center">
          <FolderOpen className="w-5 h-5 mx-auto text-gold mb-2" />
          <p className="font-display-bold text-2xl">
            {new Set(event.photos.map((p) => p.category)).size}
          </p>
          <p className="text-xs text-muted-foreground">Catégories</p>
        </div>
        <div className="card-luxury rounded-xl p-4 text-center">
          <Upload className="w-5 h-5 mx-auto text-gold mb-2" />
          <p className="font-display-bold text-2xl">{doneCount}</p>
          <p className="text-xs text-muted-foreground">Envoyées</p>
        </div>
      </div>
    </div>
  );
}
