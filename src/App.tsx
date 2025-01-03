import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(1)
    renderer.setClearColor(0x000000, 0)

    // Create particle texture
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const size = 32
    canvas.width = size
    canvas.height = size
    
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    )
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true

    // Create geometry with proper buffer sizes
    const particleCount = 250
    const geometry = new THREE.BufferGeometry()
    
    // Create arrays for attributes
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)

    // Initialize particle attributes
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      // Position - spread particles more widely
      positions[i3] = Math.random() * 20 - 10     // x: -10 to 10
      positions[i3 + 1] = Math.random() * 20 - 10 // y: -10 to 10
      positions[i3 + 2] = Math.random() * 16 - 8  // z: -8 to 8
      
      // More vibrant pastel colors
      const hue = Math.random()
      const saturation = 0.5  // Increased from 0.3
      const lightness = 0.65  // Slightly decreased for more color
      
      // Convert HSL to RGB
      const c = (1 - Math.abs(2 * lightness - 1)) * saturation
      const x = c * (1 - Math.abs((hue * 6) % 2 - 1))
      const m = lightness - c/2
      
      let r, g, b
      if (hue < 1/6) {
        [r, g, b] = [c, x, 0]
      } else if (hue < 2/6) {
        [r, g, b] = [x, c, 0]
      } else if (hue < 3/6) {
        [r, g, b] = [0, c, x]
      } else if (hue < 4/6) {
        [r, g, b] = [0, x, c]
      } else if (hue < 5/6) {
        [r, g, b] = [x, 0, c]
      } else {
        [r, g, b] = [c, 0, x]
      }
      
      colors[i3] = r + m
      colors[i3 + 1] = g + m
      colors[i3 + 2] = b + m
    }

    // Add attributes to geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    // Create material with correct texture settings
    const material = new THREE.PointsMaterial({
      size: 35,
      map: texture,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    })

    // Create particle system
    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    camera.position.z = 15  // Moved camera back to see wider spread

    // Animation loop
    let lastTime = performance.now()
    const animate = () => {
      requestAnimationFrame(animate)
      
      const currentTime = performance.now()
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime
      
      const positions = geometry.attributes.position.array as Float32Array
      
      // Update positions
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        const x = positions[i3]
        const y = positions[i3 + 1]
        const z = positions[i3 + 2]
        
        // Very gentle circular motion
        const angle = deltaTime * 0.1
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        
        positions[i3] = x * cos - z * sin
        positions[i3 + 2] = z * cos + x * sin
        positions[i3 + 1] += Math.sin(currentTime * 0.0005 + i) * 0.002
        
        // Keep particles in bounds with wider limits
        const dist = Math.sqrt(x * x + y * y + z * z)
        if (dist > 12) {  // Increased boundary
          positions[i3] *= 0.95
          positions[i3 + 1] *= 0.95
          positions[i3 + 2] *= 0.95
        }
      }
      
      geometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <>
    <section className='w-[calc(100vw_-_4rem)] h-[calc(50vh_-_4rem)] m-[2rem] border rounded-xl overflow-hidden border-gray-900 relative bg-black'>
      <div className="absolute top-0 left-0 w-full h-full m-4 z-20">
        <div className='w-full h-full flex flex-col justify-start items-start m-8'>
      <h1 className='text-8xl font-semibold  text-white tracking-tighter leading-normal'>Walter Lim is a designer and developer</h1>
      <p className='mt-6 text-gray-300 tracking-tight text-4xl'>He leads design at <a href="https://watchful.co.nz">Watchful</a>, and builds silly things in his spare time.</p>
      </div>
      </div>
      <canvas ref={canvasRef} className='w-full h-full opacity-50'></canvas>
    </section>
    <section className="m-8 grid grid-cols-3 gap-8">
      <div className='group col-span-2 w-full border border-gray-800 bg-black/50 rounded-xl flex justify-between transition-all hover:border-gray-700 hover:bg-black/70'>
        <div className='flex-1 p-8'>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-medium text-white">Watchful</h3>
          </div>
          <div className="flex flex-col items-start justify-between">
            <p className="text-gray-400">Building the future of security monitoring</p>
            <span className="text-sm text-gray-500">2022 — Present</span>
            <svg className="w-5 h-5 text-gray-600 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
        <img src="/" className='bg-gray-600 min-h-80 flex-1 rounded-xl rounded-l-none'/>
      </div>

      <div className='group w-full h-40 border border-gray-800 bg-black/50 rounded-xl p-8 flex flex-col justify-between transition-all hover:border-gray-700 hover:bg-black/70'>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-medium text-white">Threat Detection</h3>
          <span className="text-sm text-gray-500">Core Product</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-400">Real-time security monitoring</p>
          <svg className="w-5 h-5 text-gray-600 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>

      <div className='group w-full h-40 border border-gray-800 bg-black/50 rounded-xl p-8 flex flex-col justify-between transition-all hover:border-gray-700 hover:bg-black/70'>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-medium text-white">Asset Discovery</h3>
          <span className="text-sm text-gray-500">Feature</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-400">Automated infrastructure mapping</p>
          <svg className="w-5 h-5 text-gray-600 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>

      <div className='group w-full h-40 border border-gray-800 bg-black/50 rounded-xl p-8 flex flex-col justify-between transition-all hover:border-gray-700 hover:bg-black/70'>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-medium text-white">Compliance</h3>
          <span className="text-sm text-gray-500">Feature</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-400">Automated security standards</p>
          <svg className="w-5 h-5 text-gray-600 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>

      <div className='group w-full h-40 border border-gray-800 bg-black/50 rounded-xl p-8 flex flex-col justify-between transition-all hover:border-gray-700 hover:bg-black/70'>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-medium text-white">Integrations</h3>
          <span className="text-sm text-gray-500">Platform</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-400">Connect your security stack</p>
          <svg className="w-5 h-5 text-gray-600 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>

      <div className='group w-full h-40 border border-gray-800 bg-black/50 rounded-xl p-8 flex flex-col justify-between transition-all hover:border-gray-700 hover:bg-black/70'>
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-medium text-white">API</h3>
          <span className="text-sm text-gray-500">Developer</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-gray-400">Custom security workflows</p>
          <svg className="w-5 h-5 text-gray-600 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </section>
    </>
  )
}

export default App
