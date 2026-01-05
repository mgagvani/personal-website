/**
 * Three.js Point Cloud Background
 * Engineering-themed rotating point cloud/voxel grid visualization
 * Inspired by nuScenes/CARLA autonomous driving datasets
 */

import * as THREE from 'three'

let scene, camera, renderer
let pointCloud, voxelGrid, vehiclePoints
let animationId
let time = 0

/**
 * Initialize the Three.js scene with point cloud
 */
export function initThreeScene() {
    const canvas = document.getElementById('three-canvas')
    if (!canvas) return

    // Scene setup
    scene = new THREE.Scene()

    // Camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    )
    camera.position.set(0, 30, 50)
    camera.lookAt(0, 0, 0)

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

    // Create visualizations
    createGroundPlaneGrid()
    createPointCloud()
    createVehiclePointCloud()
    createBoundingBoxes()

    // Start animation
    animate()

    // Handle resize
    window.addEventListener('resize', onWindowResize)

    // Handle scroll for camera movement
    window.addEventListener('scroll', onScroll)

    // Handle mouse move for subtle parallax
    window.addEventListener('mousemove', onMouseMove)
}

/**
 * Create ground plane with grid pattern (like road markings)
 */
function createGroundPlaneGrid() {
    const gridSize = 100
    const gridDivisions = 50

    // Create grid of points for ground plane
    const groundGeometry = new THREE.BufferGeometry()
    const groundPositions = []
    const groundColors = []

    for (let x = -gridSize / 2; x <= gridSize / 2; x += gridSize / gridDivisions) {
        for (let z = -gridSize / 2; z <= gridSize / 2; z += gridSize / gridDivisions) {
            // Add some noise to make it more natural
            const noise = (Math.random() - 0.5) * 0.3
            groundPositions.push(x + noise, -5, z + noise)

            // Gray color with slight variation
            const brightness = 0.3 + Math.random() * 0.1
            groundColors.push(brightness, brightness, brightness)
        }
    }

    groundGeometry.setAttribute('position', new THREE.Float32BufferAttribute(groundPositions, 3))
    groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(groundColors, 3))

    const groundMaterial = new THREE.PointsMaterial({
        size: 0.15,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true
    })

    const groundPoints = new THREE.Points(groundGeometry, groundMaterial)
    scene.add(groundPoints)
}

/**
 * Create main point cloud (simulating LiDAR scan of environment)
 */
function createPointCloud() {
    const geometry = new THREE.BufferGeometry()
    const positions = []
    const colors = []
    const sizes = []

    const numPoints = 8000

    for (let i = 0; i < numPoints; i++) {
        // Create points in a cylindrical pattern (like LiDAR scan)
        const angle = Math.random() * Math.PI * 2
        const radius = 5 + Math.random() * 40
        const height = (Math.random() - 0.5) * 30

        // Add clustering for objects (buildings, trees, etc.)
        let x = Math.cos(angle) * radius
        let z = Math.sin(angle) * radius
        let y = height

        // Create some vertical structures (like buildings/poles)
        if (Math.random() > 0.85) {
            const structureAngle = Math.floor(Math.random() * 8) * (Math.PI / 4)
            const structureRadius = 15 + Math.floor(Math.random() * 3) * 10
            x = Math.cos(structureAngle) * structureRadius + (Math.random() - 0.5) * 3
            z = Math.sin(structureAngle) * structureRadius + (Math.random() - 0.5) * 3
            y = Math.random() * 20 - 5
        }

        positions.push(x, y, z)

        // Color based on height (purple accent for higher points)
        const heightNorm = (y + 15) / 35
        if (heightNorm > 0.6) {
            // Accent color (purple) for high points
            colors.push(0.486, 0.227, 0.929) // #7C3AED
        } else if (heightNorm > 0.3) {
            // Mid-height - lighter purple
            colors.push(0.655, 0.545, 0.98) // #A78BFA  
        } else {
            // Low points - gray
            const gray = 0.4 + Math.random() * 0.2
            colors.push(gray, gray, gray)
        }

        // Vary size based on distance from center
        const dist = Math.sqrt(x * x + z * z)
        sizes.push(0.8 + (1 - dist / 50) * 1.5)
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))

    // Custom shader material for better point rendering
    const material = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    })

    pointCloud = new THREE.Points(geometry, material)
    scene.add(pointCloud)
}

