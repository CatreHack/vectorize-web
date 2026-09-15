import { useState, useCallback, useRef } from 'react'

// URL base del backend, sin barra final y SIEMPRE terminada en /api.
// Esto permite definir VITE_API_BASE con o sin el sufijo /api sin romper nada:
//   VITE_API_BASE=https://mi-api.onrender.com
//   VITE_API_BASE=https://mi-api.onrender.com/api
// Ambas formas dan el mismo resultado correcto.
function normalizeApiBase(raw) {
  const value = (raw || '/api').trim().replace(/\/+$/, '')
  return value.endsWith('/api') ? value : `${value}/api`
}

const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE)

function bytesToSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Decodifica base64 UTF-8 de forma segura (atob solo maneja latin1 y
// rompe los acentos dentro del SVG).
function b64ToUtf8(b64) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder('utf-8').decode(bytes)
}

export default function App() {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [status, setStatus] = useState('idle') // idle | dragging | converting | done | error
  const [result, setResult] = useState(null) // { svgText, pngUrl, jobId }
  const [errorMsg, setErrorMsg] = useState('')
  const inputRef = useRef(null)

  const reset = useCallback(() => {
    setFile(null)
    setPreviewUrl(null)
    setResult(null)
    setErrorMsg('')
    setStatus('idle')
  }, [])

  const handleFile = useCallback((selected) => {
    if (!selected) return
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(selected.type)) {
      setErrorMsg('Formato no soportado. Usá JPG, PNG o WEBP.')
      setStatus('error')
      return
    }
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
    setResult(null)
    setErrorMsg('')
    setStatus('idle')
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      handleFile(e.dataTransfer.files?.[0])
    },
    [handleFile]
  )

  const convert = useCallback(async () => {
    if (!file) return
    setStatus('converting')
    setErrorMsg('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`${API_BASE}/convert`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || 'No se pudo procesar la imagen.')
      }
      const data = await res.json()
      const svgText = b64ToUtf8(data.svg_base64)
      const pngUrl = `data:image/png;base64,${data.png_base64}`
      if (!svgText.includes('<svg')) {
        throw new Error('El servidor devolvio un SVG vacio.')
      }
      setResult({ svgText, pngUrl, jobId: data.job_id })
      setStatus('done')
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.')
      setStatus('error')
    }
  }, [file])

  // Nombre base del archivo original, sin extension, para reusarlo al descargar.
  const baseName = (file?.name || 'resultado').replace(/\.[^.]+$/, '')

  const downloadSvg = () => {
    const blob = new Blob([result.svgText], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}.svg`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const downloadPng = () => {
    const a = document.createElement('a')
    a.href = result.pngUrl
    a.download = `${baseName}.png`
    a.click()
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="22" height="22">
            <path
              d="M4 24 C 8 8, 16 8, 16 16 S 24 24, 28 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="brand">Traza</span>
      </header>

      <main className="content">
        <div className="intro">
          <p className="eyebrow">logos · firmas · dibujos · gráficos simples</p>
          <h1>Convertí tu imagen en un vector limpio</h1>
          <p className="lede">
            Subí un JPG o PNG. Recibís un SVG editable y un PNG con fondo
            transparente, listos para usar.
          </p>
        </div>

        {!result && (
          <div
            className={`dropzone ${status === 'dragging' ? 'dropzone--active' : ''} ${
              status === 'error' ? 'dropzone--error' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault()
              setStatus('dragging')
            }}
            onDragLeave={() => setStatus(file ? 'idle' : 'idle')}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            {previewUrl ? (
              <div className="preview">
                <img src={previewUrl} alt="Vista previa" />
                <div className="preview-meta">
                  <span>{file.name}</span>
                  <span className="dim">{bytesToSize(file.size)}</span>
                </div>
              </div>
            ) : (
              <div className="dropzone-hint">
                <svg viewBox="0 0 24 24" width="28" height="28" className="dropzone-icon">
                  <path
                    d="M12 3v12m0-12 4.5 4.5M12 3 7.5 7.5M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p>Arrastrá una imagen acá o hacé clic para elegirla</p>
                <p className="dim">JPG, PNG o WEBP · hasta 10MB</p>
              </div>
            )}
          </div>
        )}

        {status === 'error' && errorMsg && <p className="error-text">{errorMsg}</p>}

        {file && !result && (
          <div className="actions">
            <button className="btn btn-ghost" onClick={reset} disabled={status === 'converting'}>
              Elegir otra imagen
            </button>
            <button
              className="btn btn-primary"
              onClick={convert}
              disabled={status === 'converting'}
            >
              {status === 'converting' ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Trazando…
                </>
              ) : (
                'Convertir a vector'
              )}
            </button>
          </div>
        )}

        {result && (
          <div className="result">
            <div className="result-grid">
              <div className="result-panel">
                <p className="panel-label">Original</p>
                <div className="panel-frame checker">
                  <img src={previewUrl} alt="Imagen original" />
                </div>
              </div>
              <div className="result-panel">
                <p className="panel-label">PNG transparente</p>
                <div className="panel-frame checker">
                  <img src={result.pngUrl} alt="PNG con fondo transparente" />
                </div>
              </div>
              <div className="result-panel">
                <p className="panel-label">SVG vectorial</p>
                <div
                  className="panel-frame checker"
                  dangerouslySetInnerHTML={{ __html: result.svgText }}
                />
              </div>
            </div>

            <div className="download-block">
              <p className="download-label">Descargá tu resultado</p>
              <div className="actions">
                <button className="btn btn-primary" onClick={downloadSvg}>
                  ⬇ Descargar SVG (vector)
                </button>
                <button className="btn btn-secondary" onClick={downloadPng}>
                  ⬇ Descargar PNG (transparente)
                </button>
                <button className="btn btn-ghost" onClick={reset}>
                  Convertir otra imagen
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        <span>Traza · vectorización de imágenes · SVG + PNG transparente</span>
      </footer>
    </div>
  )
}
