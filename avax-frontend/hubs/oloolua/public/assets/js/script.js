// Mobile Navigation Toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
const navbar = document.querySelector('.navbar');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navLinks.classList.toggle('active');
        const icon = navToggle.querySelector('i');
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
            navToggle.click();
        }
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navToggle.click();
            }
        });
    });
}

// Sticky Navbar & Back to Top
const backToTop = document.createElement('button');
backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
backToTop.className = 'back-to-top';
document.body.appendChild(backToTop);

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        navbar.classList.add('scrolled');
        backToTop.classList.add('visible');
    } else {
        navbar.classList.remove('scrolled');
        backToTop.classList.remove('visible');
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animated Counter for Stats
function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + (element.textContent.includes('+') ? '+' : '');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + (element.textContent.includes('+') ? '+' : '');
        }
    }, 16);
}

// Intersection Observer for Stats Animation
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            const statItems = entry.target.querySelectorAll('.stat-item h3');

            statItems.forEach(stat => {
                const text = stat.textContent;
                const number = parseInt(text.replace(/\D/g, ''));
                animateCounter(stat, number);
            });

            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.stats');
if (statsSection) {
    statsObserver.observe(statsSection);
}

// Scroll Reveal Animation
const revealElements = document.querySelectorAll('.activity-card, .gallery-item, .stat-item');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

revealElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    revealObserver.observe(element);
});

// Navbar Background Change on Scroll
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Hide/Show navbar on scroll
    if (currentScroll > lastScroll && currentScroll > 500) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }

    lastScroll = currentScroll;
});

// Scroll Indicator Animation
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        window.scrollTo({
            top: window.innerHeight,
            behavior: 'smooth'
        });
    });

    // Animate scroll indicator
    setInterval(() => {
        scrollIndicator.style.animation = 'none';
        setTimeout(() => {
            scrollIndicator.style.animation = 'bounce 2s infinite';
        }, 10);
    }, 2000);
}

// Gallery Item Hover Effect Enhancement
document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('mouseenter', function () {
        this.querySelector('img').style.transform = 'scale(1.1)';
        this.querySelector('img').style.transition = 'transform 0.5s ease';
    });

    item.addEventListener('mouseleave', function () {
        this.querySelector('img').style.transform = 'scale(1)';
    });
});

// Activity Cards Hover Animation
document.querySelectorAll('.activity-card').forEach(card => {
    card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-10px) scale(1.02)';
        this.style.transition = 'all 0.3s ease';
        this.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
    });

    card.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0) scale(1)';
        this.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    });
});

// Form Validation and Submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        if (name && email && message) {
            // Show success message
            showNotification('Thank you! Your message has been sent successfully.', 'success');
            contactForm.reset();
        } else {
            showNotification('Please fill in all fields.', 'error');
        }
    });
}

// Newsletter Form Submission
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;

        if (email) {
            showNotification('Thank you for subscribing to our newsletter!', 'success');
            newsletterForm.reset();
        }
    });
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Parallax Effect for Hero Section
window.addEventListener('scroll', () => {
    const hero = document.querySelector('.hero');
    if (hero) {
        const scrolled = window.pageYOffset;
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Lazy Loading Images
const images = document.querySelectorAll('img[loading="lazy"]');
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.src;
            img.classList.add('loaded');
            imageObserver.unobserve(img);
        }
    });
});

images.forEach(img => imageObserver.observe(img));

// Add Active State to Current Page Navigation
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
        link.classList.add('active');
    }
});

// Button Ripple Effect
document.querySelectorAll('button, .cta-button').forEach(button => {
    button.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        this.appendChild(ripple);

        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        setTimeout(() => ripple.remove(), 600);
    });
});

// Social Links Hover Animation
document.querySelectorAll('.social-links a').forEach(link => {
    link.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-5px) rotate(10deg)';
        this.style.transition = 'all 0.3s ease';
    });

    link.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0) rotate(0)';
    });
});

// Add Loading Screen
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

// Typing Effect for Hero Text (Optional Enhancement)
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

// Scroll Progress Bar
function updateScrollProgress() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight - windowHeight;
    const scrolled = window.pageYOffset;
    const progress = (scrolled / documentHeight) * 100;

    let progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);
    }

    progressBar.style.width = progress + '%';
}

window.addEventListener('scroll', updateScrollProgress);

// Back to Top Button
const backToTopBtn = document.createElement('button');
backToTopBtn.className = 'back-to-top';
backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
backToTopBtn.style.cssText = `
    position: fixed;
    bottom: -60px;
    right: 30px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #27ae60, #229954);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.2rem;
    box-shadow: 0 5px 20px rgba(39, 174, 96, 0.4);
    transition: all 0.3s ease;
    z-index: 999;
`;

document.body.appendChild(backToTopBtn);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 500) {
        backToTopBtn.style.bottom = '30px';
    } else {
        backToTopBtn.style.bottom = '-60px';
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

backToTopBtn.addEventListener('mouseenter', function () {
    this.style.transform = 'scale(1.1) rotate(10deg)';
});

backToTopBtn.addEventListener('mouseleave', function () {
    this.style.transform = 'scale(1) rotate(0)';
});

// Animated Entrance for Sections
const sections = document.querySelectorAll('section');
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.8s ease';
        }
    });
}, { threshold: 0.1 });

