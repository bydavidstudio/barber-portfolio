/**
 * Davidos Barberos — Premium motion, pin-scroll, crazy menu
 */

// Hard guarantee: gtag always exists (Silktide / other CMPs may call it early)
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function gtag() {
    try { window.dataLayer.push(arguments); } catch (e) {}
};
try { globalThis.gtag = window.gtag; } catch (e) {}


function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Cookie consent (localStorage) ──
// ── Cookie consent (localStorage + categories) ──
(function initCookieConsent() {
    const STORAGE_KEY = 'davidos_cookie_consent_v2';
    const banner = document.getElementById('cookieConsent');
    const acceptBtn = document.getElementById('acceptCookies');
    const rejectBtn = document.getElementById('rejectCookies');
    const saveBtn = document.getElementById('saveCookieSettings');
    const openSettingsBtns = [
        document.getElementById('openCookieSettings'),
        ...document.querySelectorAll('[data-open-cookie-settings]')
    ].filter(Boolean);

    const elAnalytics = document.getElementById('cookieAnalytics');
    const elFunctional = document.getElementById('cookieFunctional');
    const elMarketing = document.getElementById('cookieMarketing');

    if (!banner || !acceptBtn) return;

    const defaultConsent = () => ({
        necessary: true,
        analytics: false,
        functional: false,
        marketing: false,
        decision: null,
        timestamp: null,
        version: 2
    });

    function readConsent() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                // migrate old key if present
                const legacy = localStorage.getItem('davidos_cookie_consent_v1');
                if (!legacy) return null;
                const old = JSON.parse(legacy);
                if (!old) return null;
                return {
                    necessary: true,
                    analytics: !!(old.analytics || old.decision === 'accepted'),
                    functional: !!(old.analytics || old.decision === 'accepted'),
                    marketing: false,
                    decision: old.decision || null,
                    timestamp: old.timestamp || null,
                    version: 2
                };
            }
            const data = JSON.parse(raw);
            return {
                ...defaultConsent(),
                ...data,
                necessary: true,
                version: 2
            };
        } catch (e) {
            return null;
        }
    }

    function saveConsent(partial) {
        const payload = {
            ...defaultConsent(),
            ...partial,
            necessary: true,
            timestamp: new Date().toISOString(),
            version: 2
        };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            localStorage.setItem('cookiesAccepted', payload.analytics || payload.functional || payload.marketing ? 'true' : 'false');
        } catch (e) {
            console.warn('Cookie preference could not be saved to localStorage.', e);
        }
        return payload;
    }

    function hideBanner() {
        banner.classList.remove('visible');
        banner.setAttribute('hidden', '');
        banner.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cookie-open');
    }

    function showBanner() {
        syncUIFromConsent(readConsent() || defaultConsent());
        banner.removeAttribute('hidden');
        banner.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cookie-open');
        setTimeout(() => banner.classList.add('visible'), 40);
    }

    function syncUIFromConsent(consent) {
        if (elAnalytics) elAnalytics.checked = !!consent.analytics;
        if (elFunctional) elFunctional.checked = !!consent.functional;
        if (elMarketing) elMarketing.checked = !!consent.marketing;
    }

    function getUISelection(decision) {
        return {
            necessary: true,
            analytics: !!(elAnalytics && elAnalytics.checked),
            functional: !!(elFunctional && elFunctional.checked),
            marketing: !!(elMarketing && elMarketing.checked),
            decision: decision || 'custom'
        };
    }

    function loadGoogleAnalytics() {
        if (window.__gaLoaded) return;
        const gaId = window.__GA_ID || 'G-TYVZKNP1XL';

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag(){ try { window.dataLayer.push(arguments); } catch (e) {} }; try { globalThis.gtag = window.gtag; } catch (e) {}
        window.gtag('consent', 'update', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'granted'
        });

        const s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
        s.onload = () => {
            window.gtag('js', new Date());
            window.gtag('config', gaId, { anonymize_ip: true });
            window.__gaLoaded = true;
        };
        document.head.appendChild(s);
    }

    function enableFunctionalEmbeds() {
        // Reveal/activate third-party embeds that require functional consent
        document.querySelectorAll('iframe[data-consent="functional"]').forEach((frame) => {
            const src = frame.getAttribute('data-src');
            if (src && (!frame.getAttribute('src') || frame.getAttribute('src') === 'about:blank')) {
                frame.setAttribute('src', src);
            }
            frame.classList.add('consent-enabled');
        });
        document.querySelectorAll('[data-requires-consent="functional"]').forEach((el) => {
            el.classList.add('consent-enabled');
            el.removeAttribute('hidden');
        });
        document.body.classList.add('consent-functional');
    }

    function disableFunctionalEmbeds() {
        document.querySelectorAll('iframe[data-consent="functional"]').forEach((frame) => {
            if (!frame.getAttribute('data-src')) {
                const current = frame.getAttribute('src');
                if (current) frame.setAttribute('data-src', current);
            }
            frame.setAttribute('src', 'about:blank');
            frame.classList.remove('consent-enabled');
        });
        document.body.classList.remove('consent-functional');
    }

    function applyConsent(consent) {
        if (!consent) return;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag(){ try { window.dataLayer.push(arguments); } catch (e) {} }; try { globalThis.gtag = window.gtag; } catch (e) {}

        window.gtag('consent', 'update', {
            analytics_storage: consent.analytics ? 'granted' : 'denied',
            ad_storage: consent.marketing ? 'granted' : 'denied',
            ad_user_data: consent.marketing ? 'granted' : 'denied',
            ad_personalization: consent.marketing ? 'granted' : 'denied'
        });

        if (consent.analytics) loadGoogleAnalytics();

        if (consent.functional) enableFunctionalEmbeds();
        else disableFunctionalEmbeds();

        // Marketing hooks (Meta Pixel / Ads) can be added later when IDs exist
        if (consent.marketing) {
            document.body.classList.add('consent-marketing');
        } else {
            document.body.classList.remove('consent-marketing');
        }

        document.body.classList.toggle('consent-analytics', !!consent.analytics);
        window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: consent }));
    }

    // Default deny until decision
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag(){ try { window.dataLayer.push(arguments); } catch (e) {} }; try { globalThis.gtag = window.gtag; } catch (e) {}
    window.gtag('consent', 'default', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
        wait_for_update: 500
    });

    // Start with functional embeds locked if marked
    disableFunctionalEmbeds();

    const existing = readConsent();
    if (existing && existing.decision) {
        hideBanner();
        syncUIFromConsent(existing);
        applyConsent(existing);
    } else {
        setTimeout(showBanner, 700);
    }

    acceptBtn.addEventListener('click', () => {
        if (elAnalytics) elAnalytics.checked = true;
        if (elFunctional) elFunctional.checked = true;
        if (elMarketing) elMarketing.checked = true;
        const consent = saveConsent({
            analytics: true,
            functional: true,
            marketing: true,
            decision: 'accepted'
        });
        hideBanner();
        applyConsent(consent);
    });

    if (rejectBtn) {
        rejectBtn.addEventListener('click', () => {
            if (elAnalytics) elAnalytics.checked = false;
            if (elFunctional) elFunctional.checked = false;
            if (elMarketing) elMarketing.checked = false;
            const consent = saveConsent({
                analytics: false,
                functional: false,
                marketing: false,
                decision: 'rejected'
            });
            hideBanner();
            applyConsent(consent);
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const selection = getUISelection('custom');
            const consent = saveConsent(selection);
            hideBanner();
            applyConsent(consent);
        });
    }

    openSettingsBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            showBanner();
        });
    });

    window.getCookieConsent = readConsent;
    window.openCookieSettings = showBanner;
    window.resetCookieConsent = function() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem('davidos_cookie_consent_v1');
            localStorage.removeItem('cookiesAccepted');
        } catch (e) {}
        showBanner();
    };
})();

