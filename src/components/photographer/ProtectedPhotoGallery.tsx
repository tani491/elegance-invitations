'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Lock,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from 'lucide-react';

/* ============================================================
   Protected Photo Gallery — Access code required, HD viewing
   ============================================================ */

const PHOTO_CATEGORIES = [
  { value: 'all', label: 'Toutes' },
  { value: 'preparatifs', label: 'Préparatifs' },
  { value: 'ceremonie', label: 'Cérémonie' },
  { value: 'couple', label: 'Couple' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'reception', label: 'Réception' },
  { value: 'soiree', label: 'Soirée' },
];

export default function ProtectedPhotoGallery() {
  const { event, galleryAccessCode, setGalleryAccessCode, galleryUnlocked, setGalleryUnlocked } =
    useAppStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);

  const filteredPhotos =
    activeCategory === 'all'
      ? event.photos
      : event.photos.filter((p) => p.category === activeCategory);

  const handleUnlock = () => {
    /* Accept any non-empty code in demo; real app checks against backend */
    if (codeInput.trim().length > 0) {
      setGalleryUnlocked(true);
      setGalleryAccessCode(codeInput.trim());
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUnlock();
  };

  const handlePrev = () => {
    if (selectedPhoto === null) return;
    setSelectedPhoto((prev) =>
      prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1
    );
  };

  const handleNext = () => {
    if (selectedPhoto === null) return;
    setSelectedPhoto((prev) =>
      prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0
    );
  };

  /* Locked screen */
  if (!galleryUnlocked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          className="card-luxury-elevated rounded-2xl p-8 max-w-sm w-full text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Lock className="w-12 h-12 mx-auto text-gold mb-4" />
          <h2 className="font-display-bold text-2xl mb-2">Galerie Privée</h2>
          <p className="text-muted-foreground font-body mb-6">
            Cette galerie est réservée aux invités. Saisissez votre code d&apos;accès
            personnel pour accéder aux souvenirs de l&apos;événement.
          </p>

          <div className="space-y-3">
            <Input
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value);
                setCodeError(false);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Votre code d'accès"
              className={`text-center font-mono text-lg tracking-widest ${
                codeError ? 'border-destructive' : 'border-gold/30'
              }`}
            />
            {codeError && (
              <p className="text-xs text-destructive">Veuillez saisir un code valide</p>
            )}
            <Button
              className="w-full h-12 btn-luxury bg-gold text-charcoal font-display"
              onClick={handleUnlock}
            >
              <Lock className="w-4 h-4 mr-2" />
              Accéder à la galerie
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="font-script text-gold text-2xl mb-2">Souvenirs</p>
        <h2 className="font-display-bold text-3xl">Galerie Photo</h2>
        <p className="text-muted-foreground mt-2 font-body">
          {event.photos.length} souvenirs captures lors de cet événement exceptionnel
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {PHOTO_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            className={`px-4 py-2 rounded-full text-sm font-display transition-all ${
              activeCategory === cat.value
                ? 'bg-gold text-charcoal'
                : 'card-luxury hover:card-luxury-elevated text-muted-foreground'
            }`}
            onClick={() => setActiveCategory(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {filteredPhotos.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-display text-lg text-muted-foreground">
            Aucune photo dans cette catégorie
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredPhotos.map((photo, idx) => (
            <motion.div
              key={photo.id}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer card-luxury"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedPhoto(idx)}
            >
              <img
                src={photo.thumbnailUrl}
                alt={photo.title || 'Photo'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-display truncate">
                    {photo.title}
                  </p>
                  <p className="text-white/70 text-xs capitalize">
                    {photo.category}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog
        open={selectedPhoto !== null}
        onOpenChange={() => setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <AnimatePresence mode="wait">
            {selectedPhoto !== null && filteredPhotos[selectedPhoto] && (
              <motion.div
                key={selectedPhoto}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative"
              >
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 z-10 text-white/70 hover:text-white bg-black/30 hover:bg-black/50"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="w-5 h-5" />
                </Button>

                {/* Photo */}
                <div className="flex items-center justify-center min-h-[50vh] max-h-[80vh]">
                  <img
                    src={filteredPhotos[selectedPhoto].originalUrl}
                    alt={filteredPhotos[selectedPhoto].title || 'Photo'}
                    className="max-w-full max-h-[80vh] object-contain"
                  />
                </div>

                {/* Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white font-display">
                    {filteredPhotos[selectedPhoto].title}
                  </p>
                  <p className="text-white/60 text-sm capitalize">
                    {filteredPhotos[selectedPhoto].category}
                  </p>
                </div>

                {/* Navigation */}
                <button
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                {/* Download button */}
                <a
                  href={filteredPhotos[selectedPhoto].originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute top-3 left-3 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
                  download
                >
                  <Download className="w-5 h-5" />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
