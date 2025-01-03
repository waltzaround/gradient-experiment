import { useState, useEffect, useRef } from 'react'
import * as THREE from 'three'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Smoke particles setup
    const particleCount = 300
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    // Initialize particle attributes
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = Math.random() * 8 - 4
      positions[i + 1] = Math.random() * 8 - 4
      positions[i + 2] = Math.random() * 4 - 2
      
      // Random initial colors
      const phase = Math.random() * Math.PI * 2
      colors[i] = Math.sin(phase) * 0.5 + 0.5
      colors[i + 1] = Math.sin(phase + Math.PI * 2/3) * 0.5 + 0.5
      colors[i + 2] = Math.sin(phase + Math.PI * 4/3) * 0.5 + 0.5
      
      sizes[i / 3] = 40 + Math.random() * 20
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    // Set buffer sizes explicitly
    geometry.getAttribute('position').needsUpdate = true
    geometry.getAttribute('color').needsUpdate = true
    geometry.getAttribute('size').needsUpdate = true

    // Create circular particle texture
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const size = 64
    canvas.width = size
    canvas.height = size
    
    ctx.clearRect(0, 0, size, size)
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    )
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    const particleTexture = new THREE.Texture(canvas)
    particleTexture.needsUpdate = true
    particleTexture.premultiplyAlpha = false
    particleTexture.flipY = false

    const material = new THREE.PointsMaterial({
      size: 64,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.2,
      sizeAttenuation: true,
      map: particleTexture,
      depthWrite: false,
      depthTest: true,
      alphaTest: 0.001
    })

    const particleSystem = new THREE.Points(geometry, material)
    scene.add(particleSystem)

    camera.position.z = 3

    // Animation
    let time = 0
    let lastTime = 0
    const animate = () => {
      const currentTime = performance.now()
      if (currentTime - lastTime < 32) { 
        requestAnimationFrame(animate)
        return
      }
      lastTime = currentTime
      
      time += 0.00002

      const positions = geometry.attributes.position.array as Float32Array
      const colors = geometry.attributes.color.array as Float32Array
      const sizes = geometry.attributes.size.array as Float32Array

      // Pre-calculate common values
      const timeX = time * 0.1
      const timeY = time * 0.15
      const timeZ = time * 0.2
      const cosX = Math.cos(timeX)
      const sinX = Math.sin(timeX)
      const cosY = Math.cos(timeY)
      const sinY = Math.sin(timeY)
      const cosZ = Math.cos(timeZ)
      const sinZ = Math.sin(timeZ)

      for (let i = 0; i < particleCount * 3; i += 3) {
        const x = positions[i]
        const y = positions[i + 1]
        const z = positions[i + 2]
        
        // Simplified rotation calculations
        const newY = y * cosY - z * sinY
        const newZ = y * sinY + z * cosY
        const newX = x * cosZ - newZ * sinZ
        const finalZ = x * sinZ + newZ * cosZ
        
        positions[i] = newX * cosX - newY * sinX
        positions[i + 1] = newX * sinX + newY * cosX
        positions[i + 2] = finalZ

        // Simplified size and color updates
        const sizeIndex = i / 3
        const positionFactor = (Math.sin(newX + newY + finalZ) + 1) * 0.5
        sizes[sizeIndex] = 40 + positionFactor * 24

        // Individual color cycling for each particle
        const individualOffset = sizeIndex * 0.2 // Different phase for each particle
        const timeScale = 0.02 // Slower color changes
        
        // Calculate base color components using offset sine waves
        const basePhase = time * timeScale + individualOffset
        const r = Math.sin(basePhase) * 0.5 + 0.5
        const g = Math.sin(basePhase + Math.PI * 2/3) * 0.5 + 0.5
        const b = Math.sin(basePhase + Math.PI * 4/3) * 0.5 + 0.5
        
        // Add subtle position-based variation
        const posFactor = 0.2
        colors[i] = r * (1 - posFactor) + positionFactor * posFactor
        colors[i + 1] = g * (1 - posFactor) + positionFactor * posFactor
        colors[i + 2] = b * (1 - posFactor) + positionFactor * posFactor

        // Simpler boundary check
        const distanceSquared = 
          positions[i] * positions[i] + 
          positions[i + 1] * positions[i + 1] + 
          positions[i + 2] * positions[i + 2]
        
        if (distanceSquared > 36) { 
          const scale = 4 / Math.sqrt(distanceSquared)
          positions[i] *= scale
          positions[i + 1] *= scale
          positions[i + 2] *= scale
        }
      }

      geometry.attributes.size.needsUpdate = true
      geometry.attributes.position.needsUpdate = true
      geometry.attributes.color.needsUpdate = true
      
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
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
    <section className='w-[calc(100vw_-_4rem)] h-[calc(50vh_-_4rem)] m-[2rem] border rounded-xl overflow-hidden border-gray-900 relative'>
      <div className="absolute top-0 left-0 w-full h-full m-4 z-20">
        <div className='w-full h-full flex flex-col justify-start items-start m-8'>
      <h1 className='text-8xl font-semibold  text-white tracking-tight leading-normal'>Walter Lim is a designer and developer</h1>
      <p className='mt-6 text-gray-300 tracking-tight text-4xl'>He leads design at <a href="https://watchful.co.nz">Watchful</a>, and builds silly things in his spare time.</p>
      </div>
      </div>
      <canvas ref={canvasRef} className='w-full h-full bg-black blur-[40px]'></canvas>
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
