import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ==================== HERO ANIMATIONS ====================

export const animateHeroEntrance = () => {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('.hero-headline', {
    opacity: 0,
    y: 50,
    duration: 1,
  })
    .from(
      '.hero-subheadline',
      {
        opacity: 0,
        y: 30,
        duration: 0.8,
      },
      '-=0.6'
    )
    .from(
      '.hero-cta',
      {
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        stagger: 0.2,
        ease: 'back.out(1.7)',
      },
      '-=0.4'
    );

  return tl;
};

export const animateNavbar = () => {
  gsap.from('.navbar', {
    y: -100,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
  });

  ScrollTrigger.create({
    start: 'top -100',
    end: 99999,
    toggleClass: {
      className: 'navbar-scrolled',
      targets: '.navbar',
    },
  });
};

// ==================== CARD ANIMATIONS ====================

export const animateCardsStagger = (selector, options = {}) => {
  const defaults = {
    opacity: 0,
    y: 60,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power3.out',
  };

  gsap.from(selector, {
    ...defaults,
    ...options,
    scrollTrigger: {
      trigger: selector,
      start: 'top 80%',
      toggleActions: 'play none none none',
    },
  });
};

export const setupCardHover = (cardSelector) => {
  const cards = document.querySelectorAll(cardSelector);

  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -8,
        scale: 1.02,
        duration: 0.3,
        ease: 'power2.out',
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: 'power2.inOut',
      });
    });
  });
};

// ==================== BUTTON ANIMATIONS ====================

export const setupButtonHover = (buttonSelector) => {
  const buttons = document.querySelectorAll(buttonSelector);

  buttons.forEach((btn) => {
    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out',
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.inOut',
      });
    });

    btn.addEventListener('click', () => {
      gsap.timeline()
        .to(btn, { scale: 0.95, duration: 0.1 })
        .to(btn, { scale: 1, duration: 0.2, ease: 'elastic.out(1, 0.3)' });
    });
  });
};

// ==================== WALLET CONNECTION ANIMATIONS ====================

export const animateWalletModal = (modalElement) => {
  const tl = gsap.timeline();

  tl.from(modalElement, {
    opacity: 0,
    scale: 0.9,
    y: 30,
    duration: 0.6,
    ease: 'power3.out',
  });

  return tl;
};

export const animateWalletOptions = () => {
  gsap.from('.wallet-option', {
    opacity: 0,
    x: -20,
    duration: 0.5,
    stagger: 0.1,
    ease: 'power2.out',
    delay: 0.3,
  });
};

export const animateConnectionSuccess = () => {
  const tl = gsap.timeline();

  tl.to('.wallet-options', {
    opacity: 0,
    y: -20,
    duration: 0.3,
  })
    .from('.success-indicator', {
      scale: 0,
      duration: 0.5,
      ease: 'back.out(2)',
    })
    .from(
      '.role-selection',
      {
        opacity: 0,
        y: 20,
        duration: 0.5,
        ease: 'power2.out',
      },
      '-=0.2'
    );

  return tl;
};

// ==================== FORM ANIMATIONS ====================

export const animateFormFields = () => {
  gsap.from('.form-field', {
    opacity: 0,
    x: -20,
    duration: 0.5,
    stagger: 0.1,
    ease: 'power2.out',
  });
};

export const animateDropZone = (dropZoneElement) => {
  const enter = () => {
    gsap.to(dropZoneElement, {
      scale: 1.02,
      borderColor: '#06B6D4',
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      duration: 0.3,
    });
  };

  const leave = () => {
    gsap.to(dropZoneElement, {
      scale: 1,
      borderColor: '#4B5563',
      backgroundColor: 'rgba(31, 41, 55, 0.3)',
      duration: 0.3,
    });
  };

  return { enter, leave };
};

export const animateAIBadgePulse = () => {
  gsap.fromTo(
    '.ai-badge',
    { opacity: 0.5 },
    {
      opacity: 1,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    }
  );
};

// ==================== PROCESSING ANIMATIONS ====================

export const animateProcessingModal = (modalElement) => {
  const tl = gsap.timeline();

  tl.from('.processing-overlay', {
    opacity: 0,
    duration: 0.3,
  }).from(
    modalElement,
    {
      opacity: 0,
      scale: 0.9,
      y: 20,
      duration: 0.4,
      ease: 'back.out(1.5)',
    },
    '-=0.2'
  );

  return tl;
};

