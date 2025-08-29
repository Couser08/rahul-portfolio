document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    const EASE = "power4.out";
    const DURATION = 1.2;

    // Responsive helper
    const isDesktop = () => window.innerWidth >= 768;

    /*=============== DYNAMIC NAVBAR STYLING (robust, handles resize) ===============*/
    const nav = document.querySelector('.nav');
    let navTrigger = null;

    const setupNavGlass = () => {
        // kill old trigger if exists
        try { if (navTrigger && typeof navTrigger.kill === 'function') navTrigger.kill(); } catch (e) { /* ignore */ }
        navTrigger = null;
        nav.classList.remove('glass-effect');

        if (isDesktop()) {
            navTrigger = ScrollTrigger.create({
                trigger: document.body,
                start: "top -50px",
                end: "bottom top",
                onEnter: () => nav.classList.add('glass-effect'),
                onLeaveBack: () => nav.classList.remove('glass-effect')
            });
        } else {
            nav.classList.add('glass-effect');
        }
    };

    setupNavGlass();

    // Debounced resize -> re-setup nav + refresh ScrollTrigger
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            setupNavGlass();
            ScrollTrigger.refresh();
        }, 150);
    });

    /*=============== INTRO ANIMATION ===============*/
    const tl = gsap.timeline({ defaults: { ease: EASE, duration: DURATION } });

    tl.from(".header", { 
        y: -100,
        opacity: 0,
        duration: 1.5
    })
    .from(".hero__title", { y: 80, opacity: 0 }, "-=.8")
    .from(".hero__subtitle", { y: 80, opacity: 0 }, "-=.9")
    .from(".hero__button", { y: 80, opacity: 0 }, "-=.9")
    .from(".hero__bg", { scale: 1.2, opacity: 0, duration: 2 }, "-=1.2");

    /*=============== SCROLL-TRIGGERED ANIMATIONS ===============*/
    const animateOnScroll = (element, vars) => {
        const node = typeof element === 'string' ? document.querySelector(element) : element;
        if (!node) return;
        gsap.from(element, {
            ...vars,
            ease: EASE,
            duration: DURATION,
            scrollTrigger: {
                trigger: element,
                start: 'top 85%',
                toggleActions: 'play none none reverse'
            }
        });
    };

    gsap.utils.toArray('.section__title').forEach(title => animateOnScroll(title, { y: 60, opacity: 0 }));

    // About Section
    animateOnScroll(".about__image", { x: -100, opacity: 0 });
    animateOnScroll(".about__data", { x: 100, opacity: 0 });

    // Skills Section (Staggered)
    gsap.from(".skills__card", {
        y: 60,
        opacity: 0,
        ease: EASE,
        duration: DURATION - 0.4,
        stagger: 0.1,
        scrollTrigger: {
            trigger: ".skills__container",
            start: "top 80%",
            toggleActions: "play none none reverse"
        }
    });

    // Projects Section (Horizontal Scroll) - store tween and reference it
    if (isDesktop()) {
        const projectsContainer = document.querySelector(".projects__container");
        const projectsCards = gsap.utils.toArray(".projects__card");

        if (projectsContainer) {
            const totalScroll = projectsContainer.scrollWidth - document.documentElement.clientWidth;
            const projectsTween = gsap.to(projectsContainer, {
                x: () => -Math.max(0, totalScroll) + "px",
                ease: "none",
                scrollTrigger: {
                    trigger: ".projects",
                    pin: true,
                    scrub: 1,
                    end: () => "+=" + totalScroll,
                    invalidateOnRefresh: true
                }
            });

            // Animate cards as they come into view horizontally (reference projectsTween)
            projectsCards.forEach(card => {
                gsap.from(card, {
                    y: 100,
                    opacity: 0,
                    ease: EASE,
                    scrollTrigger: {
                        trigger: card,
                        containerAnimation: projectsTween,
                        start: 'left 90%',
                        toggleActions: 'play none none reverse'
                    }
                });
            });
        }
    }

    // Testimonials Section (Slider)
    const testimonialsWrapper = document.querySelector(".testimonials__wrapper");
    const slides = gsap.utils.toArray(".testimonials__slide");
    let testimonialInterval;

    function setupTestimonials() {
        if (!testimonialsWrapper || !slides.length) return;
        const slideWidth = slides[0].offsetWidth;
        let currentSlide = 0;

        const animateSlides = () => {
            currentSlide = (currentSlide + 1) % slides.length;
            gsap.to(testimonialsWrapper, {
                x: -currentSlide * slideWidth,
                duration: 1.2,
                ease: "power3.inOut"
            });
        };

        if (testimonialInterval) clearInterval(testimonialInterval);
        testimonialInterval = setInterval(animateSlides, 5000);
    }

    setupTestimonials();
    window.addEventListener('resize', () => {
        // re-setup testimonials so width recalculates
        setTimeout(setupTestimonials, 120);
    });
    animateOnScroll(".testimonials__container", { y: 100, opacity: 0 });

    // Contact: reveal fields and a simple client-side validation + toast
    animateOnScroll(".contact__content", { y: 100, opacity: 0 });
    gsap.from(".contact__form-div", {
        y: 60,
        opacity: 0,
        ease: EASE,
        duration: DURATION - 0.2,
        stagger: 0.15,
        scrollTrigger: {
            trigger: ".contact__form",
            start: "top 80%",
            toggleActions: "play none none reverse"
        }
    });

    // Simple toast utility (non-blocking)
    function showToast(msg, type = 'success') {
        const t = document.createElement('div');
        t.className = `toast toast--${type}`;
        t.setAttribute('role', 'status');
        t.setAttribute('aria-live', 'polite');
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.style.opacity = '1', 10);
        setTimeout(() => {
            t.style.opacity = '0';
            setTimeout(() => t.remove(), 400);
        }, 3500);
    }

    const contactForm = document.querySelector('.contact__form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = (contactForm.name && contactForm.name.value || '').trim();
            const email = (contactForm.email && contactForm.email.value || '').trim();
            const message = (contactForm.message && contactForm.message.value || '').trim();

            if (!name || !email || !message) {
                showToast('Please complete all fields.', 'error');
                return;
            }

            // simple email validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(email)) {
                showToast('Enter a valid email address.', 'error');
                return;
            }

            // Simulate success (replace this with an actual request to your backend)
            showToast('Message sent — I will get back to you!', 'success');
            contactForm.reset();
        });
    }

    // Footer animation
    animateOnScroll(".footer__container", { y: 50, opacity: 0 });
});