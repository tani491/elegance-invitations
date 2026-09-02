'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useEffect, useState, useCallback } from 'react';

interface EnvelopeHeroProps {
  animationType?: 'envelope' | 'curtain';
  onOpened?: () => void;
}

export default function EnvelopeHero({ animationType = 'envelope', onOpened }: EnvelopeHeroProps) {
  const { envelopeOpened, setEnvelopeOpened } = useAppStore();
  const [sealBroken, setSealBroken] = useState(false);
  const [flapOpen, setFlapOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);

  const handleOpen = useCallback(() => {
    if (envelopeOpened) return;

    if (animationType === 'envelope') {
      setSealBroken(true);
      setTimeout(() => setFlapOpen(true), 400);
      setTimeout(() => setShowContent(true), 800);
      setTimeout(() => {
        setEnvelopeOpened(true);
        onOpened?.();
      }, 1400);
    } else {
      setCurtainOpen(true);
      setTimeout(() => {
        setEnvelopeOpened(true);
        onOpened?.();
      }, 1400);
    }
  }, [animationType, envelopeOpened, onOpened, setEnvelopeOpened]);

  /* Auto-open after 6s in case user doesn't tap */
  useEffect(() => {
    const t = setTimeout(handleOpen, 6000);
    return () => clearTimeout(t);
  }, [handleOpen]);

  return (
    <AnimatePresence>
      {!envelopeOpened && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'oklch(0.14 0.02 300)' }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Subtle radial glow behind */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, oklch(0.72 0.12 82 / 8%) 0%, transparent 70%)',
            }}
          />

          {animationType === 'envelope' ? (
            <EnvelopeMode
              sealBroken={sealBroken}
              flapOpen={flapOpen}
              showContent={showContent}
            />
          ) : (
            <CurtainMode curtainOpen={curtainOpen} />
          )}

          {/* Instruction text */}
          <motion.p
            className="font-script text-gold mt-10 text-2xl sm:text-3xl select-none"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            onClick={handleOpen}
          >
            {animationType === 'envelope'
              ? 'Touchez pour ouvrir'
              : 'Tirez les rideaux'}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   ENVELOPE MODE — Wax seal breaks, flap opens
   ============================================================ */