const isMobile = () => window.innerWidth <= 768;

// ── Scroll progress ──
const scrollProgress = document.createElement('div');
scrollProgress.className = 'scroll-progress';
document.body.appendChild(scrollProgress);

// ── Loader (luxury barber intro) ──
(function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;

    const fill = document.getElementById('loaderBarFill');
    const percentEl = document.getElementById('loaderPercent');
    const statusEl = document.getElementById('loaderStatus');
    const arc = document.getElementById('loaderArc');
    const sparklesHost = document.getElementById('loaderSparkles');
    const statuses = [
        'Pripravujeme kreslo…',
        'Brúsime nožnice…',
        'Ladenie detailov…',
        'Takmer hotovo…',
        'Vitajte'
    ];

    // Arc circumference for r=82
    const ARC = 2 * Math.PI * 82;
    if (arc) {
        arc.style.strokeDasharray = String(ARC);
        arc.style.strokeDashoffset = String(ARC);
    }

    // Lightweight gold sparkles in loader background
    if (sparklesHost && !prefersReducedMotion) {
        const count = 14;
        for (let i = 0; i < count; i++) {
            const s = document.createElement('span');
            s.className = 'loader-spark';
            s.style.left = Math.random() * 100 + '%';
            s.style.top = Math.random() * 100 + '%';
            s.style.animationDelay = (Math.random() * 3) + 's';
            s.style.animationDuration = (3.5 + Math.random() * 3.5) + 's';
            sparklesHost.appendChild(s);
        }
    }

    let progress = 0;
    let loaded = false;
    let finished = false;
    let statusIdx = 0;

    function setProgress(p) {
        progress = Math.max(0, Math.min(100, p));
        const rounded = Math.floor(progress);
        if (fill) fill.style.width = progress + '%';
        if (percentEl) percentEl.textContent = rounded + '%';
        if (arc) arc.style.strokeDashoffset = String(ARC * (1 - progress / 100));

        // Move bar glow with progress
        const glow = loader.querySelector('.loader-bar-glow');
        if (glow) {
            glow.style.left = progress + '%';
            glow.style.opacity = progress > 2 && progress < 98 ? '1' : '0';
        }

        const next =
            progress >= 100 ? 4 :
            progress > 80 ? 3 :
            progress > 55 ? 2 :
            progress > 25 ? 1 : 0;

        if (next !== statusIdx && statusEl) {
            statusIdx = next;
            statusEl.classList.remove('is-swap');
            void statusEl.offsetWidth;
            statusEl.classList.add('is-swap');
            statusEl.textContent = statuses[statusIdx];
        }
    }

    const tick = setInterval(() => {
        if (finished) return;

        if (loaded) {
            setProgress(progress + Math.max(2.5, (100 - progress) * 0.2));
        } else {
            const step = progress < 55
                ? (Math.random() * 1.5 + 0.5)
                : (Math.random() * 0.35 + 0.12);
            setProgress(Math.min(progress + step, 86));
        }

        if (progress >= 100) {
            finished = true;
            clearInterval(tick);
            setProgress(100);
            loader.classList.add('loader-ready');
            // one last snip burst
            const scissors = document.getElementById('loaderScissors');
            if (scissors) scissors.classList.add('snip-final');
            setTimeout(() => {
                loader.classList.add('loaded');
                setTimeout(() => { loader.style.display = 'none'; }, 1100);
            }, 480);
        }
    }, 38);

    window.addEventListener('load', () => { loaded = true; });
})();

