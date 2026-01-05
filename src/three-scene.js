/**
 * Three.js Liquid Glass Background
 * Subtle floating translucent orbs with glass material
 */

import * as THREE from 'three'

let scene, camera, renderer, orbs = []
let animationId

/**
 * Initialize the Three.js scene
 */
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
        1000
    )
    camera.position.z = 30

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

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 10)
    scene.add(directionalLight)

    const pointLight1 = new THREE.PointLight(0x7C3AED, 0.5, 50)
    pointLight1.position.set(-15, 10, 15)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xA78BFA, 0.3, 40)
    pointLight2.position.set(15, -10, 10)
    scene.add(pointLight2)

    // Create glass orbs
    createGlassOrbs()

    // Start animation
    animate()

    // Handle resize
    window.addEventListener('resize', onWindowResize)

    // Handle scroll for parallax
    window.addEventListener('scroll', onScroll)

    // Handle mouse move for subtle interaction
    window.addEventListener('mousemove', onMouseMove)
}

/**
 * Create floating glass orbs
 */
function createGlassOrbs() {
    const orbConfigs = [
        { size: 4, position: [-12, 8, -5], speed: 0.0008, amplitude: 2 },
        { size: 2.5, position: [15, -5, -8], speed: 0.001, amplitude: 1.5 },
        { size: 3, position: [-8, -10, -3], speed: 0.0007, amplitude: 2.5 },
        { size: 5, position: [20, 12, -12], speed: 0.0006, amplitude: 1.8 },
        { size: 2, position: [5, -15, -6], speed: 0.0012, amplitude: 1.2 },
        { size: 3.5, position: [-18, 0, -10], speed: 0.0009, amplitude: 2.2 },
        { size: 1.5, position: [10, 5, -4], speed: 0.0015, amplitude: 1 },
    ]

    orbConfigs.forEach((config, index) => {
        const orb = createGlassOrb(config.size, config.position)
        orb.userData = {
            speed: config.speed,
            amplitude: config.amplitude,
            originalY: config.position[1],
            originalX: config.position[0],
            phase: index * Math.PI * 0.5,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.002,
                y: (Math.random() - 0.5) * 0.002,
                z: (Math.random() - 0.5) * 0.001
            }
        }
        orbs.push(orb)
        scene.add(orb)
    })
}

/**
 * Create a single glass orb with refraction material
 */
function createGlassOrb(size, position) {
    // Create geometry with more segments for smoother appearance
    const geometry = new THREE.SphereGeometry(size, 64, 64)

    // Glass-like material using MeshPhysicalMaterial
    const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0,
        roughness: 0.05,
        transmission: 0.95,
        thickness: size * 0.5,
        envMapIntensity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        ior: 1.5,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(...position)

    return mesh
}

/**
 * Animation loop
 */
function animate() {
    animationId = requestAnimationFrame(animate)

    const time = Date.now()

    // Animate each orb
    orbs.forEach((orb) => {
        const { speed, amplitude, originalY, originalX, phase, rotationSpeed } = orb.userData

        // Floating motion
        orb.position.y = originalY + Math.sin(time * speed + phase) * amplitude
        orb.position.x = originalX + Math.cos(time * speed * 0.7 + phase) * (amplitude * 0.5)

        // Gentle rotation
        orb.rotation.x += rotationSpeed.x
        orb.rotation.y += rotationSpeed.y
        orb.rotation.z += rotationSpeed.z
    })

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
 * Handle scroll for depth effect
 */
let scrollY = 0
function onScroll() {
    scrollY = window.scrollY

    // Move orbs slightly based on scroll for depth
    orbs.forEach((orb, index) => {
        const speed = 0.001 + (index * 0.0002)
        orb.position.z += (scrollY * speed - orb.position.z) * 0.05
    })
}

/**
 * Handle mouse move for subtle parallax
 */
let mouseX = 0
let mouseY = 0
let targetX = 0
let targetY = 0

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1

    // Smooth follow
    targetX += (mouseX - targetX) * 0.02
    targetY += (mouseY - targetY) * 0.02

    // Subtle camera movement based on mouse
    camera.position.x += (targetX * 2 - camera.position.x) * 0.01
    camera.position.y += (targetY * 2 - camera.position.y) * 0.01
    camera.lookAt(scene.position)
}

/**
 * Cleanup function
 */
export function destroyThreeScene() {
    if (animationId) {
        cancelAnimationFrame(animationId)
    }

    window.removeEventListener('resize', onWindowResize)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('mousemove', onMouseMove)

    orbs.forEach(orb => {
        orb.geometry.dispose()
        orb.material.dispose()
        scene.remove(orb)
    })

    renderer.dispose()
}
