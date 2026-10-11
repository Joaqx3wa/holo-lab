import { useEffect, useRef, useState } from 'react'
import { getParameterValue as parameterValue, renderEffects } from './effects/image-effects.js'

const effectGroups = [
  {
    name: 'Impresión',
    effects: [
      { id: 'halftone', name: 'Halftone', description: 'Trama de semitonos', icon: 'dots' },
      { id: 'engraved', name: 'Engraved', description: 'Líneas grabadas', icon: 'layers' },
      { id: 'grain', name: 'Grain', description: 'Ruido analógico 35mm', icon: 'grain' },
    ],
  },
  {
    name: 'Digital',
    effects: [
      { id: 'glitch', name: 'Glitch', description: 'Distorsión digital', icon: 'image' },
      { id: 'bitmap', name: 'Bitmap', description: 'Trama de bloques', icon: 'dots' },
      { id: 'dithering', name: 'Dithering', description: 'Trama de puntos Floyd–Steinberg', icon: 'grain' },
      { id: 'rgb-shift', name: 'RGB Shift', description: 'Aberración cromática', icon: 'layers' },
    ],
  },
  {
    name: 'Color',
    effects: [
      { id: 'cmyk-shift', name: 'CMYK Shift', description: 'Separación de color', icon: 'palette' },
      { id: 'black-white', name: 'Blanco y negro', description: 'Conversión monocroma', icon: 'half' },
      { id: 'duotone', name: 'Duotone', description: 'Dos tonos', icon: 'half' },
    ],
  },
  {
    name: 'Óptica',
    effects: [
      { id: 'holographic-foil', name: 'Holographic Foil', description: 'Reflejo iridiscente', icon: 'layers' },
    ],
  },
]

const defaultParameters = {
  halftone: [
    { name: 'Tamaño', value: 12, unit: 'px', min: 1, max: 64, color: 'violet' },
    { name: 'Contraste', value: 78, unit: '%', min: 0, max: 100, color: 'cyan' },
    { name: 'Intensidad', value: 85, unit: '%', min: 0, max: 100, color: 'pink' },
    { name: 'Forma de trama', value: 'Puntos' },
    { name: 'Orientación', value: 'Horizontal' },
    { name: 'Modo', value: 'Colores originales' },
    { name: 'Tinta', value: '#111018' },
    { name: 'Fondo', value: '#ed78ef' },
  ],
  engraved: [
    { name: 'Intensidad', value: 72, unit: '%', min: 0, max: 100, color: 'violet' },
    { name: 'Densidad', value: 74, unit: '%', min: 0, max: 100, color: 'cyan' },
  ],
  bitmap: [
    { name: 'Umbral', value: 50, unit: '%', min: 0, max: 100, color: 'cyan' },
    { name: 'Tamaño de bloque', value: 2, unit: 'px', min: 1, max: 12, color: 'violet' },
    { name: 'Tinta', value: '#073b35' },
    { name: 'Fondo', value: '#a9f5d0' },
  ],
  dithering: [
    { name: 'Tamaño de puntos', value: 4, unit: 'px', min: 2, max: 16, color: 'cyan' },
    { name: 'Niveles', value: 6, unit: '', min: 2, max: 12, color: 'violet' },
    { name: 'Intensidad', value: 90, unit: '%', min: 0, max: 100, color: 'pink' },
    { name: 'Textura', value: 'Puntos' },
    { name: 'Modo', value: 'Dos colores' },
    { name: 'Tinta', value: '#100d14' },
    { name: 'Fondo', value: '#ed78ef' },
  ],
  glitch: [
    { name: 'Intensidad', value: 55, unit: '%', min: 0, max: 100, color: 'pink' },
  ],
  'rgb-shift': [
    { name: 'Desplazamiento horizontal', value: 12, unit: 'px', min: -64, max: 64, color: 'cyan' },
    { name: 'Desplazamiento vertical', value: 0, unit: 'px', min: -64, max: 64, color: 'violet' },
    { name: 'Intensidad', value: 80, unit: '%', min: 0, max: 100, color: 'pink' },
  ],
  grain: [
    { name: 'Tamaño', value: 2, unit: 'px', min: 1, max: 16, color: 'cyan' },
    { name: 'Intensidad', value: 45, unit: '%', min: 0, max: 100, color: 'pink' },
  ],
  'cmyk-shift': [
    { name: 'Desplazamiento Cian horizontal', value: 0, unit: 'px', min: -32, max: 32, color: 'cyan' },
    { name: 'Desplazamiento Cian vertical', value: 0, unit: 'px', min: -32, max: 32, color: 'cyan' },
    { name: 'Desplazamiento Magenta horizontal', value: 8, unit: 'px', min: -32, max: 32, color: 'pink' },
    { name: 'Desplazamiento Magenta vertical', value: 0, unit: 'px', min: -32, max: 32, color: 'pink' },
    { name: 'Desplazamiento Amarillo horizontal', value: -8, unit: 'px', min: -32, max: 32, color: 'violet' },
    { name: 'Desplazamiento Amarillo vertical', value: 0, unit: 'px', min: -32, max: 32, color: 'violet' },
    { name: 'Desplazamiento Negro horizontal', value: 0, unit: 'px', min: -32, max: 32, color: 'cyan' },
    { name: 'Desplazamiento Negro vertical', value: 0, unit: 'px', min: -32, max: 32, color: 'cyan' },
    { name: 'Intensidad', value: 100, unit: '%', min: 0, max: 100, color: 'pink' },
  ],
  'black-white': [
    { name: 'Intensidad', value: 100, unit: '%', min: 0, max: 100, color: 'cyan' },
  ],
  duotone: [
    { name: 'Sombras', value: '#171447' },
    { name: 'Luces', value: '#ff84bd' },
    { name: 'Intensidad', value: 100, unit: '%', min: 0, max: 100, color: 'violet' },
  ],
  'holographic-foil': [
    { name: 'Intensidad', value: 105, unit: '%', min: 0, max: 200, color: 'violet' },
    { name: 'Brillo', value: 82, unit: '%', min: 0, max: 100, color: 'cyan' },
    { name: 'Patrón', value: 'Arcoíris espectral' },
  ],
}

