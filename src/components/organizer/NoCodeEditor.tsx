'use client';

import { useState, useCallback, useRef } from 'react';
import { useAppStore, type TemplateName, type AnimationType } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Palette,
  Type,
  Music,
  Image as ImageIcon,
  Eye,
  Save,
  Upload,
  Check,
} from 'lucide-react';

/* ============================================================
   Template definitions with preview styles
   ============================================================ */

const TEMPLATES: { key: TemplateName; name: string; desc: string; bgStyle: string; accentColor: string }[] = [
  {
    key: 'medina',
    name: 'Médina',
    desc: 'Arabesques dorées sur ivoire, inspiration orientale',
    bgStyle: 'linear-gradient(135deg, #FAF7F2, #F0E6D3)',
    accentColor: '#C5A880',
  },
  {
    key: 'roseraie',
    name: 'Roseraie',
    desc: 'Rose pâle et verts tendres, romantisme floral',
    bgStyle: 'linear-gradient(135deg, #FDF2F4, #FCECEE)',
    accentColor: '#D4A0A0',
  },
  {
    key: 'billet',
    name: 'Billet',
    desc: 'Minimalisme épuré, noir et or sur blanc cassé',
    bgStyle: 'linear-gradient(135deg, #FEFEFE, #F5F0E8)',
    accentColor: '#1A1818',
  },
  {
    key: 'velours',
    name: 'Velours',
    desc: 'Bordeaux profond et dorures, opulence théâtrale',
    bgStyle: 'linear-gradient(135deg, #2A0E13, #1A1818)',
    accentColor: '#D4AF37',
  },
  {
    key: 'theatre',
    name: 'Théâtre',
    desc: 'Rouge rideau et or bruni, majesté classique',
    bgStyle: 'linear-gradient(135deg, #3A0A10, #1A0508)',
    accentColor: '#C5A880',
  },
];

/* ============================================================
   No-Code Editor Component
   ============================================================ */

