/**
 * Engineering Portfolio - Main JavaScript
 * Handles animations, horizontal scroll, sliding nav, and interactions
 */

import './style.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initThreeScene, setOrbitEnabled } from './three-scene.js'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// Global state
let currentSection = 'hero'
const navIndicator = document.querySelector('.nav-indicator')
let indicatorAnimationInProgress = false
let navNavigationInProgress = false

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initThreeScene()
  initNavIndicator()
  initAnimations()
  initHorizontalScrollSections()
  initInteractions()

  // Mark body as loaded for CSS animations
  setTimeout(() => {
    document.body.classList.add('loaded')
  }, 100)
})

/**
 * Initialize sliding nav indicator
 */
function initNavIndicator() {
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)')
  const indicator = document.querySelector('.nav-indicator')

  if (!indicator || navLinks.length === 0) return

  // Set initial position (hide it initially)
  gsap.set(indicator, { width: 0, opacity: 0 })

  // Track if animation is running to prevent stacking
  let isAnimating = false

  // Handle click navigation with sliding animation
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const targetId = link.getAttribute('href').substring(1)
      const targetSection = document.getElementById(targetId)

      if (targetSection) {
        // Temporarily disable scroll-triggered updates
        navNavigationInProgress = true

        // Animate indicator to clicked link
        moveIndicatorToLink(link)

        // Only add subtle jiggle animation once (prevent stacking)
        if (!isAnimating) {
          isAnimating = true
          gsap.fromTo('.nav',
            { x: -2 },
            {
              x: 0,
              duration: 0.3,
              ease: 'power2.out',
              onComplete: () => { isAnimating = false }
            }
          )
        }

        // Smooth scroll to section
        gsap.to(window, {
          duration: 1.2,
          scrollTo: { y: targetSection, offsetY: 50 },
          ease: 'power3.inOut',
          onComplete: () => {
            // Re-enable after scroll completes
            setTimeout(() => {
              navNavigationInProgress = false
            }, 500)
          }
        })

        // Update active state
        navLinks.forEach(l => l.classList.remove('active'))
        link.classList.add('active')
      }
    })
  })

  // Update indicator on scroll - properly account for pinned horizontal scroll sections
  const sections = document.querySelectorAll('section[data-section]')

  // For pinned sections, we need to track based on visual position, not DOM position
  // The approach: use the section's visual position relative to viewport

  // Track currently active section to avoid redundant updates
  let lastActiveSection = null

  const updateNavOnScroll = () => {
    if (navNavigationInProgress) return

    const viewportCenter = window.innerHeight / 2
    let activeSection = null

    sections.forEach(section => {
      const rect = section.getBoundingClientRect()
      // A section is "active" if its top is above viewport center AND bottom is below viewport center
      if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
        activeSection = section.dataset.section
      }
    })

    // Only update if section changed
    if (activeSection && activeSection !== lastActiveSection) {
      lastActiveSection = activeSection
      updateActiveSection(activeSection, navLinks)
      // Enable orbit only on hero and contact sections
      setOrbitEnabled(activeSection === 'hero' || activeSection === 'contact')
    }
  }

  // Use scroll event for real-time tracking (works with pinned sections)
  window.addEventListener('scroll', updateNavOnScroll, { passive: true })
  // Initial check
  setTimeout(updateNavOnScroll, 100)
}

/**
 * Move indicator to a specific link with smooth animation
 */
function moveIndicatorToLink(link) {
  const indicator = document.querySelector('.nav-indicator')
  if (!indicator || indicatorAnimationInProgress) return

  indicatorAnimationInProgress = true

  // Get link's position relative to nav-links container
  const navLinks = link.closest('.nav-links')
  if (!navLinks) {
    indicatorAnimationInProgress = false
    return
  }

  const linkOffset = link.offsetLeft
  const linkWidth = link.offsetWidth

  gsap.to(indicator, {
    left: linkOffset,
    width: linkWidth,
    opacity: 1,
    duration: 0.4,
    ease: 'power3.out',
    onComplete: () => {
      indicatorAnimationInProgress = false
    }
  })
}

