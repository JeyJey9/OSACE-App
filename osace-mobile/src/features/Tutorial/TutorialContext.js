// src/features/Tutorial/TutorialContext.js
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { TUTORIAL_STEPS } from './tutorialSteps';

const TUTORIAL_STORAGE_KEY = '@app_tour_v1_completed';

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(null); // null = se încarcă
  const [isReplay, setIsReplay] = useState(false);

  // Prima rulare obligatorie (fără buton de skip)
  const isFirstRun = !isReplay && hasSeenTutorial === false;

  // Referințe stabile pentru starea curentă
  const stepIndexRef = useRef(stepIndex);
  const isActiveRef = useRef(isActive);
  const hasHandledTabSwipeRef = useRef(false);
  const hasHandledDrawerOpenRef = useRef(false);

  useEffect(() => {
    stepIndexRef.current = stepIndex;
    isActiveRef.current = isActive;
    hasHandledTabSwipeRef.current = false;
    hasHandledDrawerOpenRef.current = false;
  }, [stepIndex, isActive]);

  // Referințe către componentele țintă înregistrate
  const targetRefs = useRef({});
  // Păstrăm acțiunile de navigare primite de la MainDrawer/AppTabs
  const navActionsRef = useRef({
    openDrawer: () => {},
    closeDrawer: () => {},
    navigateToTab: () => {},
  });

  // Încarcă statusul salvat din AsyncStorage la pornire
  useEffect(() => {
    let isMounted = true;
    const loadStatus = async () => {
      try {
        const value = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
        if (isMounted) {
          setHasSeenTutorial(value === 'true');
        }
      } catch (err) {
        console.warn('[Tutorial] Eroare la citirea statusului din storage:', err);
        if (isMounted) setHasSeenTutorial(false);
      }
    };
    loadStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // Înregistrare ref componentă țintă
  const registerTarget = useCallback((name, ref) => {
    if (ref && ref.current) {
      targetRefs.current[name] = ref;
    }
  }, []);

  // Măsoară poziția țintei relativ la containerul overlay (compatibil universal: S24 Ultra, iPhone, ecrane mici)
  const measureTarget = useCallback((name, overlayRef) => {
    return new Promise((resolve) => {
      const targetRef = targetRefs.current[name];
      if (!targetRef?.current) {
        resolve(null);
        return;
      }

      const measureNode = (ref) =>
        new Promise((res) => {
          if (!ref?.current) return res(null);
          // Preferăm measureInWindow() pentru coordonate absolute de ecran garantate (iOS + Android)
          if (typeof ref.current.measureInWindow === 'function') {
            ref.current.measureInWindow((wx, wy, ww, wh) => {
              if (ww > 0 && wh > 0) {
                res({ x: wx, y: wy, width: ww, height: wh });
              } else if (typeof ref.current.measure === 'function') {
                ref.current.measure((x, y, width, height, pageX, pageY) => {
                  if (width > 0 && height > 0) {
                    res({ x: pageX ?? x, y: pageY ?? y, width, height });
                  } else {
                    res(null);
                  }
                });
              } else {
                res(null);
              }
            });
          } else if (typeof ref.current.measure === 'function') {
            ref.current.measure((x, y, width, height, pageX, pageY) => {
              if (width > 0 && height > 0) {
                res({ x: pageX ?? x, y: pageY ?? y, width, height });
              } else {
                res(null);
              }
            });
          } else {
            res(null);
          }
        });

      Promise.all([
        measureNode(targetRef),
        overlayRef ? measureNode(overlayRef) : Promise.resolve(null),
      ])
        .then(([targetLayout, overlayLayout]) => {
          if (!targetLayout) {
            resolve(null);
            return;
          }
          // Scădem offset-ul containerului overlay pentru a obține coordonate locale 100% precise
          const ox = overlayLayout?.x || 0;
          const oy = overlayLayout?.y || 0;
          resolve({
            x: targetLayout.x - ox,
            y: targetLayout.y - oy,
            width: targetLayout.width,
            height: targetLayout.height,
          });
        })
        .catch(() => resolve(null));
    });
  }, []);

  // Înregistrare comenzi de navigare
  const registerNavigation = useCallback((actions) => {
    navActionsRef.current = {
      ...navActionsRef.current,
      ...actions,
    };
  }, []);

  // Pornire tutorial
  const start = useCallback(() => {
    setIsReplay(false);
    setStepIndex(0);
    setIsActive(true);
  }, []);

  // Reluare manuală din meniul lateral
  const restart = useCallback(() => {
    setIsReplay(true);
    try {
      navActionsRef.current.closeDrawer();
      navActionsRef.current.navigateToTab('Noutăți');
    } catch {}
    setStepIndex(0);
    setIsActive(true);
  }, []);

  // Finalizare tutorial
  const finish = useCallback(async () => {
    setIsActive(false);
    setIsReplay(false);
    setStepIndex(0);
    setHasSeenTutorial(true);
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch (err) {
      console.warn('[Tutorial] Eroare la salvarea finalizării:', err);
    }
  }, []);

  // Sari peste (Skip)
  const skip = useCallback(async () => {
    try {
      navActionsRef.current.closeDrawer();
    } catch {}
    setIsActive(false);
    setIsReplay(false);
    setStepIndex(0);
    setHasSeenTutorial(true);
    try {
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    } catch (err) {
      console.warn('[Tutorial] Eroare la salvarea skip-ului:', err);
    }
  }, []);

  // Trecere la următorul pas
  const next = useCallback(() => {
    setStepIndex((prevIndex) => {
      const currentStep = TUTORIAL_STEPS[prevIndex];
      const nextIndex = prevIndex + 1;

      if (nextIndex >= TUTORIAL_STEPS.length) {
        finish();
        return 0;
      }

      // Tranzacții de navigare coordonate cu pașii:
      // Dacă am fost la Pasul 1 (avatar) -> deschidem drawer-ul pentru Pasul 2
      if (currentStep?.id === 'avatar') {
        try {
          navActionsRef.current.openDrawer();
        } catch {}
      }
      // Dacă am fost la Pasul 2 (drawer overview) -> închidem drawer-ul pentru Pasul 3
      if (currentStep?.id === 'drawer_overview') {
        try {
          navActionsRef.current.closeDrawer();
        } catch {}
      }

      return nextIndex;
    });
  }, [finish]);

  // Pasul anterior (opțional)
  const back = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  // Notificare când starea sertarului se schimbă ('open' | 'closed')
  const onDrawerStatusChange = useCallback((status) => {
    if (!isActiveRef.current) return;
    const currentStep = TUTORIAL_STEPS[stepIndexRef.current];
    if (currentStep?.advanceOn === 'drawerOpen' && status === 'open') {
      if (hasHandledDrawerOpenRef.current) return;
      hasHandledDrawerOpenRef.current = true;
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setTimeout(() => {
        try {
          navActionsRef.current.closeDrawer();
        } catch {}
        next();
      }, 700);
    }
  }, [next]);

  // Notificare când tab-ul curent se schimbă
  const onTabChange = useCallback((tabName) => {
    if (!isActiveRef.current) return;
    const currentStep = TUTORIAL_STEPS[stepIndexRef.current];
    // Numai dacă pasul cere tabSwipe și tabul este diferit de 'Noutăți'
    if (currentStep?.advanceOn === 'tabSwipe' && tabName && tabName !== 'Noutăți') {
      if (hasHandledTabSwipeRef.current) return;
      hasHandledTabSwipeRef.current = true;
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      // Lăsăm utilizatorul să vadă ecranul schimbat timp de 1.4 secunde
      setTimeout(() => {
        try {
          navActionsRef.current.navigateToTab('Noutăți');
        } catch {}
        next();
      }, 1400);
    }
  }, [next]);

  const currentStep = TUTORIAL_STEPS[stepIndex] || null;

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        isFirstRun,
        stepIndex,
        currentStep,
        totalSteps: TUTORIAL_STEPS.length,
        hasSeenTutorial,
        start,
        restart,
        next,
        back,
        skip,
        finish,
        registerTarget,
        measureTarget,
        registerNavigation,
        onDrawerStatusChange,
        onTabChange,
        navActions: navActionsRef.current,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  return context || {};
}