// Background is pure CSS (.site-bg in HTML) — no heavy canvas/JS layers
function createBgLayers() {
    // Remove any leftover legacy BG nodes from older versions
    document.querySelectorAll('.bg-atmosphere, #particleCanvas, .bg-orbs, .bg-aurora, .bg-beams, .noise-overlay')
        .forEach((el) => el.remove());
}

function initParticleCanvas() {
    // disabled for performance — CSS background handles ambience
    document.getElementById('particleCanvas')?.remove();
}

// ── Hero particles ──
function createHeroParticles() {
    if (prefersReducedMotion) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;

    let container = hero.querySelector('.hero-particles');
    if (!container) {
        container = document.createElement('div');
        container.className = 'hero-particles';
        container.setAttribute('aria-hidden', 'true');
        hero.appendChild(container);
    }

    const count = isMobile() ? 6 : 12;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'hero-particle';
        p.style.left = Math.random() * 100 + '%';
        p.style.bottom = Math.random() * 25 + '%';
        p.style.animationDuration = (7 + Math.random() * 16) + 's';
        p.style.animationDelay = (Math.random() * 12) + 's';
        const size = 2 + Math.random() * 3.5;
        p.style.width = p.style.height = size + 'px';
        container.appendChild(p);
    }
}

function setupHeroParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    let bg = hero.querySelector('.hero-bg');
    if (!bg) {
        bg = document.createElement('div');
        bg.className = 'hero-bg';
        bg.setAttribute('aria-hidden', 'true');
        hero.insertBefore(bg, hero.firstChild);
        hero.style.background = 'none';
    }
}

// Marquee removed (user request)