/**
 * Update active section based on scroll position
 */
function updateActiveSection(sectionId, navLinks) {
  // Skip if navigation is in progress
  if (navNavigationInProgress) return

  if (currentSection === sectionId) return
  currentSection = sectionId

  const activeLink = document.querySelector(`.nav-links a[data-section="${sectionId}"]`)

  if (activeLink) {
    navLinks.forEach(l => l.classList.remove('active'))
    activeLink.classList.add('active')
    moveIndicatorToLink(activeLink)
  } else {
    // No nav link for this section (e.g., hero), hide indicator
    gsap.to('.nav-indicator', {
      opacity: 0,
      duration: 0.3
    })
  }
}

/**
 * Initialize page load and scroll-triggered animations
 */
function initAnimations() {
  // Hero section entrance animations
  const heroTimeline = gsap.timeline({ delay: 0.3 })

  heroTimeline
    .fromTo('.hero-title .title-line',
      { opacity: 0, y: 60, rotationX: -15 },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 1,
        stagger: 0.15,
        ease: 'power3.out'
      }
    )
    .fromTo('.hero-subtitle',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, '-=0.5')
    .fromTo('.hero-cta',
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out'
      }, '-=0.4')
    .fromTo('.hero-metrics .metric-chip',
      { opacity: 0, y: 20, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: 'back.out(1.7)'
      }, '-=0.3')

  // Section headers scroll animation
  gsap.utils.toArray('.section-header').forEach((header) => {
    gsap.fromTo(header.children,
      { opacity: 0, y: 40, x: -20 },
      {
        opacity: 1,
        y: 0,
        x: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    )
  })

  // Contact section
  gsap.fromTo('.contact-container',
    { opacity: 0, y: 50 },
    {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.contact-section',
        start: 'top 70%'
      }
    }
  )
}

/**
 * Initialize all horizontal scroll sections
 */
function initHorizontalScrollSections() {
  // Projects horizontal scroll
  initHorizontalScroll('.projects-scroll-container', '.projects-track', '.scroll-progress-bar')

  // Experience section - animate cards on scroll (no horizontal scroll)
  initExperienceAnimations()
}

/**
 * Initialize experience section animations (vertical layout)
 */
function initExperienceAnimations() {
  const cards = document.querySelectorAll('.experience-card')

  cards.forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, x: -30, y: 20 },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.6,
        delay: i * 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%'
        }
      }
    )
  })
}

/**
 * Initialize horizontal scroll for a specific section
 */
function initHorizontalScroll(containerSelector, trackSelector, progressBarSelector) {
  const container = document.querySelector(containerSelector)
  const track = document.querySelector(trackSelector)
  const progressBar = progressBarSelector ? document.querySelector(progressBarSelector) : null

  if (!container || !track) return

  // Get cards within this track
  const cards = track.querySelectorAll('.project-card, .experience-card')

  // Calculate the total scroll width
  const getScrollWidth = () => {
    return track.scrollWidth - container.offsetWidth
  }

  // Use ScrollTrigger.matchMedia for responsive animations
  ScrollTrigger.matchMedia({
    // Desktop: Horizontal scroll animation linked to vertical scroll
    "(min-width: 769px)": function () {
      const scrollTriggerConfig = {
        trigger: container,
        start: 'top 20%',
        end: () => `+=${getScrollWidth()}`,
        scrub: 1,
        anticipatePin: 1,
        pin: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Update progress bar
          if (progressBar) {
            gsap.to(progressBar, {
              width: `${self.progress * 100}%`,
              duration: 0.1,
              ease: 'none'
            })
          }
        }
      }

      gsap.to(track, {
        x: () => -getScrollWidth(),
        ease: 'none',
        scrollTrigger: scrollTriggerConfig
      })
    },

    // Mobile: Native scroll, reset transforms
    "(max-width: 768px)": function () {
      // Clear any transform applied by desktop animation
      gsap.set(track, { clearProps: "x" });

      // Reset progress bar
      if (progressBar) {
        gsap.set(progressBar, { width: "0%" });
      }
    }
  });

  // Animate cards entrance
  if (cards.length > 0) {
    gsap.fromTo(cards,
      { opacity: 0, y: 50, scale: 0.95, x: 30 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        x: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: container,
          start: 'top 60%',
          toggleActions: 'play none none reverse'
        }
      }
    )
  }

  // Refresh ScrollTrigger on resize (but not during fullscreen)
  let resizeTimer
  window.addEventListener('resize', () => {
    // Don't refresh if in fullscreen mode (e.g., YouTube video)
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      return
    }
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 250)
  })
}

