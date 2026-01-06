/**
 * Three.js Point Cloud Background
 * Loads nuScenes PLY point cloud with interactive camera controls
 */

import * as THREE from 'three'
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js'

let scene, camera, renderer
let pointCloud
let animationId
let time = 0

// Interaction state
let isUserInteracting = false
let interactionTimeout = null
let targetRotationY = 0
let currentRotationY = 0
let targetCameraDistance = 60
let currentCameraDistance = 60
let targetCameraY = 25
let currentCameraY = 25
let isDragging = false
let previousMouseX = 0
let previousMouseY = 0

// Camera orbit angles
let cameraTheta = 0 // horizontal angle
let cameraPhi = 0.4 // vertical angle (radians from horizontal)

/**
 * Initialize the Three.js scene with PLY point cloud
 */
let orbitEnabled = true // Controls whether orbit interactions are allowed

export function setOrbitEnabled(enabled) {
    orbitEnabled = enabled
    const canvas = document.getElementById('three-canvas')
    if (canvas) {
        canvas.style.pointerEvents = enabled ? 'auto' : 'none'
        canvas.style.cursor = enabled ? 'grab' : 'default'
    }
}

export function initThreeScene() {
    const canvas = document.getElementById('three-canvas')
    if (!canvas) return

    // Scene setup
    scene = new THREE.Scene()

    // Camera
    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        500
    )
    updateCameraPosition()

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    // Fix color space: PLYLoader converts to Linear, we need sRGB output for correct display
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // Load PLY point cloud
    loadPointCloud()

    // Start animation
    animate()

    // Event listeners
    window.addEventListener('resize', onWindowResize)
    canvas.addEventListener('mousedown', onMouseDown)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseup', onMouseUp)
    canvas.addEventListener('mouseleave', onMouseUp)
    canvas.addEventListener('wheel', onWheel, { passive: false })

    // Touch support
    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)
}

/**
 * Load PLY point cloud file
 */
function loadPointCloud() {
    const loader = new PLYLoader()

    let choices = [
        "/scene-0061.ply",
        "/scene-0355.ply",
    ]

    let choice = choices[Math.floor(Math.random() * choices.length)]
    let scale_factor = navigator.userAgent.includes('Mobile') ? 25 : 75

    loader.load(
        choice,
        (geometry) => {
            // Center the geometry
            geometry.computeBoundingBox()
            const center = new THREE.Vector3()
            geometry.boundingBox.getCenter(center)
            geometry.translate(-center.x, -center.y, -center.z)

            // Scale to fit nicely in scene
            const size = new THREE.Vector3()
            geometry.boundingBox.getSize(size)
            const maxDim = Math.max(size.x, size.y, size.z)
            const scale = scale_factor / maxDim
            geometry.scale(scale, scale, scale)

            // Rotate to align PLY coordinates with Three.js
            // PLY: X=lateral, Y=forward, Z=up
            // Three.js: X=lateral, Y=up, Z=forward
            geometry.rotateX(-Math.PI / 2)

            // Note: PLYLoader automatically normalizes 0-255 colors to 0-1 and converts to Linear
            // The renderer.outputColorSpace = SRGBColorSpace handles the display conversion

            // Use vertex colors from PLY if available
            let material
            if (geometry.hasAttribute('color')) {
                material = new THREE.PointsMaterial({
                    size: 0.15,
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.9,
                    sizeAttenuation: true
                })
            } else {
                // Fallback purple gradient
                material = new THREE.PointsMaterial({
                    size: 0.15,
                    color: 0x7C3AED,
                    transparent: true,
                    opacity: 0.8,
                    sizeAttenuation: true
                })
            }

            pointCloud = new THREE.Points(geometry, material)
            scene.add(pointCloud)

            console.log(`Loaded point cloud with ${geometry.attributes.position.count} points`)
        },
        (progress) => {
            // Loading progress
            const percent = (progress.loaded / progress.total * 100).toFixed(0)
            console.log(`Loading point cloud: ${percent}%`)
        },
        (error) => {
            console.error('Error loading PLY:', error)
            // Fallback to procedural point cloud
            createFallbackPointCloud()
        }
    )
}

/**
 * Fallback procedural point cloud if PLY fails to load
 */
function createFallbackPointCloud() {
    const geometry = new THREE.BufferGeometry()
    const positions = []
    const colors = []

    const numPoints = 10000
    for (let i = 0; i < numPoints; i++) {
        const angle = Math.random() * Math.PI * 2
        const radius = 5 + Math.random() * 25
        const height = (Math.random() - 0.5) * 20

        positions.push(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        )

        // Purple gradient based on height
        const t = (height + 10) / 20
        colors.push(
            0.486 * t + 0.3 * (1 - t),
            0.227 * t + 0.3 * (1 - t),
            0.929 * t + 0.3 * (1 - t)
        )
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
        size: 0.3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    })

    pointCloud = new THREE.Points(geometry, material)
    scene.add(pointCloud)
}

/**
 * Update camera position based on spherical coordinates
 */