// ── Parallax engine ──
function initParallax() {
    if (prefersReducedMotion) return;

    const heroBg = document.querySelector('.hero-bg');
    const heroContent = document.querySelector('.hero-content');
    const orbs = $$('.bg-orb');
    let ticking = false;

    function update() {
        const scrollY = window.scrollY || window.pageYOffset;
        const vh = window.innerHeight;

        if (heroBg) {
            const hero = document.querySelector('.hero');
            const heroH = hero ? hero.offsetHeight : vh;
            if (scrollY < heroH + 120) {
                const mobile = window.innerWidth <= 768;
                // Gentle parallax so subject stays visible under fixed header
                const y = scrollY * (mobile ? 0.18 : 0.28);
                const baseScale = mobile ? 1.12 : 1.06;
                const scale = baseScale + scrollY * 0.00004;
                heroBg.dataset.baseY = y;
                heroBg.dataset.baseScale = Math.min(scale, mobile ? 1.18 : 1.12);
                if (!heroBg.dataset.mouseActive) {
                    heroBg.style.transform = `translate3d(0, ${y}px, 0) scale(${heroBg.dataset.baseScale})`;
                }
            }
        }

        if (heroContent && scrollY < vh) {
            // Mobile: keep hero text stable (no fast fade / drift)
            if (window.innerWidth <= 768) {
                heroContent.style.transform = '';
                heroContent.style.opacity = '1';
            } else {
                const progress = Math.min(scrollY / (vh * 0.65), 1);
                const y = scrollY * 0.18;
                const opacity = 1 - progress * 0.85;
                heroContent.style.transform = `translate3d(0, ${y}px, 0)`;
                heroContent.style.opacity = String(Math.max(opacity, 0));
            }
        }

        orbs.forEach((orb) => {
            const speed = parseFloat(orb.dataset.speed) || 0.1;
            const y = scrollY * speed;
            const x = Math.sin(scrollY * 0.0012 + speed * 12) * 20;
            orb.style.transform = `translate3d(${x}px, ${y * 0.55}px, 0)`;
        });

        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        scrollProgress.style.width = (scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0) + '%';
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
}

function initMouseParallax() {
    if (prefersReducedMotion || window.innerWidth < 1024) return;

    const hero = document.querySelector('.hero');
    const heroBg = document.querySelector('.hero-bg');
    if (!hero || !heroBg) return;

    let mx = 0, my = 0, tx = 0, ty = 0;

    hero.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        heroBg.dataset.mouseActive = '1';
        if (hero.__queueMouse) hero.__queueMouse();
    }, { passive: true });

    hero.addEventListener('mouseleave', () => {
        mx = 0; my = 0;
        setTimeout(() => { delete heroBg.dataset.mouseActive; }, 400);
        if (hero.__queueMouse) hero.__queueMouse();
    });

    let mouseRaf = null;
    function animateMouse() {
        mouseRaf = null;
        tx += (mx - tx) * 0.05;
        ty += (my - ty) * 0.05;
        const y = parseFloat(heroBg.dataset.baseY || 0);
        const scale = parseFloat(heroBg.dataset.baseScale || 1.06);
        heroBg.style.transform = `translate3d(${tx * 12}px, ${y + ty * 8}px, 0) scale(${scale})`;
        // continue only while still catching up
        if (Math.abs(mx - tx) > 0.002 || Math.abs(my - ty) > 0.002) {
            mouseRaf = requestAnimationFrame(animateMouse);
        }
    }
    function queueMouse() {
        if (!mouseRaf) mouseRaf = requestAnimationFrame(animateMouse);
    }
    // hook into existing mousemove/leave by wrapping later if needed
    hero.__queueMouse = queueMouse;
}