/**
 * Initialize micro-interactions
 */
function initInteractions() {
  // Import ScrollToPlugin for smooth scrolling
  gsap.registerPlugin(ScrollToPlugin)

  // Card hover effects with slide
  document.querySelectorAll('.project-card, .experience-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -12,
        scale: 1.02,
        duration: 0.4,
        ease: 'power2.out'
      })

      // Animate metrics/tags with stagger
      const chips = card.querySelectorAll('.metric-chip, .skill-tag, .tag')
      gsap.to(chips, {
        y: -3,
        duration: 0.3,
        stagger: 0.03,
        ease: 'power2.out'
      })
    })

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: 'power2.out'
      })

      const chips = card.querySelectorAll('.metric-chip, .skill-tag, .tag')
      gsap.to(chips, {
        y: 0,
        duration: 0.3,
        stagger: 0.03,
        ease: 'power2.out'
      })
    })
  })

  // Button hover effects
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, {
        scale: 1.05,
        duration: 0.3,
        ease: 'back.out(1.7)'
      })
    })

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      })
    })
  })

  // Social link hover with rotation
  document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
      gsap.to(link, {
        y: -6,
        rotation: 8,
        duration: 0.4,
        ease: 'back.out(1.7)'
      })
    })

    link.addEventListener('mouseleave', () => {
      gsap.to(link, {
        y: 0,
        rotation: 0,
        duration: 0.4,
        ease: 'power2.out'
      })
    })
  })

  // Navigation scroll effect
  let lastScroll = 0
  const nav = document.querySelector('.nav')

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset

    if (currentScroll > 100) {
      nav.style.backdropFilter = 'blur(24px)'
      nav.style.background = 'rgba(255, 255, 255, 0.5)'
    } else {
      nav.style.backdropFilter = 'blur(16px)'
      nav.style.background = 'rgba(255, 255, 255, 0.35)'
    }

    lastScroll = currentScroll
  })

  // Parallax effect for artifact SVGs
  document.querySelectorAll('.artifact-svg').forEach(svg => {
    const parent = svg.closest('.project-card')
    if (!parent) return

    parent.addEventListener('mousemove', (e) => {
      const rect = parent.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5

      gsap.to(svg, {
        x: x * 15,
        y: y * 15,
        rotationY: x * 5,
        rotationX: -y * 5,
        duration: 0.5,
        ease: 'power2.out'
      })
    })

    parent.addEventListener('mouseleave', () => {
      gsap.to(svg, {
        x: 0,
        y: 0,
        rotationY: 0,
        rotationX: 0,
        duration: 0.6,
        ease: 'power2.out'
      })
    })
  })

  // Stat items counter animation
  const statValues = document.querySelectorAll('.stat-value')
  statValues.forEach(stat => {
    const value = stat.textContent
    const numericPart = parseFloat(value)

    if (!isNaN(numericPart)) {
      ScrollTrigger.create({
        trigger: stat,
        start: 'top 80%',
        onEnter: () => {
          gsap.from(stat, {
            textContent: 0,
            duration: 1.5,
            ease: 'power2.out',
            snap: { textContent: 1 },
            onUpdate: function () {
              const current = Math.round(gsap.getProperty(stat, 'textContent'))
              stat.textContent = value.replace(numericPart, current)
            }
          })
        },
        once: true
      })
    }
  })
}

// Import ScrollToPlugin
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
gsap.registerPlugin(ScrollToPlugin)