export default function NoCodeEditor() {
  const { event, setEvent } = useAppStore();

  /* Local form state synced with store */
  const [brideName, setBrideName] = useState(event.brideName || '');
  const [groomName, setGroomName] = useState(event.groomName || '');
  const [eventDate, setEventDate] = useState(
    event.eventDate ? event.eventDate.slice(0, 10) : ''
  );
  const [eventTime, setEventTime] = useState(event.eventTime || '');
  const [venueName, setVenueName] = useState(event.venueName || '');
  const [venueAddress, setVenueAddress] = useState(event.venueAddress || '');
  const [mairieName, setMairieName] = useState(event.mairieName || '');
  const [mairieAddress, setMairieAddress] = useState(event.mairieAddress || '');
  const [mairieTime, setMairieTime] = useState(event.mairieTime || '');
  const [receptionVenue, setReceptionVenue] = useState(event.receptionVenue || '');
  const [receptionAddress, setReceptionAddress] = useState(event.receptionAddress || '');
  const [receptionTime, setReceptionTime] = useState(event.receptionTime || '');
  const [dressCode, setDressCode] = useState(event.dressCode || '');
  const [coupleStory, setCoupleStory] = useState(event.coupleStory || '');
  const [musicUrl, setMusicUrl] = useState(event.musicUrl || '');
  const [primaryColor, setPrimaryColor] = useState(event.primaryColor || '#5C1D24');
  const [accentColor, setAccentColor] = useState(event.accentColor || '#C5A880');
  const [animationType, setAnimationType] = useState<AnimationType>(
    (event.animationType as AnimationType) || 'envelope'
  );
  const [activeTemplate, setActiveTemplate] = useState<TemplateName>(
    event.template as TemplateName
  );
  const [coverPreview, setCoverPreview] = useState(event.coverPhotoUrl || null);
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  /* Auto-save to store on any change */
  const handleSave = useCallback(() => {
    setEvent({
      brideName,
      groomName,
      eventDate: eventDate ? new Date(eventDate).toISOString() : null,
      eventTime,
      venueName,
      venueAddress,
      mairieName,
      mairieAddress,
      mairieTime,
      receptionVenue,
      receptionAddress,
      receptionTime,
      dressCode,
      coupleStory,
      musicUrl,
      primaryColor,
      accentColor,
      animationType,
      template: activeTemplate,
      coverPhotoUrl: coverPreview,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [
    brideName, groomName, eventDate, eventTime, venueName, venueAddress,
    mairieName, mairieAddress, mairieTime, receptionVenue, receptionAddress, receptionTime, dressCode,
    coupleStory, musicUrl, primaryColor, accentColor, animationType,
    activeTemplate, coverPreview, setEvent,
  ]);

  /* Cover photo upload handler */
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  /* Audio file upload handler */
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      /* In production: upload to Cloudinary and get URL */
      setMusicUrl(file.name);
    }
  };

  /* Get current template style for live preview */
  const currentTemplate = TEMPLATES.find((t) => t.key === activeTemplate) || TEMPLATES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-script text-gold text-2xl mb-1">Création</p>
          <h2 className="font-display-bold text-3xl">Éditeur d&apos;Invitation</h2>
          <p className="text-muted-foreground mt-1 font-body text-sm">
            Personnalisez chaque détail et visualisez en temps réel
          </p>
        </div>
        <Button
          className="btn-luxury bg-gold text-charcoal font-display"
          onClick={handleSave}
        >
          {saved ? (
            <span><Check className="w-4 h-4 mr-2" /> Sauvegardé</span>
          ) : (
            <span><Save className="w-4 h-4 mr-2" /> Sauvegarder</span>
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left panel: Editor controls (3/5 width) */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="textes" className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="textes" className="gap-1.5">
                <Type className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Textes</span>
              </TabsTrigger>
              <TabsTrigger value="design" className="gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Design</span>
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Médias</span>
              </TabsTrigger>
              <TabsTrigger value="programme" className="gap-1.5">
                <Music className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Programme</span>
              </TabsTrigger>
            </TabsList>

            {/* TEXTES TAB */}
            <TabsContent value="textes">
              <Card className="card-luxury rounded-xl">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Textes de l&apos;Invitation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-display text-sm">Prénom de la mariée</Label>
                      <Input
                        value={brideName}
                        onChange={(e) => setBrideName(e.target.value)}
                        placeholder="Amira"
                        className="border-gold/30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-display text-sm">Prénom du marié</Label>
                      <Input
                        value={groomName}
                        onChange={(e) => setGroomName(e.target.value)}
                        placeholder="Karim"
                        className="border-gold/30"
                      />
                    </div>
                  </div>

                  <div className="divider-ornament flex items-center gap-3">
                    <span className="text-gold text-xs">&#9670;</span>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-display text-sm">Notre Histoire</Label>
                    <Textarea
                      value={coupleStory}
                      onChange={(e) => setCoupleStory(e.target.value)}
                      placeholder="Racontez votre histoire d'amour..."
                      className="border-gold/30 min-h-[120px] resize-y"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-display text-sm">Code Vestimentaire</Label>
                    <Input
                      value={dressCode}
                      onChange={(e) => setDressCode(e.target.value)}
                      placeholder="Tenue de cérémonie — Couleurs chaudes"
                      className="border-gold/30"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DESIGN TAB */}
            <TabsContent value="design">
              <Card className="card-luxury rounded-xl">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Design & Template</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Template selection */}
                  <div className="space-y-3">
                    <Label className="font-display text-sm">Template</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.key}
                          className={`relative rounded-xl overflow-hidden transition-all p-1 ${
                            activeTemplate === t.key
                              ? 'ring-2 ring-gold ring-offset-2 scale-[1.02]'
                              : 'hover:scale-[1.01]'
                          }`}
                          onClick={() => setActiveTemplate(t.key)}
                        >
                          <div
                            className="aspect-[3/4] rounded-lg flex flex-col items-center justify-center p-3"
                            style={{ background: t.bgStyle }}
                          >
                            <p
                              className="font-display-bold text-sm mb-1"
                              style={{ color: t.accentColor }}
                            >
                              {t.name}
                            </p>
                            <p className="text-xs text-muted-foreground text-center leading-tight">
                              {t.desc}
                            </p>
                          </div>
                          {activeTemplate === t.key && (
                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                              <Check className="w-3 h-3 text-charcoal" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Animation type */}
                  <div className="space-y-2">
                    <Label className="font-display text-sm">Animation d&apos;ouverture</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        className={`card-luxury rounded-xl p-4 text-center transition-all ${
                          animationType === 'envelope' ? 'ring-2 ring-gold' : ''
                        }`}
                        onClick={() => setAnimationType('envelope')}
                      >
                        <span className="text-2xl mb-2 block">✉️</span>
                        <p className="font-display text-sm">Enveloppe</p>
                        <p className="text-xs text-muted-foreground">Sceau de cire</p>
                      </button>
                      <button
                        className={`card-luxury rounded-xl p-4 text-center transition-all ${
                          animationType === 'curtain' ? 'ring-2 ring-gold' : ''
                        }`}
                        onClick={() => setAnimationType('curtain')}
                      >
                        <span className="text-2xl mb-2 block">🎭</span>
                        <p className="font-display text-sm">Rideau</p>
                        <p className="text-xs text-muted-foreground">Velours doré</p>
                      </button>
                    </div>
                  </div>

                  <Separator className="bg-gold/10" />

                  {/* Color pickers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-display text-sm">Couleur principale</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="border-gold/30 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-display text-sm">Couleur d&apos;accent</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                        />
                        <Input
                          value={accentColor}
                          onChange={(e) => setAccentColor(e.target.value)}
                          className="border-gold/30 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MEDIA TAB */}
            <TabsContent value="media">
              <Card className="card-luxury rounded-xl">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Médias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Cover photo */}
                  <div className="space-y-3">
                    <Label className="font-display text-sm">Photo de couverture</Label>
                    <div
                      className="relative rounded-xl overflow-hidden border-2 border-dashed border-gold/30 hover:border-gold/50 transition-colors cursor-pointer"
                      style={{ aspectRatio: '16/9' }}
                      onClick={() => coverFileRef.current?.click()}
                    >
                      <input
                        ref={coverFileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverUpload}
                      />
                      {coverPreview ? (
                        <img
                          src={coverPreview}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30">
                          <Upload className="w-8 h-8 text-gold mb-2" />
                          <p className="font-display text-sm">Cliquer pour uploader</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG — recommandé 1920x1080</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Music upload */}
                  <div className="space-y-3">
                    <Label className="font-display text-sm">Musique d&apos;ambiance</Label>
                    <div
                      className="card-luxury rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:card-luxury-elevated transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        onChange={handleAudioUpload}
                      />
                      <Music className="w-8 h-8 text-gold" />
                      <div className="flex-1">
                        <p className="font-display text-sm">
                          {musicUrl || 'Aucun fichier sélectionné'}
                        </p>
                        <p className="text-xs text-muted-foreground">MP3, WAV, OGG</p>
                      </div>
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* PROGRAMME TAB */}
            <TabsContent value="programme">
              <Card className="card-luxury rounded-xl">
                <CardHeader>
                  <CardTitle className="font-display text-lg">Programme de la Journée</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Mairie */}
                  <div className="space-y-3">
                    <h4 className="font-display text-sm text-muted-foreground tracking-luxury">
                      Mairie
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Lieu</Label>
                        <Input
                          value={mairieName}
                          onChange={(e) => setMairieName(e.target.value)}
                          placeholder="Mairie de Dakar"
                          className="border-gold/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Heure</Label>
                        <Input
                          value={mairieTime}
                          onChange={(e) => setMairieTime(e.target.value)}
                          placeholder="09h00"
                          className="border-gold/30"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Adresse</Label>
                        <Input
                          value={mairieAddress}
                          onChange={(e) => setMairieAddress(e.target.value)}
                          placeholder="Place de l'Independance, Dakar"
                          className="border-gold/30"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gold/10" />

                  {/* Cérémonie */}
                  <div className="space-y-3">
                    <h4 className="font-display text-sm text-muted-foreground tracking-luxury">
                      Cérémonie
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Lieu</Label>
                        <Input
                          value={venueName}
                          onChange={(e) => setVenueName(e.target.value)}
                          placeholder="Domaine les Collines"
                          className="border-gold/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Adresse</Label>
                        <Input
                          value={venueAddress}
                          onChange={(e) => setVenueAddress(e.target.value)}
                          placeholder="Route de Ngor, Dakar"
                          className="border-gold/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="border-gold/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Heure</Label>
                        <Input
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                          placeholder="16h00"
                          className="border-gold/30"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gold/10" />

                  {/* Réception */}
                  <div className="space-y-3">
                    <h4 className="font-display text-sm text-muted-foreground tracking-luxury">
                      Réception
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Lieu</Label>
                        <Input
                          value={receptionVenue}
                          onChange={(e) => setReceptionVenue(e.target.value)}
                          placeholder="Terrou-Bi Hôtel"
                          className="border-gold/30"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Heure</Label>
                        <Input
                          value={receptionTime}
                          onChange={(e) => setReceptionTime(e.target.value)}
                          placeholder="20h00"
                          className="border-gold/30"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Adresse</Label>
                        <Input
                          value={receptionAddress}
                          onChange={(e) => setReceptionAddress(e.target.value)}
                          placeholder="Corniche Ouest, Dakar"
                          className="border-gold/30"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right panel: Live Preview (2/5 width) */}
        <div className="lg:col-span-2">
          <div className="sticky top-20">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-gold" />
              <p className="font-display text-sm tracking-luxury">Aperçu en direct</p>
            </div>
            <div
              className="rounded-2xl overflow-hidden border border-gold/20 shadow-xl"
              style={{ background: currentTemplate.bgStyle }}
            >
              {/* Phone mockup frame */}
              <div className="p-3">
                <div className="rounded-xl overflow-hidden bg-white" style={{ minHeight: 500 }}>
                  {/* Cover area */}
                  <div
                    className="relative"
                    style={{ aspectRatio: '4/3' }}
                  >
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: currentTemplate.bgStyle }}
                      ></div>
                    )}
                    {/* Overlay with names */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 flex flex-col justify-end p-4">
                      <p className="text-white/80 text-xs font-display tracking-widest uppercase text-center">
                        Vous êtes invité(e) au mariage de
                      </p>
                      <h3
                        className="text-white font-display-bold text-xl text-center mt-1"
                        style={{
                          textShadow: '0 2px 8px ' + (currentTemplate.accentColor || '') + '40',
                        }}
                      >
                        {brideName || 'Prénom'} & {groomName || 'Prénom'}
                      </h3>
                    </div>
                  </div>

                  {/* Mini timeline preview */}
                  <div className="p-4 space-y-3">
                    <div className="divider-ornament flex items-center gap-3">
                      <span style={{ color: currentTemplate.accentColor }} className="text-xs">&#9670;</span>
                    </div>

                    {eventDate && (
                      <p className="text-center font-display text-xs text-muted-foreground">
                        {new Date(eventDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {eventTime && ` — ${eventTime}`}
                      </p>
                    )}

                    {/* Timeline items */}
                    <div className="space-y-2">
                      {[
                        { time: mairieTime, name: mairieName, label: 'Mairie' },
                        { time: eventTime, name: venueName, label: 'Cérémonie' },
                        { time: receptionTime, name: receptionVenue, label: 'Réception' },
                      ].map((step) => (
                        <div
                          key={step.label}
                          className="flex items-center gap-2 text-xs"
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: currentTemplate.accentColor }}
                          />
                          <span className="font-display font-semibold" style={{ color: currentTemplate.accentColor }}>
                            {step.time || '--:--'}
                          </span>
                          <span className="text-muted-foreground">
                            {step.label}
                          </span>
                          {step.name && (
                            <span className="font-display truncate">— {step.name}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    {dressCode && (
                      <div
                        className="text-center text-xs px-3 py-2 rounded-lg"
                        style={{
                          background: `${currentTemplate.accentColor}10`,
                          color: currentTemplate.accentColor,
                        }}
                      >
                        {dressCode}
                      </div>
                    )}

                    {/* Animation indicator */}
                    <div className="text-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        Animation :{' '}
                      </span>
                      <span className="font-display text-xs" style={{ color: currentTemplate.accentColor }}>
                        {animationType === 'envelope' ? 'Enveloppe' : 'Rideau'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
