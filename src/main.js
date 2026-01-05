/**
 * Engineering Portfolio - Main JavaScript
 * Handles animations, horizontal scroll, and interactions
 */

import './style.css'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { initThreeScene } from './three-scene.js'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initThreeScene()
  initAnimations()
  initHorizontalScroll()
  initInteractions()

  // Mark body as loaded for CSS animations
  setTimeout(() => {
    document.body.classList.add('loaded')
  }, 100)
})

/**
 * Initialize page load and scroll-triggered animations
 */
function initAnimations() {
  // Hero section entrance animations
  const heroTimeline = gsap.timeline({ delay: 0.3 })

  heroTimeline
    .to('.hero-title .title-line', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out',
      from: { y: 60 }
    })
    .to('.hero-subtitle', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out',
      from: { y: 30 }
    }, '-=0.4')
    .to('.hero-cta', {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out',
      from: { y: 20 }
    }, '-=0.3')
    .to('.hero-metrics .metric-chip', {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      stagger: 0.1,
      ease: 'back.out(1.7)',
      from: { y: 20, scale: 0.9 }
    }, '-=0.3')

  // Section headers scroll animation
  gsap.utils.toArray('.section-label, .section-title, .section-description').forEach((el) => {
    gsap.fromTo(el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      }
    )
  })

  // About section
  gsap.fromTo('.about-content',
    { opacity: 0, x: -50 },
    {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.about-section',
        start: 'top 70%'
      }
    }
  )

  gsap.fromTo('.about-skills',
    { opacity: 0, x: 50 },
    {
      opacity: 1,
      x: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.about-section',
        start: 'top 70%'
      }
    }
  )

  // Stat items
  gsap.fromTo('.stat-item',
    { opacity: 0, y: 30, scale: 0.9 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: '.about-stats',
        start: 'top 85%'
      }
    }
  )

  // Timeline items
  gsap.utils.toArray('.timeline-item').forEach((item, i) => {
    gsap.fromTo(item,
      { opacity: 0, x: -30 },
      {
        opacity: 1,
        x: 0,
        duration: 0.6,
        delay: i * 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: item,
          start: 'top 85%'
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
 * Initialize horizontal scroll for projects section
 */
function initHorizontalScroll() {
  const scrollContainer = document.querySelector('.projects-scroll-container')
  const track = document.querySelector('.projects-track')
  const progressBar = document.querySelector('.scroll-progress-bar')

  if (!scrollContainer || !track) return

  // Calculate the total scroll width
  const getScrollWidth = () => {
    return track.scrollWidth - scrollContainer.offsetWidth
  }

  // Create the horizontal scroll animation
  const horizontalScroll = gsap.to(track, {
    x: () => -getScrollWidth(),
    ease: 'none',
    scrollTrigger: {
      trigger: scrollContainer,
      start: 'top 20%',
      end: () => `+=${getScrollWidth()}`,
      scrub: 1,
      pin: true,
      anticipatePin: 1,
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
  })

  // Animate project cards as they come into view
  gsap.utils.toArray('.project-card').forEach((card, i) => {
    gsap.fromTo(card,
      { opacity: 0, y: 50, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        delay: i * 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: scrollContainer,
          start: 'top 60%',
          toggleActions: 'play none none reverse'
        }
      }
    )
  })

  // Refresh ScrollTrigger on resize
  let resizeTimer
  window.addEventListener('resize', () => {
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
  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute('href'))
      if (target) {
        // Account for horizontal scroll section
        const targetSection = this.getAttribute('href')
        if (targetSection === '#projects') {
          // Scroll to projects with offset
          gsap.to(window, {
            duration: 1,
            scrollTo: { y: target, offsetY: 100 },
            ease: 'power3.inOut'
          })
        } else {
          target.scrollIntoView({ behavior: 'smooth' })
        }
      }
    })
  })

  // Card hover effects
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        y: -8,
        duration: 0.3,
        ease: 'power2.out'
      })

      // Animate metrics
      const metrics = card.querySelectorAll('.metric-chip')
      gsap.to(metrics, {
        y: -2,
        duration: 0.2,
        stagger: 0.05,
        ease: 'power2.out'
      })
    })

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      })

      const metrics = card.querySelectorAll('.metric-chip')
      gsap.to(metrics, {
        y: 0,
        duration: 0.2,
        stagger: 0.05,
        ease: 'power2.out'
      })
    })
  })

  // Button ripple effect
  document.querySelectorAll('.btn-primary, .nav-cta').forEach(btn => {
    btn.addEventListener('mouseenter', (e) => {
      gsap.to(btn, {
        scale: 1.02,
        duration: 0.2,
        ease: 'power2.out'
      })
    })

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out'
      })
    })
  })

  // Social link hover
  document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('mouseenter', () => {
      gsap.to(link, {
        y: -4,
        rotation: 5,
        duration: 0.3,
        ease: 'power2.out'
      })
    })

    link.addEventListener('mouseleave', () => {
      gsap.to(link, {
        y: 0,
        rotation: 0,
        duration: 0.3,
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
      nav.style.backdropFilter = 'blur(20px)'
      nav.style.background = 'rgba(255, 255, 255, 0.8)'
    } else {
      nav.style.backdropFilter = 'blur(12px)'
      nav.style.background = 'rgba(255, 255, 255, 0.65)'
    }

    lastScroll = currentScroll
  })

  // Parallax effect for artifact SVGs
  document.querySelectorAll('.artifact-svg').forEach(svg => {
    const parent = svg.closest('.project-card')

    parent.addEventListener('mousemove', (e) => {
      const rect = parent.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5

      gsap.to(svg, {
        x: x * 10,
        y: y * 10,
        duration: 0.3,
        ease: 'power2.out'
      })
    })

    parent.addEventListener('mouseleave', () => {
      gsap.to(svg, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'power2.out'
      })
    })
  })
}