const PENDING_EFFECT_IDS = new Set()
const PREVIEW_MAX_SIDE = 2400
const CMYK_CHANNELS = ['Cian', 'Magenta', 'Amarillo', 'Negro']
const MIN_ZOOM = 0.1
const MAX_ZOOM = 4
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function Icon({ name, size = 16 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
  const paths = {
    folder: <><path d="M3.5 7.5h6l2 2h9v9h-17z" /><path d="M3.5 7.5V5.5h7l2 2" /><path d="m9 13 2.2 2.2L16 10.5" /></>,
    undo: <><path d="M9 14 4.5 9.5 9 5" /><path d="M5 9.5h8a6 6 0 0 1 0 12h-1" /></>,
    reset: <><path d="M20 7v5h-5" /><path d="M19 12a7 7 0 1 1-2.05-4.95L20 10" /></>,
    download: <><path d="M12 3v11" /><path d="m7 9 5 5 5-5" /><path d="M5 17v3h14v-3" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m16 16 4.2 4.2" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    fit: <><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" /><path d="M8 8h8v8H8z" /></>,
    dots: <><circle cx="6" cy="6" r="1.2" /><circle cx="12" cy="6" r="1.2" /><circle cx="18" cy="6" r="1.2" /><circle cx="6" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="18" cy="12" r="1.2" /><circle cx="6" cy="18" r="1.2" /><circle cx="12" cy="18" r="1.2" /><circle cx="18" cy="18" r="1.2" /></>,
    grain: <><circle cx="6" cy="6" r="1" /><circle cx="12" cy="6" r="1" /><circle cx="18" cy="6" r="1" /><circle cx="6" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="18" cy="12" r="1" /><circle cx="6" cy="18" r="1" /><circle cx="12" cy="18" r="1" /><circle cx="18" cy="18" r="1" /></>,
    image: <><rect x="3.5" y="4" width="17" height="16" rx="1.5" /><path d="m4 16 5-5 3 3 3-4 5 6" /><circle cx="15.8" cy="8.5" r="1.3" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    palette: <><path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.4-3.4 1.6 1.6 0 0 1 1.1-2.7H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7.5" r="1" /><circle cx="15" cy="7.5" r="1" /></>,
    half: <><path d="M12 3a9 9 0 1 0 0 18z" /><path d="M12 3a9 9 0 0 1 0 18" /></>,
    stack: <><path d="m12 3 8 4.5-8 4.5-8-4.5z" /><path d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" /></>,
    sliders: <><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h9M17 18h3" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="15" cy="18" r="2" /></>,
    upload: <><rect x="3.5" y="4" width="17" height="16" rx="2" /><path d="M12 16V9m-3 3 3-3 3 3" /><path d="M16.5 5.5h3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  }
  return <svg {...common}>{paths[name] || paths.dots}</svg>
}

function ParameterSlider({ parameter, onChange, disabled = false }) {
  return <label className="parameter-control" key={parameter.name}>
    <span className="parameter-title"><span>{parameter.name}</span><output>{parameter.value} {parameter.unit}</output></span>
    <input className={`range ${parameter.color}`} type="range" min={parameter.min} max={parameter.max} value={parameter.value} disabled={disabled} onChange={(event) => onChange(Number(event.target.value))} />
    <span className="range-limits"><span>{parameter.min} {parameter.unit}</span><span>{parameter.max} {parameter.unit}</span></span>
  </label>
}

function App() {
  const [image, setImage] = useState(null)
  const [query, setQuery] = useState('')
  const [effects, setEffects] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [history, setHistory] = useState([])
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState('')
  const [viewport, setViewport] = useState({ zoom: 1, x: 0, y: 0 })
  const [viewMode, setViewMode] = useState('2d')
  const [cardPose, setCardPose] = useState({ x: 0, y: 0 })
  const [cardLight, setCardLight] = useState(65)
  const [cardDragging, setCardDragging] = useState(false)
  const fileInput = useRef(null)
  const fileUrl = useRef(null)
  const previewCanvas = useRef(null)
  const canvasPanel = useRef(null)
  const viewportRef = useRef(viewport)
  const cardDragRef = useRef(null)

  useEffect(() => () => {
    if (fileUrl.current) URL.revokeObjectURL(fileUrl.current)
  }, [])

  const filteredGroups = effectGroups.map((group) => ({
    ...group,
    effects: group.effects.filter((effect) => effect.name.toLowerCase().includes(query.trim().toLowerCase())),
  })).filter((group) => group.effects.length)

  const selectedEffect = effects.find((effect) => effect.instanceId === selectedId) || null
  const holographicEffect = effects.find((effect) => effect.id === 'holographic-foil' && effect.enabled)
  useEffect(() => {
    const canvas = previewCanvas.current
    if (!canvas || !image?.element) return

    const scale = Math.min(1, PREVIEW_MAX_SIDE / Math.max(image.width, image.height))
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    renderEffects(image.element, canvas, effects, scale, { skipHolographicFoil: viewMode === '3d' })
  }, [image, effects, viewMode])

  function loadImage(file) {
    if (!file) return
    const validMime = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
    const validExtension = /\.(png|jpe?g|webp)$/i.test(file.name)
    if (!validMime && !validExtension) {
      setNotice('Formato no compatible. Abre una imagen PNG, JPG o WebP.')
      return
    }
    const src = URL.createObjectURL(file)
    const preview = new window.Image()
    preview.onload = () => {
      if (fileUrl.current) URL.revokeObjectURL(fileUrl.current)
      fileUrl.current = src
      setImage({ src, name: file.name, width: preview.naturalWidth, height: preview.naturalHeight, element: preview })
      setEffects([])
      setHistory([])
      setSelectedId(null)
      viewportRef.current = { zoom: 1, x: 0, y: 0 }
      setViewport(viewportRef.current)
      setViewMode('2d')
      setCardPose({ x: 0, y: 0 })
      setNotice('')
    }
    preview.onerror = () => {
      URL.revokeObjectURL(src)
      setNotice('No se pudo abrir esta imagen. Prueba con otro archivo.')
    }
    preview.src = src
  }

  function openPicker() {
    fileInput.current?.click()
  }

  function commitEffects(nextEffects) {
    setHistory((previous) => [...previous, effects])
    setEffects(nextEffects)
  }

  function addEffect(effect) {
    if (!image || PENDING_EFFECT_IDS.has(effect.id) || effects.some((item) => item.id === effect.id)) return
    const instanceId = `${effect.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const channels = effect.id === 'cmyk-shift' ? Object.fromEntries(CMYK_CHANNELS.map((channel) => [channel, true])) : undefined
    const next = [...effects, { ...effect, instanceId, enabled: true, channels, parameters: defaultParameters[effect.id].map((parameter) => ({ ...parameter })) }]
    commitEffects(next)
    setSelectedId(instanceId)
  }

  function selectCatalogEffect(effect) {
    const existing = effects.find((item) => item.id === effect.id)
    if (existing) setSelectedId(existing.instanceId)
    else addEffect(effect)
  }

  function toggleCatalogEffect(effect) {
    const existing = effects.find((item) => item.id === effect.id)
    if (existing) {
      removeEffect(existing.instanceId)
    } else {
      addEffect(effect)
    }
  }

  function updateEffect(instanceId, updater) {
    setEffects((previous) => previous.map((effect) => effect.instanceId === instanceId ? updater(effect) : effect))
  }

  function updateParameter(instanceId, name, value) {
    updateEffect(instanceId, (current) => ({
      ...current,
      parameters: current.parameters.map((parameter) => parameter.name === name ? { ...parameter, value } : parameter),
    }))
  }

  function removeEffect(instanceId) {
    const nextEffects = effects.filter((effect) => effect.instanceId !== instanceId)
    commitEffects(nextEffects)
    if (selectedId === instanceId) setSelectedId(nextEffects.at(-1)?.instanceId || null)
  }

  function undo() {
    if (!history.length) return
    setEffects(history[history.length - 1])
    setHistory((previous) => previous.slice(0, -1))
    const remaining = history[history.length - 1]
    if (!selectedId || !remaining.some((effect) => effect.instanceId === selectedId)) {
      setSelectedId(remaining.at(-1)?.instanceId || null)
    }
  }

  function reset() {
    if (!image) return
    if (effects.length) setHistory((previous) => [...previous, effects])
    setEffects([])
    setSelectedId(null)
  }

  function exportPng() {
    if (!image) return
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    renderEffects(image.element, canvas, effects, 1, {
      light: viewMode === '3d' ? cardLight : 100,
      tiltX: viewMode === '3d' ? cardPose.x : 0,
      tiltY: viewMode === '3d' ? cardPose.y : 0,
    })
    canvas.toBlob((blob) => {
      if (!blob) return
      const href = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = href
      link.download = `${image.name.replace(/\.[^.]+$/, '')}.png`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(href), 0)
    }, 'image/png')
  }

  function onDrop(event) {
    event.preventDefault()
    setDragging(false)
    loadImage(event.dataTransfer.files?.[0])
  }

  function setCanvasViewport(nextViewport) {
    viewportRef.current = nextViewport
    setViewport(nextViewport)
  }

  function zoomAt(nextZoom, clientX, clientY) {
    const canvas = previewCanvas.current
    const stage = canvasPanel.current
    if (!canvas || !stage) return

    const current = viewportRef.current
    const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
    if (zoom === current.zoom) return
    if (viewMode === '3d') {
      setCanvasViewport({ zoom, x: 0, y: 0 })
      return
    }

    const rect = canvas.getBoundingClientRect()
    const stageRect = stage.getBoundingClientRect()
    const width = rect.width / current.zoom
    const height = rect.height / current.zoom
    const baseLeft = rect.left - current.x
    const baseTop = rect.top - current.y
    const localX = (clientX - rect.left) / current.zoom
    const localY = (clientY - rect.top) / current.zoom
    let x = clientX - localX * zoom - baseLeft
    let y = clientY - localY * zoom - baseTop
    const scaledWidth = width * zoom
    const scaledHeight = height * zoom
    const stageWidth = stageRect.width
    const stageHeight = stageRect.height

    if (scaledWidth >= stageWidth) x = Math.min(stageRect.left - baseLeft, Math.max(stageRect.right - scaledWidth - baseLeft, x))
    else x = Math.min(stageRect.right - scaledWidth - baseLeft, Math.max(stageRect.left - baseLeft, x))
    if (scaledHeight >= stageHeight) y = Math.min(stageRect.top - baseTop, Math.max(stageRect.bottom - scaledHeight - baseTop, y))
    else y = Math.min(stageRect.bottom - scaledHeight - baseTop, Math.max(stageRect.top - baseTop, y))

    setCanvasViewport({ zoom, x, y })
  }

  function handleCanvasWheel(event) {
    event.preventDefault()
    event.stopPropagation()
    const factor = Math.exp(-event.deltaY * 0.0015)
    zoomAt(viewportRef.current.zoom * factor, event.clientX, event.clientY)
  }

  function stepZoom(direction) {
    const stage = canvasPanel.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    zoomAt(viewportRef.current.zoom * (direction > 0 ? 1.2 : 1 / 1.2), rect.left + rect.width / 2, rect.top + rect.height / 2)
  }

  function fitCanvas() {
    setCanvasViewport({ zoom: 1, x: 0, y: 0 })
  }

  function changeViewMode(mode) {
    setViewMode(mode)
    setCardPose({ x: 0, y: 0 })
    setCanvasViewport({ zoom: 1, x: 0, y: 0 })
  }

  function startCardDrag(event) {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    cardDragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, origin: cardPose }
    setCardDragging(true)
  }

  function moveCardDrag(event) {
    const drag = cardDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setCardPose({
      x: clamp(drag.origin.x + (event.clientX - drag.x) * 0.35, -28, 28),
      y: clamp(drag.origin.y - (event.clientY - drag.y) * 0.35, -28, 28),
    })
  }

  function endCardDrag(event) {
    if (!cardDragRef.current || cardDragRef.current.pointerId !== event.pointerId) return
    cardDragRef.current = null
    setCardDragging(false)
  }

  function resetCardPose() {
    setCardPose({ x: 0, y: 0 })
  }

  useEffect(() => {
    const canvas = previewCanvas.current
    if (!canvas) return
    const preventPageScroll = (event) => handleCanvasWheel(event)
    canvas.addEventListener('wheel', preventPageScroll, { passive: false })
    return () => canvas.removeEventListener('wheel', preventPageScroll)
  }, [image, viewMode])

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="HOLO LAB inicio" data-holo-label="HOLO//LAB">HOLO<span>//</span>LAB</a>
        <div className="topbar-divider" />
        <button className="toolbar-button open-button" onClick={openPicker}>
          <Icon name="folder" size={18} /> <span>Abrir imagen</span>
        </button>
        <input ref={fileInput} className="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp" onChange={(event) => { loadImage(event.target.files?.[0]); event.target.value = '' }} />
        <button className="toolbar-button" disabled={!image || history.length === 0} onClick={undo}>
          <Icon name="undo" size={17} /><span>Deshacer</span>
        </button>
        <button className="toolbar-button" disabled={!image} onClick={reset}>
          <Icon name="reset" size={17} /><span>Restablecer</span>
        </button>
        <div className="file-meta">
          {image && <><span className="raw-chip">IMG</span><span className="file-name">{image.name}</span><span className="meta-dot">·</span><span>{image.width} × {image.height} px</span></>}
        </div>
        <button className="export-button" disabled={!image} onClick={exportPng}>
          <Icon name="download" size={16} /><span>Exportar PNG</span>
        </button>
      </header>

      <div className="workspace">
        <aside className="catalog-panel">
          <div className="search-box">
            <Icon name="search" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar efecto… (/)" aria-label="Buscar efecto" />
          </div>
          <div className="catalog-list">
            {filteredGroups.map((group) => (
              <section className="effect-group" key={group.name}>
                <h2>{group.name}</h2>
                {group.effects.map((effect) => {
                  const appliedEffect = effects.find((item) => item.id === effect.id)
                  const alreadyAdded = Boolean(appliedEffect)
                  const pending = PENDING_EFFECT_IDS.has(effect.id)
                  const selected = appliedEffect?.instanceId === selectedId
                  return <div className={`catalog-item ${selected ? 'selected' : ''} ${pending ? 'is-pending' : ''}`} key={effect.id}>
                    <button type="button" className="catalog-select" disabled={!image || pending} title={pending ? 'Pendiente para una próxima etapa' : undefined} onClick={() => selectCatalogEffect(effect)}>
                      <span className={`catalog-icon ${effect.id}`}><Icon name={effect.icon} size={16} /></span>
                      <span className="catalog-name">{effect.name}</span>
                      {pending && <span className="pending-badge">Pendiente</span>}
                    </button>
                    {!pending && <button type="button" className={`toggle catalog-switch ${appliedEffect?.enabled ? 'on' : ''}`} disabled={!image} aria-label={`${appliedEffect?.enabled ? 'Desactivar' : 'Activar'} ${effect.name}`} aria-pressed={Boolean(appliedEffect?.enabled)} onClick={() => toggleCatalogEffect(effect)}><span /></button>}
                  </div>
                })}
              </section>
            ))}
            {!filteredGroups.length && <p className="no-results">No hay efectos con ese nombre.</p>}
          </div>
        </aside>

        <section ref={canvasPanel} className="canvas-panel" onDragEnter={(event) => { event.preventDefault(); setDragging(true) }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false) }} onDrop={onDrop}>
          {notice && <div className="notice" role="alert">{notice}<button aria-label="Cerrar aviso" onClick={() => setNotice('')}><Icon name="close" size={15} /></button></div>}
          {image ? <div className={`image-stage ${viewMode === '3d' ? 'card-3d-scene' : ''}`}>
            <div
              className={`image-card ${viewMode === '3d' ? 'is-3d' : ''} ${cardDragging ? 'is-dragging' : ''}`}
              style={{ transform: viewMode === '3d' ? `rotateX(${cardPose.y}deg) rotateY(${cardPose.x}deg) scale(${viewport.zoom})` : `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})` }}
              onPointerDown={viewMode === '3d' ? startCardDrag : undefined}
              onPointerMove={viewMode === '3d' ? moveCardDrag : undefined}
              onPointerUp={viewMode === '3d' ? endCardDrag : undefined}
              onPointerCancel={viewMode === '3d' ? endCardDrag : undefined}
              onLostPointerCapture={viewMode === '3d' ? endCardDrag : undefined}
            >
              <canvas ref={previewCanvas} className="preview-canvas" aria-label={`Vista previa de ${image.name}${effects.length ? ' con efectos activos' : ''}`} />
              {viewMode === '3d' && <>
                <div className="card-light" style={{ '--light-x': `${50 + cardPose.x * 1.4}%`, '--light-y': `${50 - cardPose.y * 1.4}%`, opacity: cardLight / 100 }} />
                {holographicEffect && <div className="foil-reflection" data-pattern={parameterValue(holographicEffect, 'Patrón', 'Arcoíris espectral')} style={{
                  '--foil-x': `${50 + cardPose.x * 1.55}%`,
                  '--foil-y': `${50 - cardPose.y * 1.55}%`,
                  '--foil-x-2': `${73 - cardPose.x * 0.82}%`,
                  '--foil-y-2': `${28 + cardPose.y * 0.64}%`,
                  '--foil-x-3': `${21 + cardPose.y * 0.52}%`,
                  '--foil-y-3': `${76 - cardPose.x * 0.46}%`,
                  '--foil-angle': `${34 + cardPose.x * 1.2 - cardPose.y * 0.85}deg`,
                  '--foil-diffraction-angle': `${72 + cardPose.x * 0.8 + cardPose.y * 1.15}deg`,
                  '--foil-hue': `${(cardPose.x - cardPose.y) * 2.2}deg`,
                  '--foil-brightness': 0.6 + parameterValue(holographicEffect, 'Brillo', 82) / 100 * 0.7,
                  '--foil-band-opacity': Math.min(0.9, parameterValue(holographicEffect, 'Intensidad', 105) / 100 * (0.36 + parameterValue(holographicEffect, 'Brillo', 82) / 100 * 0.64) * (0.2 + cardLight / 100 * 0.8)),
                  '--foil-texture-opacity': Math.min(0.58, parameterValue(holographicEffect, 'Intensidad', 105) / 100 * (0.18 + parameterValue(holographicEffect, 'Brillo', 82) / 100 * 0.36) * (0.15 + cardLight / 100 * 0.85)),
                }}>
                  <svg className="foil-filter-defs" aria-hidden="true" focusable="false">
                    <defs>
                      <filter id="holo-wave-warp" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.008 0.022" numOctaves="2" seed="19" result="waveNoise" /><feDisplacementMap in="SourceGraphic" in2="waveNoise" scale="26" xChannelSelector="R" yChannelSelector="G" /></filter>
                      <filter id="holo-prism-fracture" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.028 0.017" numOctaves="2" seed="31" result="prismNoise" /><feDisplacementMap in="SourceGraphic" in2="prismNoise" scale="20" xChannelSelector="R" yChannelSelector="G" /></filter>
                      <filter id="holo-glint-warp" x="-12%" y="-12%" width="124%" height="124%" colorInterpolationFilters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.018 0.04" numOctaves="1" seed="11" result="glintNoise" /><feDisplacementMap in="SourceGraphic" in2="glintNoise" scale="9" xChannelSelector="R" yChannelSelector="G" /></filter>
                    </defs>
                  </svg>
                </div>}
              </>}
            </div>
          </div> : <button className={`drop-area ${dragging ? 'is-dragging' : ''}`} onClick={openPicker}>
            <span className="upload-icon"><Icon name="upload" size={30} /></span>
            <strong>{dragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen aquí'}</strong>
            <span className="accepted-formats">PNG, JPG o WebP</span>
          </button>}
          {image && <div className="zoom-toolbar" aria-label="Controles de zoom">
            <div className="view-switch" role="group" aria-label="Modo de vista">
              <button type="button" className={viewMode === '2d' ? 'selected' : ''} aria-pressed={viewMode === '2d'} onClick={() => changeViewMode('2d')}>2D</button>
              <button type="button" className={viewMode === '3d' ? 'selected' : ''} aria-pressed={viewMode === '3d'} onClick={() => changeViewMode('3d')}>Tarjeta 3D</button>
            </div>
            <button type="button" className="zoom-button" aria-label="Alejar" disabled={viewport.zoom <= MIN_ZOOM} onClick={() => stepZoom(-1)}><Icon name="minus" size={15} /></button>
            <output className="zoom-value" aria-live="polite">{Math.round(viewport.zoom * 100)}%</output>
            <button type="button" className="zoom-button" aria-label="Acercar" disabled={viewport.zoom >= MAX_ZOOM} onClick={() => stepZoom(1)}><Icon name="plus" size={15} /></button>
            <span className="zoom-divider" />
            <button type="button" className="fit-button" onClick={fitCanvas}><Icon name="fit" size={14} />Ajustar</button>
            {viewMode === '3d' && <>
              <label className="light-control"><span>Luz</span><input type="range" min="0" max="100" value={cardLight} aria-label="Intensidad de luz de la tarjeta" onChange={(event) => setCardLight(Number(event.target.value))} /></label>
              <button type="button" className="fit-button reset-pose-button" onClick={resetCardPose}>Restablecer posición</button>
            </>}
          </div>}
        </section>

        <aside className={`inspector-panel ${!image ? 'is-empty' : ''}`}>
          <section className="stack-section">
            <div className="panel-heading">
              <h2><Icon name="stack" size={18} /> EFECTOS APLICADOS <span className="count-inline">({effects.length})</span></h2>
              {image && effects.length > 0 && <span className="active-count">{effects.length} ACTIVOS</span>}
            </div>
            {!image ? <div className="right-empty">
              <span className="empty-icon"><Icon name="sliders" size={25} /></span>
              <p>Los efectos y sus ajustes aparecerán aquí cuando cargues una imagen</p>
            </div> : effects.length === 0 ? <div className="stack-empty"><p>Aún no hay efectos</p><span>Selecciona uno del catálogo para añadirlo</span></div> : <div className="applied-list">
              {effects.map((effect) => <div key={effect.instanceId} className={`applied-item ${selectedId === effect.instanceId ? 'selected' : ''}`}>
                <button type="button" className="applied-select" onClick={() => setSelectedId(effect.instanceId)}>
                  <span className="drag-handle"><Icon name="dots" size={15} /></span>
                  <span className="applied-info"><strong>{effect.name}</strong><small>{effect.description}</small></span>
                </button>
                <button type="button" className="remove-effect" onClick={() => removeEffect(effect.instanceId)}>Quitar</button>
              </div>)}
            </div>}
          </section>

          {image && selectedEffect && <section className="parameters-section">
            <div className="parameters-heading"><h2><Icon name="sliders" size={18} /> PARÁMETROS DE {selectedEffect.name.toUpperCase()}</h2></div>
            <div className="parameter-list">
              {selectedEffect.id === 'cmyk-shift' ? <>
                <div className="cmyk-channels">
                  {CMYK_CHANNELS.map((channel) => {
                    const enabled = selectedEffect.channels?.[channel] ?? true
                    const channelParameters = selectedEffect.parameters.filter((parameter) => parameter.name.startsWith(`Desplazamiento ${channel} `))
                    return <section className={`cmyk-channel ${enabled ? '' : 'is-disabled'}`} key={channel}>
                      <div className="cmyk-channel-heading">
                        <span className={`cmyk-swatch ${channel.toLowerCase()}`} />
                        <strong>{channel}</strong>
                        <label className="channel-switch">
                          <span>{enabled ? 'Incluir canal' : 'Excluir canal'}</span>
                          <input type="checkbox" checked={enabled} aria-label={`${enabled ? 'Excluir' : 'Incluir'} canal ${channel}`} onChange={(event) => updateEffect(selectedEffect.instanceId, (current) => ({ ...current, channels: { ...current.channels, [channel]: event.target.checked } }))} />
                        </label>
                      </div>
                      {channelParameters.map((parameter) => <ParameterSlider key={parameter.name} parameter={parameter} disabled={!enabled} onChange={(value) => updateParameter(selectedEffect.instanceId, parameter.name, value)} />)}
                    </section>
                  })}
                </div>
                <ParameterSlider parameter={selectedEffect.parameters.find((parameter) => parameter.name === 'Intensidad')} onChange={(value) => updateParameter(selectedEffect.instanceId, 'Intensidad', value)} />
              </> : selectedEffect.parameters.filter((parameter) => typeof parameter.value === 'number' && !(selectedEffect.id === 'halftone' && parameter.name === 'Forma de trama')).map((parameter) => <ParameterSlider key={parameter.name} parameter={parameter} onChange={(value) => updateParameter(selectedEffect.instanceId, parameter.name, value)} />)}
              {selectedEffect.id === 'duotone' && <div className="duotone-colors">
                {['Sombras', 'Luces'].map((name) => <label className="duotone-color-control" key={name}>
                  <span>{name}</span>
                  <input type="color" value={parameterValue(selectedEffect, name, '#000000')} aria-label={`Color de ${name.toLowerCase()}`} onChange={(event) => updateEffect(selectedEffect.instanceId, (current) => ({ ...current, parameters: current.parameters.map((parameter) => parameter.name === name ? { ...parameter, value: event.target.value } : parameter) }))} />
                </label>)}
              </div>}
              {selectedEffect.id === 'halftone' && <div className="parameter-control shape-control">
                <span className="parameter-title"><span>Forma de trama</span></span>
                <div className="segmented-control">{['Puntos', 'Líneas', 'Diamante'].map((shape) => <button key={shape} className={parameterValue(selectedEffect, 'Forma de trama', 'Puntos') === shape ? 'selected' : ''} onClick={() => updateEffect(selectedEffect.instanceId, (current) => ({ ...current, parameters: current.parameters.map((parameter) => parameter.name === 'Forma de trama' ? { ...parameter, value: shape } : parameter) }))}>{shape}</button>)}</div>
              </div>}
              {selectedEffect.id === 'halftone' && parameterValue(selectedEffect, 'Forma de trama', 'Puntos') === 'Líneas' && <div className="parameter-control shape-control">
                <span className="parameter-title"><span>Orientación de líneas</span></span>
                <div className="segmented-control orientation-control">{['Horizontal', 'Vertical'].map((orientation) => <button type="button" key={orientation} className={parameterValue(selectedEffect, 'Orientación', 'Horizontal') === orientation ? 'selected' : ''} onClick={() => updateParameter(selectedEffect.instanceId, 'Orientación', orientation)}>{orientation}</button>)}</div>
              </div>}
              {selectedEffect.id === 'halftone' && <>
                <div className="parameter-control shape-control">
                  <span className="parameter-title"><span>Modo de color</span></span>
                  <div className="segmented-control dithering-mode-control">{['Colores originales', 'Dos colores'].map((mode) => <button type="button" key={mode} className={parameterValue(selectedEffect, 'Modo', 'Colores originales') === mode ? 'selected' : ''} onClick={() => updateParameter(selectedEffect.instanceId, 'Modo', mode)}>{mode}</button>)}</div>
                </div>
                {parameterValue(selectedEffect, 'Modo', 'Colores originales') === 'Dos colores' && <div className="duotone-colors">
                  {['Tinta', 'Fondo'].map((name) => <label className="duotone-color-control" key={name}>
                    <span>{name}</span>
                    <input type="color" value={parameterValue(selectedEffect, name, name === 'Tinta' ? '#111018' : '#ed78ef')} aria-label={`Color de ${name.toLowerCase()}`} onChange={(event) => updateParameter(selectedEffect.instanceId, name, event.target.value)} />
                  </label>)}
                </div>}
              </>}
              {selectedEffect.id === 'bitmap' && <div className="duotone-colors">
                {['Tinta', 'Fondo'].map((name) => <label className="duotone-color-control" key={name}>
                  <span>{name}</span>
                  <input type="color" value={parameterValue(selectedEffect, name, name === 'Tinta' ? '#073b35' : '#a9f5d0')} aria-label={`Color de ${name.toLowerCase()}`} onChange={(event) => updateParameter(selectedEffect.instanceId, name, event.target.value)} />
                </label>)}
              </div>}
              {selectedEffect.id === 'dithering' && <>
                <div className="parameter-control shape-control">
                  <span className="parameter-title"><span>Textura</span></span>
                  <div className="segmented-control dithering-pattern-control">{['Puntos', 'Líneas verticales', 'Líneas horizontales', 'Diagonales', 'Trama cruzada', 'Cuadrícula'].map((texture) => <button type="button" key={texture} className={parameterValue(selectedEffect, 'Textura', 'Puntos') === texture ? 'selected' : ''} onClick={() => updateParameter(selectedEffect.instanceId, 'Textura', texture)}>{texture}</button>)}</div>
                </div>
                <div className="parameter-control shape-control">
                  <span className="parameter-title"><span>Modo de color</span></span>
                  <div className="segmented-control dithering-mode-control">{['Colores originales', 'Dos colores'].map((mode) => <button type="button" key={mode} className={parameterValue(selectedEffect, 'Modo', 'Dos colores') === mode ? 'selected' : ''} onClick={() => updateParameter(selectedEffect.instanceId, 'Modo', mode)}>{mode}</button>)}</div>
                </div>
                {parameterValue(selectedEffect, 'Modo', 'Dos colores') === 'Dos colores' && <div className="duotone-colors">
                  {['Tinta', 'Fondo'].map((name) => <label className="duotone-color-control" key={name}>
                    <span>{name}</span>
                    <input type="color" value={parameterValue(selectedEffect, name, name === 'Tinta' ? '#100d14' : '#ed78ef')} aria-label={`Color de ${name.toLowerCase()}`} onChange={(event) => updateParameter(selectedEffect.instanceId, name, event.target.value)} />
                  </label>)}
                </div>}
              </>}
              {selectedEffect.id === 'holographic-foil' && <div className="parameter-control foil-pattern-control">
                <span className="parameter-title"><span>Patrón holográfico</span></span>
                <div className="segmented-control">{['Arcoíris espectral', 'Prisma angular', 'Ondas', 'Destellos radiales', 'Microtrama de foil'].map((pattern) => <button type="button" key={pattern} className={parameterValue(selectedEffect, 'Patrón', 'Arcoíris espectral') === pattern ? 'selected' : ''} onClick={() => updateParameter(selectedEffect.instanceId, 'Patrón', pattern)}>{pattern}</button>)}</div>
              </div>}
            </div>
            <p className="stage-note">Los efectos de la pila se procesan en Canvas y se pueden combinar.</p>
          </section>}
        </aside>
      </div>
    </main>
  )
}

export default App
