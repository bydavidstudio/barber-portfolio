/**
 * Davidos Barberos — Global helpers & shared JS
 */

// Scroll progress indicator
const scrollProgress = document.createElement('div');
scrollProgress.className = 'scroll-progress';
document.body.appendChild(scrollProgress);

window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrollPercent = (scrollTop / scrollHeight) * 100;
    scrollProgress.style.width = scrollPercent + '%';
});

// jQuery-style $ helpers
function $(sel, ctx) { return (ctx || document).querySelector(sel); }
function $$(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

// ── Loader ──
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('loaded');
        setTimeout(() => { loader.style.display = 'none'; }, 600);
    }
});

// ── Hamburger menu with Escape key ──
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu   = document.getElementById('navMenu');
    const navLinks  = $$('.nav-link');
    const backToTop = document.getElementById('backToTop');
    const navbarEl  = document.getElementById('navbar');

    function openMenu()  { navMenu.classList.add('active');  hamburger.classList.add('active');  document.body.style.overflow = 'hidden'; }
    function closeMenu() { navMenu.classList.remove('active'); hamburger.classList.remove('active'); document.body.style.overflow = ''; }
    function toggleMenu(){ navMenu.classList.toggle('active'); hamburger.classList.toggle('active'); document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : ''; }

    hamburger?.addEventListener('click', toggleMenu);

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) closeMenu();
        // Also close lightbox on Escape (handled below, but as fallback)
    });

    navLinks.forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const t = link.getAttribute('href');
            if (t.startsWith('http')) { window.open(t, '_blank'); closeMenu(); return; }
            const el = document.querySelector(t);
            if (el) window.scrollTo({ top: el.offsetTop - navFixedOffset(), behavior: 'smooth' });
            closeMenu();
        });
    });

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        navbarEl?.classList.toggle('scrolled', scrollY > 80);
        backToTop?.classList.toggle('visible', scrollY > 600);
        const sections = $$('section[id], header[id]');
        const scrollPos = scrollY + navFixedOffset();
        sections.forEach(s => {
            const id  = s.id;
            const top = s.offsetTop;
            const bh  = s.offsetHeight;
            if (scrollPos > top && scrollPos <= top + bh) {
                navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
            }
        });
    });

    backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    // ── Navbar offset helper ──
    function navFixedOffset() {
        const b = document.querySelector('.portfolio-notice');
        const h = document.getElementById('navbar');
        return (b ? b.offsetHeight : 0) + (h ? h.offsetHeight : 0) + 24;
    }

    // ── Cookie consent ──
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptCookies = document.getElementById('acceptCookies');
    if (cookieConsent && acceptCookies) {
        if (!localStorage.getItem('cookiesAccepted')) {
            setTimeout(() => cookieConsent.classList.add('visible'), 1000);
        }
        acceptCookies.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'true');
            cookieConsent.classList.remove('visible');
        });
    }

    // ── Scroll reveal ──
    const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Also reveal parent if it's a reveal-parent
                const parent = entry.target.closest('.reveal-parent');
                if (parent) parent.classList.add('revealed');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    // Observe all reveal-init elements
    $$('.reveal-init').forEach(el => revealObserver.observe(el));

    // Also reveal elements already in viewport on load
    $$('.reveal-init').forEach(el => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.8) {
            el.classList.add('revealed');
            const parent = el.closest('.reveal-parent');
            if (parent) parent.classList.add('revealed');
        }
    });

    // ── Reviews: filter only ──
    const reviewsGrid = document.getElementById('reviewsGrid');
    const toggleBtn = document.getElementById('toggleReviews');
    const allReviews = $$('.review-card', reviewsGrid);
    let sortMode = null;
    let isExpanded = false;

    // Start collapsed — show only first 4
    function applyCollapsedState() {
        allReviews.forEach((r, i) => {
            r.style.display = i < 4 ? '' : 'none';
        });
        reviewsGrid.classList.remove('expanded');
        toggleBtn.querySelector('.toggle-text').textContent = 'Zobraziť viac recenzií';
    }

    function applyExpandedState() {
        allReviews.forEach(r => { r.style.display = ''; });
        reviewsGrid.classList.add('expanded');
        toggleBtn.querySelector('.toggle-text').textContent = 'Zobraziť menej';
    }

    applyCollapsedState();

    toggleBtn?.addEventListener('click', function() {
        isExpanded = !isExpanded;
        if (isExpanded) {
            applyExpandedState();
        } else {
            applyCollapsedState();
        }
    });

    $$('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            $$('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;

            if (filter === 'worst') {
                sortMode = 'worst';
                isExpanded = true;
                applyExpandedState();
                const sorted = [...allReviews].sort(
                    (a, b) => parseFloat(a.dataset.rating) - parseFloat(b.dataset.rating)
                );
                sorted.forEach(card => reviewsGrid.appendChild(card));

            } else if (filter === 'best') {
                sortMode = 'best';
                isExpanded = true;
                applyExpandedState();
                const sorted = [...allReviews].sort(
                    (a, b) => parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating)
                );
                sorted.forEach(card => reviewsGrid.appendChild(card));

            } else {
                sortMode = null;
                isExpanded = false;
                applyCollapsedState();
            }
        });
    });

    // ── Contact form ──
    const contactForm = document.getElementById('contactForm');
    contactForm?.addEventListener('submit', e => {
        e.preventDefault();
        const btn = contactForm.querySelector('button[type=submit]');
        btn.textContent = 'Odosielam...'; btn.disabled = true;
        setTimeout(() => {
            alert('Ďakujeme za vašu správu! Ozveme sa čoskoro.');
            contactForm.reset();
            btn.textContent = 'Odoslať'; btn.disabled = false;
        }, 1500);
    });
});

// ── Current year ──
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.current-year').forEach(el => el.textContent = new Date().getFullYear());
});

// ── Lightbox for gallery ──
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

// Close lightbox on Escape
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