// ── PIN SCROLL — sticky side + scrolling story ──
function initPinScroll() {
    const pinSection = document.getElementById('aboutPin');
    if (!pinSection) return;

    const steps = $$('.pin-step', pinSection);
    const ringFill = pinSection.querySelector('.ring-fill');
    const stickyImg = pinSection.querySelector('.pin-image-frame img');
    const caption = pinSection.querySelector('.pin-caption');

    if (!steps.length) return;

    // On mobile / reduced motion: all steps visible
    if (prefersReducedMotion || isMobile()) {
        steps.forEach((s) => s.classList.add('is-active'));
        if (ringFill) ringFill.style.strokeDashoffset = '0';
        return;
    }

    const CIRC = 2 * Math.PI * 46; // ~289
    if (ringFill) {
        ringFill.style.strokeDasharray = String(CIRC);
        ringFill.style.strokeDashoffset = String(CIRC);
    }

    let ticking = false;

    function updatePin() {
        const rect = pinSection.getBoundingClientRect();
        const sectionH = pinSection.offsetHeight;
        const vh = window.innerHeight;

        // Progress through the pin section (0 → 1)
        // When top hits sticky start → 0; when bottom leaves viewport → 1
        const scrollable = sectionH - vh;
        const scrolled = -rect.top;
        let progress = scrollable > 0 ? scrolled / scrollable : 0;
        progress = Math.max(0, Math.min(1, progress));

        // Ring
        if (ringFill) {
            ringFill.style.strokeDashoffset = String(CIRC * (1 - progress));
        }

        // Image scale / brightness based on progress
        if (stickyImg) {
            const scale = 1 + progress * 0.06;
            const bright = 0.92 + progress * 0.1;
            stickyImg.style.transform = `scale(${scale})`;
            stickyImg.style.filter = `saturate(${1 + progress * 0.15}) brightness(${bright}) contrast(1.05)`;
        }

        if (caption) {
            caption.style.opacity = String(0.7 - progress * 0.5);
        }

        // Activate steps based on which is most in view
        steps.forEach((step, i) => {
            const sRect = step.getBoundingClientRect();
            const mid = sRect.top + sRect.height / 2;
            const viewMid = vh * 0.48;
            const dist = Math.abs(mid - viewMid);
            const threshold = vh * 0.38;

            step.classList.remove('is-active', 'is-passed');

            if (mid < viewMid - threshold * 0.3) {
                step.classList.add('is-passed');
            } else if (dist < threshold) {
                step.classList.add('is-active');
            }
        });

        // Ensure at least first active when entering
        if (progress < 0.05) {
            steps.forEach((s) => s.classList.remove('is-active', 'is-passed'));
            steps[0]?.classList.add('is-active');
        }
        if (progress > 0.95) {
            steps.forEach((s) => {
                s.classList.remove('is-active');
                s.classList.add('is-passed');
            });
            steps[steps.length - 1]?.classList.add('is-active');
            steps[steps.length - 1]?.classList.remove('is-passed');
        }

        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updatePin);
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
        // Re-init behaviour if crossing mobile breakpoint
        if (isMobile()) {
            steps.forEach((s) => {
                s.classList.add('is-active');
                s.classList.remove('is-passed');
            });
        } else {
            updatePin();
        }
    }, { passive: true });

    updatePin();
}

// ── Scroll reveal ──
function initScrollReveal() {
    $$('.gallery-item').forEach((el) => {
        if (!el.classList.contains('reveal-target') && !el.classList.contains('reveal-scale')) {
            el.classList.add('reveal-target');
        }
    });

    $$('.price-category').forEach((el) => {
        if (!el.classList.contains('reveal-target')) el.classList.add('reveal-target');
    });

    $$('.instagram-post, .map-container, .contact-form-container, .calendly-inline, .booqme-inline, .info-item').forEach((el) => {
        if (!el.classList.contains('reveal-target')) el.classList.add('reveal-target');
    });

    if (prefersReducedMotion) {
        $$('.reveal-init, .reveal-target, .reveal-left, .reveal-right, .reveal-scale, .section-header, .pin-step')
            .forEach((el) => el.classList.add('revealed', 'is-active'));
        return;
    }

    const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                const parent = entry.target.closest('.reveal-parent');
                if (parent) parent.classList.add('revealed');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });

    const targets = $$('.reveal-init, .reveal-target, .reveal-left, .reveal-right, .reveal-scale, .section-header');
    targets.forEach((el) => revealObserver.observe(el));

    targets.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.85) {
            el.classList.add('revealed');
        }
    });
}