/**
 * Create vehicle/ego car point cloud representation
 */
function createVehiclePointCloud() {
    const geometry = new THREE.BufferGeometry()
    const positions = []
    const colors = []

    // Create car-shaped point cluster at center
    const carLength = 4
    const carWidth = 2
    const carHeight = 1.5
    const pointDensity = 200

    for (let i = 0; i < pointDensity; i++) {
        // Body points
        const x = (Math.random() - 0.5) * carLength
        const y = Math.random() * carHeight - 3
        const z = (Math.random() - 0.5) * carWidth

        positions.push(x, y, z)

        // Bright accent color for ego vehicle
        colors.push(0.486, 0.227, 0.929)
    }

    // Add sensor rays emanating from vehicle
    const numRays = 64 // Like 64-beam LiDAR
    for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2
        const rayLength = 30 + Math.random() * 15

        // Points along ray
        for (let j = 0; j < 10; j++) {
            const dist = (j / 10) * rayLength
            const x = Math.cos(angle) * dist
            const z = Math.sin(angle) * dist
            const y = -2 + Math.sin(dist * 0.1) * 2

            positions.push(x, y, z)

            // Fade color along ray
            const fade = 1 - (j / 10) * 0.7
            colors.push(0.486 * fade, 0.227 * fade, 0.929 * fade)
        }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    const material = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true
    })

    vehiclePoints = new THREE.Points(geometry, material)
    scene.add(vehiclePoints)
}

/**
 * Create 3D bounding boxes (detected objects)
 */
function createBoundingBoxes() {
    const boxMaterial = new THREE.LineBasicMaterial({
        color: 0x7C3AED,
        transparent: true,
        opacity: 0.5
    })

    // Create several bounding boxes at various positions
    const boxes = [
        { pos: [15, 0, 10], size: [4, 3, 2], rot: 0.3 },
        { pos: [-20, -1, 5], size: [5, 4, 2], rot: -0.2 },
        { pos: [8, -2, -18], size: [3, 2, 1.5], rot: 0.8 },
        { pos: [-12, 1, -12], size: [4, 3, 2], rot: 0.1 },
        { pos: [25, -1, -8], size: [6, 4, 3], rot: -0.4 },
    ]

    boxes.forEach(box => {
        const geometry = new THREE.BoxGeometry(...box.size)
        const edges = new THREE.EdgesGeometry(geometry)
        const line = new THREE.LineSegments(edges, boxMaterial)
        line.position.set(...box.pos)
        line.rotation.y = box.rot
        scene.add(line)
    })
}

/**
 * Animation loop
 */
function animate() {
    animationId = requestAnimationFrame(animate)

    time += 0.001

    // Slowly rotate the entire point cloud scene
    if (pointCloud) {
        pointCloud.rotation.y = time * 0.3
    }

    if (vehiclePoints) {
        vehiclePoints.rotation.y = time * 0.3
    }

    // Pulse effect on points (subtle)
    if (pointCloud && pointCloud.material) {
        pointCloud.material.opacity = 0.6 + Math.sin(time * 2) * 0.1
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
 * Handle scroll for camera elevation
 */
let scrollY = 0
let cameraTargetY = 30
let cameraTargetZ = 50

function onScroll() {
    scrollY = window.scrollY
    const scrollProgress = scrollY / (document.body.scrollHeight - window.innerHeight)

    // Move camera up and back as user scrolls
    cameraTargetY = 30 + scrollProgress * 20
    cameraTargetZ = 50 - scrollProgress * 20
}

/**
 * Handle mouse move for camera parallax
 */
let mouseX = 0
let mouseY = 0

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1

    // Subtle camera movement based on mouse
    camera.position.x += (mouseX * 10 - camera.position.x) * 0.02
    camera.position.y += (cameraTargetY + mouseY * 5 - camera.position.y) * 0.02
    camera.position.z += (cameraTargetZ - camera.position.z) * 0.02

    camera.lookAt(0, 0, 0)
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

    // Dispose geometries and materials
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

    renderer.dispose()
}