export const animateProgress = (circleElement, textElement, progress) => {
  gsap.to(circleElement, {
    strokeDasharray: `${progress}, 100`,
    duration: 0.5,
    ease: 'power2.out',
  });

  gsap.to(textElement, {
    innerText: progress,
    duration: 0.5,
    snap: { innerText: 1 },
    ease: 'power2.out',
  });
};

export const animateStepActivation = (stepElement) => {
  const tl = gsap.timeline();

  // Mark previous steps as complete
  tl.to('.step.active', {
    backgroundColor: '#10B981',
    scale: 1,
    duration: 0.3,
  });

  // Activate current step
  tl.to(stepElement, {
    backgroundColor: '#06B6D4',
    scale: 1.1,
    duration: 0.4,
    ease: 'back.out(1.5)',
  }).to(stepElement, {
    scale: 1,
    duration: 0.3,
  });

  // Pulse effect
  gsap.to(stepElement, {
    boxShadow: '0 0 20px rgba(6, 182, 212, 0.6)',
    duration: 0.8,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });

  return tl;
};

export const animateSuccessTransition = (onComplete) => {
  const tl = gsap.timeline({ onComplete });

  tl.to('.progress-circle', {
    scale: 1.2,
    duration: 0.3,
  })
    .to('.progress-circle', {
      scale: 0,
      opacity: 0,
      duration: 0.3,
    })
    .from('.success-checkmark', {
      scale: 0,
      duration: 0.5,
      ease: 'back.out(2)',
    })
    .to(
      '.processing-modal',
      {
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        delay: 1,
      },
      '+=0.5'
    );

  return tl;
};

// ==================== SUCCESS PAGE ANIMATIONS ====================

export const animateSuccessBanner = () => {
  const tl = gsap.timeline();

  tl.from('.success-banner', {
    opacity: 0,
    y: -50,
    duration: 0.8,
    ease: 'power3.out',
  }).from(
    '.success-checkmark',
    {
      scale: 0,
      rotation: -180,
      duration: 0.6,
      ease: 'back.out(2)',
    },
    '-=0.4'
  );

  return tl;
};

export const animateProofCards = () => {
  gsap.from('.proof-card', {
    opacity: 0,
    y: 40,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power3.out',
    delay: 0.5,
  });
};

export const animateCopyFeedback = (element) => {
  const tl = gsap.timeline();

  tl.to(element, {
    scale: 1.2,
    duration: 0.2,
  })
    .to(element, {
      scale: 1,
      duration: 0.2,
    })
    .to(element, {
      backgroundColor: '#10B981',
      duration: 0.3,
    })
    .to(element, {
      backgroundColor: 'transparent',
      duration: 0.3,
      delay: 0.5,
    });

  return tl;
};

// ==================== PAGE TRANSITIONS ====================

export const pageTransitionIn = () => {
  gsap.from('.page-content', {
    opacity: 0,
    y: 20,
    duration: 0.6,
    ease: 'power3.out',
  });
};

export const pageTransitionOut = (onComplete) => {
  gsap.to('.page-content', {
    opacity: 0,
    y: -20,
    duration: 0.4,
    ease: 'power3.in',
    onComplete,
  });
};

// ==================== SCROLL ANIMATIONS ====================

export const setupScrollAnimations = () => {
  // Features section
  gsap.from('.feature-card', {
    scrollTrigger: {
      trigger: '.features-section',
      start: 'top 80%',
    },
    opacity: 0,
    y: 60,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power3.out',
  });

  // How it works timeline
  gsap.from('.timeline-step', {
    scrollTrigger: {
      trigger: '.how-it-works',
      start: 'top 70%',
    },
    opacity: 0,
    x: -50,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power3.out',
  });

  // Pricing cards
  gsap.from('.pricing-card', {
    scrollTrigger: {
      trigger: '.pricing-section',
      start: 'top 75%',
    },
    opacity: 0,
    y: 50,
    duration: 0.8,
    stagger: 0.2,
    ease: 'power3.out',
  });
};

// ==================== UTILITIES ====================

export const killAllAnimations = () => {
  gsap.killTweensOf('*');
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
};

export default {
  animateHeroEntrance,
  animateNavbar,
  animateCardsStagger,
  setupCardHover,
  setupButtonHover,
  animateWalletModal,
  animateWalletOptions,
  animateConnectionSuccess,
  animateFormFields,
  animateDropZone,
  animateAIBadgePulse,
  animateProcessingModal,
  animateProgress,
  animateStepActivation,
  animateSuccessTransition,
  animateSuccessBanner,
  animateProofCards,
  animateCopyFeedback,
  pageTransitionIn,
  pageTransitionOut,
  setupScrollAnimations,
  killAllAnimations,
};