// ── Card tilt (desktop) ──
function initCardTilt() {
    if (prefersReducedMotion || window.innerWidth < 1024) return;

    $$('.barber-card, .review-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

function initMagneticButtons() {
    if (prefersReducedMotion || window.innerWidth < 1024) return;

    $$('.btn-primary, .back-to-top').forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.22}px, ${y * 0.28}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

// ── BARBER HAMBURGER MENU — smooth scissors ──
function spawnSparkles() {
    const host = document.getElementById('menuSparkles');
    if (!host) return;
    host.innerHTML = '';
    // Soft sparks near top-right scissors
    const count = 7;
    for (let i = 0; i < count; i++) {
        const s = document.createElement('span');
        s.className = 'menu-sparkle';
        s.style.left = (68 + Math.random() * 22) + '%';
        s.style.top = (8 + Math.random() * 16) + '%';
        s.style.animationDelay = (0.18 + i * 0.06) + 's';
        s.style.setProperty('--sx', (Math.random() * 36 - 10) + 'px');
        s.style.setProperty('--sy', (40 + Math.random() * 70) + 'px');
        host.appendChild(s);
    }
}

function restartAnim(el) {
    if (!el) return;
    el.style.animation = 'none';
    // force reflow once
    void el.offsetWidth;
    el.style.animation = '';
}

function initMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const overlay = document.getElementById('menuOverlay');
    if (!hamburger || !navMenu) return;

    let isOpen = false;
    let isAnimating = false;

    function openMenu() {
        if (isOpen || isAnimating) return;
        isAnimating = true;
        isOpen = true;

        document.body.classList.remove('menu-closing');
        document.body.classList.add('menu-open');
        document.body.style.overflow = 'hidden';

        hamburger.classList.remove('closing');
        hamburger.classList.add('active');
        hamburger.setAttribute('aria-expanded', 'true');
        if (overlay) overlay.setAttribute('aria-hidden', 'false');
        navMenu.classList.add('active');

        const scissors = document.getElementById('menuScissors');
        restartAnim(scissors);
        // restart blade keyframes
        $$('.blade', scissors || document).forEach(restartAnim);

        spawnSparkles();
        void navMenu.offsetWidth;

        setTimeout(() => { isAnimating = false; }, 850);
    }

    function closeMenu() {
        if (!isOpen || isAnimating) return;
        isAnimating = true;

        document.body.classList.add('menu-closing');
        document.body.classList.remove('menu-open');
        hamburger.classList.add('closing');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');

        setTimeout(() => {
            navMenu.classList.remove('active');
            document.body.classList.remove('menu-closing');
            document.body.style.overflow = '';
            hamburger.classList.remove('closing');
            if (overlay) overlay.setAttribute('aria-hidden', 'true');
            const host = document.getElementById('menuSparkles');
            if (host) host.innerHTML = '';
            isOpen = false;
            isAnimating = false;
        }, 580);
    }

    function toggleMenu() {
        if (isOpen) closeMenu();
        else openMenu();
    }

    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    overlay?.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('menu-overlay-bg')) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) closeMenu();
    });

    window.__closeMenu = closeMenu;
    window.__isMenuOpen = () => isOpen;
}