sections.forEach(section => {
    sectionObserver.observe(section);
});

// Image Loading Effect
document.querySelectorAll('img').forEach(img => {
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.5s ease';

    img.addEventListener('load', function () {
        this.style.opacity = '1';
    });

    if (img.complete) {
        img.style.opacity = '1';
    }
});

// Dynamic Year in Footer
const yearElement = document.querySelector('.footer-bottom p');
if (yearElement && yearElement.textContent.includes('2024')) {
    const currentYear = new Date().getFullYear();
    yearElement.textContent = yearElement.textContent.replace('2024', currentYear);
}

// Initialize on Page Load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Oloolua Forest Website Loaded Successfully');

    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Carousel Logic
document.addEventListener('DOMContentLoaded', function () {
    const track = document.querySelector('.carousel-track');

    // Only run if carousel exists on the page
    if (!track) return;

    const slides = Array.from(track.children);
    const nextButton = document.querySelector('.next-btn');
    const prevButton = document.querySelector('.prev-btn');
    const dotsNav = document.querySelector('.carousel-nav');

    // Create dots
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.classList.add('carousel-indicator');
        if (index === 0) dot.classList.add('current-slide');
        dotsNav.appendChild(dot);
    });

    const dots = Array.from(dotsNav.children);

    // Arrange slides next to one another
    const slideWidth = slides[0].getBoundingClientRect().width;

    const setSlidePosition = (slide, index) => {
        slide.style.left = slideWidth * index + 'px';
    };
    slides.forEach(setSlidePosition);

    const moveToSlide = (track, currentSlide, targetSlide) => {
        track.style.transform = 'translateX(-' + targetSlide.style.left + ')';
        currentSlide.classList.remove('current-slide');
        targetSlide.classList.add('current-slide');
    };

    const updateDots = (currentDot, targetDot) => {
        currentDot.classList.remove('current-slide');
        targetDot.classList.add('current-slide');
    };

    // Touch Support for Mobile
    let startX = 0;
    let isDragging = false;

    track.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        isDragging = true;
    }, { passive: true });

    track.addEventListener('touchend', e => {
        if (!isDragging) return;
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;

        if (diff > 50) {
            nextButton.click();
        } else if (diff < -50) {
            prevButton.click();
        }
        isDragging = false;
    });

    // When I click left, move slides to the left
    prevButton.addEventListener('click', e => {
        const currentSlide = track.querySelector('.current-slide');
        const prevSlide = currentSlide.previousElementSibling;
        const currentDot = dotsNav.querySelector('.current-slide');
        const prevDot = currentDot.previousElementSibling;

        if (prevSlide) {
            moveToSlide(track, currentSlide, prevSlide);
            updateDots(currentDot, prevDot);
        } else {
            // Loop to last
            const lastSlide = slides[slides.length - 1];
            const lastDot = dots[dots.length - 1];
            moveToSlide(track, currentSlide, lastSlide);
            updateDots(currentDot, lastDot);
        }
    });

    // When I click right, move slides to the right
    nextButton.addEventListener('click', e => {
        const currentSlide = track.querySelector('.current-slide');
        const nextSlide = currentSlide.nextElementSibling;
        const currentDot = dotsNav.querySelector('.current-slide');
        const nextDot = currentDot.nextElementSibling;

        if (nextSlide) {
            moveToSlide(track, currentSlide, nextSlide);
            updateDots(currentDot, nextDot);
        } else {
            // Loop to first
            const firstSlide = slides[0];
            const firstDot = dots[0];
            moveToSlide(track, currentSlide, firstSlide);
            updateDots(currentDot, firstDot);
        }
    });

    // When I click the nav indicators, move to that slide
    dotsNav.addEventListener('click', e => {
        const targetDot = e.target.closest('button');

        if (!targetDot) return;

        const currentSlide = track.querySelector('.current-slide');
        const currentDot = dotsNav.querySelector('.current-slide');
        const targetIndex = dots.findIndex(dot => dot === targetDot);
        const targetSlide = slides[targetIndex];

        moveToSlide(track, currentSlide, targetSlide);
        updateDots(currentDot, targetDot);
    });

    // Resize handling to reset positions
    window.addEventListener('resize', () => {
        const newSlideWidth = slides[0].getBoundingClientRect().width;
        slides.forEach((slide, index) => {
            slide.style.left = newSlideWidth * index + 'px';
        });
        const currentSlide = track.querySelector('.current-slide');
        // re-center
        track.style.transform = 'translateX(-' + currentSlide.style.left + ')';
    });
});

// Copy Equity Paybill details to clipboard
function copyEquityDetails() {
    const text = 'Equity Paybill: 247247 | Account: 813367';
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Paybill details copied! ✅', 'success');
        }).catch(() => alert(text));
    } else {
        alert(text);
    }
}

// Pledge form handler
function handleInvestPledge(e) {
    e.preventDefault();
    const name = document.getElementById('investName').value;
    const email = document.getElementById('investEmail').value;
    const amount = document.getElementById('investAmount').value;
    showNotification(`Thank you, ${name}! We'll contact you at ${email} about your $${amount} pledge. 🌳`, 'success');
    e.target.reset();
}