function updateCameraPosition() {
    const x = currentCameraDistance * Math.cos(cameraPhi) * Math.sin(cameraTheta)
    const y = currentCameraDistance * Math.sin(cameraPhi) + 5
    const z = currentCameraDistance * Math.cos(cameraPhi) * Math.cos(cameraTheta)

    camera.position.set(x, y, z)
    camera.lookAt(0, 0, 0)
}

/**
 * Animation loop
 */
function animate() {
    animationId = requestAnimationFrame(animate)
    time += 0.016 // ~60fps

    // Auto-rotate camera when not interacting
    if (!isUserInteracting) {
        cameraTheta += 0.002
        updateCameraPosition()
    }

    // Smooth camera distance transition
    currentCameraDistance += (targetCameraDistance - currentCameraDistance) * 0.08
    updateCameraPosition()

    // Subtle opacity pulse
    if (pointCloud && pointCloud.material) {
        pointCloud.material.opacity = 0.8 + Math.sin(time * 0.5) * 0.05
    }

    renderer.render(scene, camera)
}

/**
 * Handle window resize
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

/**
 * Mouse down - start dragging
 */
function onMouseDown(event) {
    isDragging = true
    isUserInteracting = true
    previousMouseX = event.clientX
    previousMouseY = event.clientY
    clearTimeout(interactionTimeout)
    document.body.classList.add('canvas-dragging')
}

/**
 * Mouse move - orbit camera around the scene
 */
function onMouseMove(event) {
    if (!isDragging) return

    const deltaX = event.clientX - previousMouseX
    const deltaY = event.clientY - previousMouseY

    // Orbit camera around the scene
    cameraTheta -= deltaX * 0.005  // Horizontal orbit
    cameraPhi += deltaY * 0.003    // Vertical orbit
    cameraPhi = Math.max(0.1, Math.min(1.4, cameraPhi)) // Clamp vertical angle

    updateCameraPosition()

    previousMouseX = event.clientX
    previousMouseY = event.clientY
}

/**
 * Mouse up - stop dragging, resume auto-rotate after delay
 */
function onMouseUp() {
    isDragging = false
    document.body.classList.remove('canvas-dragging')

    // Resume auto-rotation after 2 seconds of inactivity
    clearTimeout(interactionTimeout)
    interactionTimeout = setTimeout(() => {
        isUserInteracting = false
    }, 2000)
}

/**
 * Mouse wheel - zoom in/out (only with Ctrl/Cmd held, otherwise page scrolls)
 */
function onWheel(event) {
    // Only zoom when Ctrl/Cmd is held, otherwise let page scroll normally
    if (!event.ctrlKey && !event.metaKey) {
        return // Don't prevent default - let page scroll
    }

    event.preventDefault()

    isUserInteracting = true
    clearTimeout(interactionTimeout)

    // Zoom based on wheel delta
    targetCameraDistance += event.deltaY * 0.05
    targetCameraDistance = Math.max(20, Math.min(120, targetCameraDistance))

    // Resume auto-rotation after delay
    interactionTimeout = setTimeout(() => {
        isUserInteracting = false
    }, 2000)
}

/**
 * Touch start
 */
function onTouchStart(event) {
    if (event.touches.length === 1) {
        event.preventDefault()
        isDragging = true
        isUserInteracting = true
        previousMouseX = event.touches[0].clientX
        previousMouseY = event.touches[0].clientY
        clearTimeout(interactionTimeout)
    }
}

/**
 * Touch move
 */
function onTouchMove(event) {
    if (!isDragging || event.touches.length !== 1) return
    event.preventDefault()

    const deltaX = event.touches[0].clientX - previousMouseX
    const deltaY = event.touches[0].clientY - previousMouseY

    // Orbit camera around the scene
    cameraTheta -= deltaX * 0.005
    cameraPhi += deltaY * 0.003
    cameraPhi = Math.max(0.1, Math.min(1.4, cameraPhi))
    updateCameraPosition()

    previousMouseX = event.touches[0].clientX
    previousMouseY = event.touches[0].clientY
}

/**
 * Touch end
 */
function onTouchEnd() {
    isDragging = false

    interactionTimeout = setTimeout(() => {
        isUserInteracting = false
    }, 2000)
}

/**
 * Cleanup function
 */
export function destroyThreeScene() {
    if (animationId) {
        cancelAnimationFrame(animationId)
    }

    clearTimeout(interactionTimeout)

    const canvas = document.getElementById('three-canvas')
    if (canvas) {
        canvas.removeEventListener('mousedown', onMouseDown)
        canvas.removeEventListener('mousemove', onMouseMove)
        canvas.removeEventListener('mouseup', onMouseUp)
        canvas.removeEventListener('mouseleave', onMouseUp)
        canvas.removeEventListener('wheel', onWheel)
        canvas.removeEventListener('touchstart', onTouchStart)
        canvas.removeEventListener('touchmove', onTouchMove)
        canvas.removeEventListener('touchend', onTouchEnd)
    }

    window.removeEventListener('resize', onWindowResize)

    // Dispose geometries and materials
    if (scene) {
        scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose()
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose())
                } else {
                    object.material.dispose()
                }
            }
        })
    }

    if (renderer) {
        renderer.dispose()
    }
}