// ── Main ──
document.addEventListener('DOMContentLoaded', function () {
    createBgLayers();
// Content-visibility boost for offscreen sections (no visual change)
document.querySelectorAll('section.section, .footer').forEach((el) => {
    el.classList.add('cv-auto');
});
 // cleans legacy heavy BG layers
    setupHeroParallax();
    createHeroParticles();
    initParallax();
    initMouseParallax();
    initScrollReveal();
    initPinScroll();
    initMagneticButtons();
    initCardTilt();
    initMenu();

    const navLinks = $$('.nav-link');
    const backToTop = document.getElementById('backToTop');
    const navbarEl = document.getElementById('navbar');

    function navFixedOffset() {
        const b = document.querySelector('.portfolio-notice');
        const h = document.getElementById('navbar');
        return (b ? b.offsetHeight : 0) + (h ? h.offsetHeight : 0) + 24;
    }

    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            const t = link.getAttribute('href');
            if (!t) return;

            if (t.startsWith('http')) {
                // allow normal new tab / default for external
                if (window.__closeMenu) window.__closeMenu();
                return;
            }

            e.preventDefault();
            const el = document.querySelector(t);
            if (window.__closeMenu) window.__closeMenu();
            setTimeout(() => {
                if (el) window.scrollTo({ top: el.offsetTop - navFixedOffset(), behavior: 'smooth' });
            }, window.__isMenuOpen && window.__isMenuOpen() ? 420 : 0);
        });
    });

    const scrollInd = document.querySelector('.scroll-indicator');
    scrollInd?.addEventListener('click', () => {
        const next = document.querySelector('#pricing') || document.querySelector('.section');
        if (next) window.scrollTo({ top: next.offsetTop - navFixedOffset(), behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        navbarEl?.classList.toggle('scrolled', scrollY > 80);
        backToTop?.classList.toggle('visible', scrollY > 600);
        const sections = $$('section[id], header[id]');
        const scrollPos = scrollY + navFixedOffset();
        sections.forEach((s) => {
            const id = s.id;
            const top = s.offsetTop;
            const bh = s.offsetHeight;
            if (scrollPos > top && scrollPos <= top + bh) {
                navLinks.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
            }
        });
    }, { passive: true });

    backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // Cookie consent is initialized globally below (localStorage-based)

    // Reviews
    const reviewsGrid = document.getElementById('reviewsGrid');
    const toggleBtn = document.getElementById('toggleReviews');
    const allReviews = reviewsGrid ? $$('.review-card', reviewsGrid) : [];
    let isExpanded = false;

    function applyCollapsedState() {
        if (!reviewsGrid || !toggleBtn) return;
        allReviews.forEach((r, i) => { r.style.display = i < 4 ? '' : 'none'; });
        reviewsGrid.classList.remove('expanded');
        const text = toggleBtn.querySelector('.toggle-text');
        if (text) text.textContent = 'Zobraziť viac recenzií';
    }

    function applyExpandedState() {
        if (!reviewsGrid || !toggleBtn) return;
        allReviews.forEach((r) => { r.style.display = ''; });
        reviewsGrid.classList.add('expanded');
        const text = toggleBtn.querySelector('.toggle-text');
        if (text) text.textContent = 'Zobraziť menej';
    }

    if (allReviews.length) applyCollapsedState();

    toggleBtn?.addEventListener('click', function () {
        isExpanded = !isExpanded;
        if (isExpanded) applyExpandedState();
        else applyCollapsedState();
    });

    $$('.filter-btn').forEach((btn) => {
        btn.addEventListener('click', function () {
            $$('.filter-btn').forEach((b) => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;

            if (filter === 'worst') {
                isExpanded = true;
                applyExpandedState();
                [...allReviews]
                    .sort((a, b) => parseFloat(a.dataset.rating) - parseFloat(b.dataset.rating))
                    .forEach((card) => reviewsGrid.appendChild(card));
            } else if (filter === 'best') {
                isExpanded = true;
                applyExpandedState();
                [...allReviews]
                    .sort((a, b) => parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating))
                    .forEach((card) => reviewsGrid.appendChild(card));
            } else {
                isExpanded = false;
                applyCollapsedState();
            }
        });
    });

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const formAction = contactForm.getAttribute('action');
        if (formAction && (formAction.includes('formspree.io') || formAction.includes('formsubmit.co'))) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const btn = contactForm.querySelector('button[type=submit]');
                btn.textContent = 'Odosielam...';
                btn.disabled = true;
                fetch(formAction, {
                    method: 'POST',
                    body: new FormData(contactForm),
                    headers: { Accept: 'application/json' }
                })
                    .then((response) => {
                        if (response.ok) {
                            alert('Ďakujeme za vašu správu! Ozveme sa čoskoro.');
                            contactForm.reset();
                        } else {
                            alert('Chyba pri odosielaní. Skúste neskôr.');
                        }
                    })
                    .catch(() => alert('Chyba pri odosielaní. Skúste neskôr.'))
                    .finally(() => {
                        btn.textContent = 'Odoslať';
                        btn.disabled = false;
                    });
            });
        } else {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const btn = contactForm.querySelector('button[type=submit]');
                btn.textContent = 'Odosielam...';
                btn.disabled = true;
                setTimeout(() => {
                    alert('Ďakujeme za vašu správu! Ozveme sa čoskoro.');
                    contactForm.reset();
                    btn.textContent = 'Odoslať';
                    btn.disabled = false;
                }, 1500);
            });
        }
    }

    document.querySelectorAll('.current-year').forEach((el) => {
        el.textContent = new Date().getFullYear();
    });
});

// ── Lightbox ──
document.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (!item) return;
    const img = item.querySelector('img');
    if (!img) return;

    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox active';
    lightbox.innerHTML = `
        <button class="lightbox-close" aria-label="Zatvoriť">&times;</button>
        <img src="${img.src}" alt="${img.alt}">
    `;
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';

    const close = () => {
        lightbox.classList.remove('active');
        setTimeout(() => lightbox.remove(), 300);
        document.body.style.overflow = '';
    };

    lightbox.querySelector('.lightbox-close').addEventListener('click', close);
    lightbox.addEventListener('click', (ev) => ev.target === lightbox && close());
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const lb = document.querySelector('.lightbox.active');
        if (lb) {
            lb.classList.remove('active');
            setTimeout(() => lb.remove(), 300);
            document.body.style.overflow = '';
        }
    }
});