function EnvelopeMode({
  sealBroken,
  flapOpen,
  showContent,
}: {
  sealBroken: boolean;
  flapOpen: boolean;
  showContent: boolean;
}) {
  return (
    <div
      className="relative cursor-pointer"
      style={{ perspective: '1200px' }}
    >
      {/* Envelope body */}
      <motion.div
        className="relative w-[320px] h-[200px] sm:w-[400px] sm:h-[250px] rounded-lg"
        style={{
          background: 'linear-gradient(145deg, #FDFBF7 0%, #F0E6D3 100%)',
          border: '1px solid oklch(0.72 0.12 82 / 30%)',
          boxShadow: '0 20px 60px oklch(0 0 0 / 40%), 0 0 80px oklch(0.72 0.12 82 / 8%)',
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Inner border decoration */}
        <div
          className="absolute inset-3 rounded"
          style={{ border: '1px solid oklch(0.72 0.12 82 / 20%)' }}
        />

        {/* Letter inside (visible when flap opens) */}
        <AnimatePresence>
          {showContent && (
            <motion.div
              className="absolute inset-x-6 bottom-4 top-8 rounded-sm"
              style={{
                background: 'linear-gradient(180deg, #FEFCF9, #F8F2E8)',
                border: '1px solid oklch(0.72 0.12 82 / 15%)',
              }}
              initial={{ y: 0 }}
              animate={{ y: -30 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="p-4 text-center">
                <p className="font-script text-gold text-xl">Vous êtes invité(e)</p>
                <div className="w-12 h-px mx-auto my-2" style={{ background: 'oklch(0.72 0.12 82 / 40%)' }} />
                <p className="font-display text-charcoal text-sm tracking-luxury">AMIRA & KARIM</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Envelope flap */}
        <motion.div
          className="absolute -top-0 left-0 right-0 h-1/2 origin-top"
          style={{
            background: 'linear-gradient(180deg, #E8D9C0 0%, #F0E6D3 100%)',
            clipPath: 'polygon(0 0, 50% 70%, 100% 0)',
            transformOrigin: 'top center',
            zIndex: 5,
          }}
          animate={flapOpen ? { rotateX: -180 } : { rotateX: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Wax seal */}
        <AnimatePresence>
          {!sealBroken && (
            <motion.div
              className="absolute top-1/2 left-1/2 z-10"
              style={{
                x: '-50%',
                y: '-50%',
                marginTop: '-40px',
              }}
              exit="break"
              initial={false}
            >
              <motion.div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #8B2D3B, #5C1D24 50%, #3A1018)',
                  boxShadow: '0 4px 20px oklch(0 0 0 / 50%), inset 0 2px 6px oklch(0.85 0.065 82 / 20%)',
                }}
                variants={{
                  idle: { scale: 1 },
                  tap: { scale: 1.08 },
                }}
                whileTap="tap"
              >
                {/* Seal initial */}
                <span className="font-display-bold text-gold text-xl sm:text-2xl select-none">
                  AK
                </span>
              </motion.div>

              {/* Seal pieces (visible when broken) */}
              <motion.div className="absolute inset-0" variants={{
                break: {
                  transition: { staggerChildren: 0.05 }
                }
              }}>
                {[0, 1, 2, 3].map((i) => {
                  const angle = (i * 90) + 45;
                  const rad = (angle * Math.PI) / 180;
                  return (
                    <motion.div
                      key={i}
                      className="absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                      style={{
                        background: 'radial-gradient(circle at 35% 35%, #8B2D3B, #5C1D24)',
                        top: '50%',
                        left: '50%',
                        x: '-50%',
                        y: '-50%',
                      }}
                      variants={{
                        break: {
                          x: Math.cos(rad) * 80,
                          y: Math.sin(rad) * 80,
                          rotate: angle * 2,
                          opacity: 0,
                          scale: 0.3,
                          transition: {
                            duration: 0.6,
                            ease: [0.22, 1, 0.36, 1],
                          },
                        },
                      }}
                    />
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ============================================================
   CURTAIN MODE — Velvet curtains part left and right
   ============================================================ */
function CurtainMode({ curtainOpen }: { curtainOpen: boolean }) {
  return (
    <div className="relative w-full h-full flex">
      {/* Gold tassel at top center */}
      <motion.div
        className="absolute top-0 left-1/2 z-20 flex flex-col items-center"
        style={{ x: '-50%' }}
        animate={curtainOpen ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="w-1 h-16 rounded-b-full"
          style={{ background: 'linear-gradient(180deg, #D4AF37, #C5A880)' }}
        />
        <div
          className="w-4 h-6 rounded-b-full"
          style={{
            background: 'radial-gradient(circle at 40% 30%, #D4AF37, #A08040)',
            boxShadow: '0 2px 8px oklch(0 0 0 / 30%)',
          }}
        />
      </motion.div>

      {/* Left curtain */}
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 z-10"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              oklch(0.30 0.06 345) 0px,
              oklch(0.25 0.05 345) 2px,
              oklch(0.28 0.055 345) 4px
            )
          `,
          borderRight: '2px solid oklch(0.72 0.12 82 / 30%)',
          boxShadow: 'inset -20px 0 40px oklch(0 0 0 / 20%)',
        }}
        animate={curtainOpen ? { x: '-100%' } : { x: '0%' }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Curtain fold highlights */}
        <div className="absolute inset-y-0 right-0 w-8"
          style={{ background: 'linear-gradient(90deg, transparent, oklch(0.35 0.07 345 / 30%))' }}
        />
      </motion.div>

      {/* Right curtain */}
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 z-10"
        style={{
          background: `
            repeating-linear-gradient(
              90deg,
              oklch(0.30 0.06 345) 0px,
              oklch(0.25 0.05 345) 2px,
              oklch(0.28 0.055 345) 4px
            )
          `,
          borderLeft: '2px solid oklch(0.72 0.12 82 / 30%)',
          boxShadow: 'inset 20px 0 40px oklch(0 0 0 / 20%)',
        }}
        animate={curtainOpen ? { x: '100%' } : { x: '0%' }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="absolute inset-y-0 left-0 w-8"
          style={{ background: 'linear-gradient(-90deg, transparent, oklch(0.35 0.07 345 / 30%))' }}
        />
      </motion.div>

      {/* Gold curtain rod */}
      <div
        className="absolute top-0 left-0 right-0 h-2 z-30"
        style={{
          background: 'linear-gradient(180deg, #D4AF37, #A08040, #D4AF37)',
          boxShadow: '0 2px 8px oklch(0 0 0 / 30%)',
        }}
      />
    </div>
  );
}