// ── Booqme booking embed (requires functional cookies) ──
window.addEventListener('load', () => {
    const host = document.getElementById('booqmeInline') || document.getElementById('calendlyInline');
    if (!host) return;

    const BOOQME_URL = 'https://booqme.sk/sk/rezervacia/davidos-barberos';
    const placeholder = host.querySelector('.booqme-placeholder, .calendly-placeholder');
    const fallback = document.querySelector('.booqme-fallback');

    function hasFunctionalConsent() {
        const c = (window.getCookieConsent && window.getCookieConsent()) || null;
        return !!(c && c.functional);
    }

    function ensureIframe() {
        let iframe = host.querySelector('iframe.booqme-frame');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.className = 'booqme-frame';
            iframe.title = 'Booqme rezervácia — Davidos Barberos';
            iframe.width = '100%';
            iframe.height = '780';
            iframe.loading = 'lazy';
            iframe.referrerPolicy = 'no-referrer-when-downgrade';
            iframe.setAttribute('allow', 'payment *; clipboard-write');
            iframe.setAttribute('data-consent', 'functional');
            iframe.setAttribute('data-src', BOOQME_URL);
            iframe.src = 'about:blank';
            iframe.style.display = 'none';
            iframe.style.border = '0';
            iframe.style.borderRadius = '12px';
            iframe.style.minHeight = '720px';
            iframe.style.background = '#111';
            host.appendChild(iframe);
        }
        return iframe;
    }

    function showConsentNeeded() {
        const iframe = host.querySelector('iframe.booqme-frame');
        if (iframe) {
            iframe.style.display = 'none';
            iframe.src = 'about:blank';
        }
        if (placeholder) {
            placeholder.innerHTML = `
                <i class="fas fa-shield-alt"></i>
                <p>Booqme rezervácia sa načíta po povolení <strong>funkčných cookies</strong>.</p>
                <button type="button" class="btn-primary" data-open-cookie-settings>Nastavenia cookies</button>
            `;
            placeholder.style.display = 'flex';
            placeholder.querySelector('[data-open-cookie-settings]')?.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.openCookieSettings) window.openCookieSettings();
            });
        }
        if (fallback) fallback.classList.add('is-visible');
    }

    function mountBooqme() {
        const iframe = ensureIframe();
        let loaded = false;

        const onLoad = () => {
            loaded = true;
            if (placeholder) placeholder.style.display = 'none';
            iframe.style.display = 'block';
            if (fallback) fallback.classList.add('is-visible');
        };

        iframe.addEventListener('load', onLoad, { once: true });
        iframe.src = BOOQME_URL;

        setTimeout(() => {
            if (!loaded) {
                if (placeholder) {
                    placeholder.innerHTML = `
                        <i class="fas fa-calendar-check"></i>
                        <p>Rezerváciu otvoríte priamo v Booqme</p>
                    `;
                    placeholder.style.display = 'flex';
                }
                if (fallback) fallback.classList.add('is-visible');
            }
        }, 4000);
    }

    function refresh() {
        if (hasFunctionalConsent()) mountBooqme();
        else showConsentNeeded();
    }

    refresh();
    window.addEventListener('cookie-consent-updated', refresh);
});

// Open cookie settings from any dynamic button
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-cookie-settings]');
    if (!btn) return;
    e.preventDefault();
    if (window.openCookieSettings) window.openCookieSettings();
});


// Build real mailto links without Cloudflare email-obfuscation artifacts
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a.js-email[data-user][data-domain]').forEach((a) => {
        const user = a.getAttribute('data-user') || '';
        const domain = a.getAttribute('data-domain') || '';
        if (!user || !domain) return;
        const email = user + '@' + domain;
        a.setAttribute('href', 'mailto:' + email);
        if (!a.textContent.trim() || a.textContent.includes('@')) {
            a.textContent = email;
        }
    });
});

// Silence known local 404s from Cloudflare injected paths when developing offline
window.addEventListener('error', (e) => {
    const src = (e && e.target && (e.target.src || e.target.href)) || '';
    if (typeof src === 'string' && src.includes('/cdn-cgi/')) {
        e.preventDefault?.();
        e.stopPropagation?.();
        return true;
    }
}, true);
