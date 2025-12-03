import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import DetectionList from '../components/DetectionList'
import { loadModel, runInference } from '../utils/onnxUtils'

const MODELS = [
    { id: 'coco', name: 'COCO model (yolov8s)', path: '/model_coco.onnx' },
    { id: 'custom', name: 'Custom model', path: '/model_custom.onnx' }
]

function Upload() {
    const navigate = useNavigate()
    const [modelLoaded, setModelLoaded] = useState(false)
    const [isDetecting, setIsDetecting] = useState(false)
    const [detections, setDetections] = useState([])
    const [error, setError] = useState(null)
    const [loadingMessage, setLoadingMessage] = useState('Initializing...')
    const [selectedModel, setSelectedModel] = useState(MODELS[0].path)
    const [imageLoaded, setImageLoaded] = useState(false)

    const imageRef = useRef(null)
    const canvasRef = useRef(null)
    const modelRef = useRef(null)

    // Load ONNX model
    useEffect(() => {
        const initModel = async () => {
            setModelLoaded(false)
            setError(null)
            try {
                setLoadingMessage(`Loading ${MODELS.find(m => m.path === selectedModel)?.name}...`)
                const model = await loadModel(selectedModel)
                modelRef.current = model
                setModelLoaded(true)
                setLoadingMessage('Model loaded successfully!')
            } catch (err) {
                console.error('Model loading error:', err)
                setError(`Failed to load model. Please ensure ${selectedModel} is in the public folder.`)
            }
        }
        initModel()
    }, [selectedModel])

    // Draw image when loaded
    useEffect(() => {
        if (imageLoaded && imageRef.current && canvasRef.current) {
            const canvas = canvasRef.current
            const img = imageRef.current
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0)
        }
    }, [imageLoaded])

    const handleImageUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
                imageRef.current = img
                setImageLoaded(true)
                setDetections([])
            }
            img.src = event.target.result
        }
        reader.readAsDataURL(file)
    }

    const runDetection = async () => {
        if (!imageRef.current || !modelRef.current || !canvasRef.current) return

        setIsDetecting(true)
        try {
            const results = await runInference(modelRef.current, imageRef.current)
            setDetections(results)
            drawDetections(results)
        } catch (err) {
            console.error('Detection error:', err)
            setError('Detection failed: ' + err.message)
        } finally {
            setIsDetecting(false)
        }
    }

    const drawDetections = (results) => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        // Redraw image to clear previous boxes
        ctx.drawImage(imageRef.current, 0, 0)

        // Draw new boxes
        results.forEach(det => {
            const { x, y, width, height, label, confidence, classId } = det

            // Get color based on class ID (10 distinct neon colors)
            const colors = [
                '#00BFFF', '#FF00FF', '#00FF00', '#FFFF00', '#FF4500',
                '#9400D3', '#00CED1', '#FF1493', '#7FFF00', '#FFD700'
            ]
            const color = colors[classId % colors.length]

            // Draw box
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.strokeRect(x, y, width, height)

            // Draw background for text
            const text = `${label} ${Math.round(confidence * 100)}%`
            ctx.font = '16px "Inter", sans-serif'
            const textMetrics = ctx.measureText(text)

            ctx.fillStyle = color
            ctx.fillRect(x, y - 24, textMetrics.width + 10, 24)

            // Draw text
            ctx.fillStyle = '#000000'
            ctx.fillText(text, x + 5, y - 7)
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-4 border-b border-neon-blue/20 backdrop-blur-sm bg-black/50"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <h1
                        className="text-3xl md:text-4xl font-bold tracking-wider cursor-pointer"
                        onClick={() => navigate('/')}
                        style={{
                            background: 'linear-gradient(to right, #00BFFF, #33CCFF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        LIVEYE
                    </h1>
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 rounded-lg border border-neon-blue/50 hover:bg-neon-blue/10 
                     transition-all duration-300 text-sm"
                    >
                        ← Back
                    </button>
                </div>
            </motion.header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Image Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neon-blue/20">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-neon-blue">Upload Image</h2>

                                {/* Model Selector */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">Model:</span>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="bg-black/50 border border-neon-blue/30 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-neon-blue"
                                        disabled={isDetecting}
                                    >
                                        {MODELS.map(model => (
                                            <option key={model.id} value={model.path}>
                                                {model.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Image Display Area */}
                            <div className="relative min-h-[400px] bg-black rounded-lg overflow-hidden border-2 border-dashed border-gray-700 flex items-center justify-center">
                                {!imageLoaded ? (
                                    <div className="text-center p-8">
                                        <div className="mb-4 text-gray-400">
                                            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p>Select an image to analyze</p>
                                        </div>
                                        <label className="cursor-pointer bg-neon-blue text-black px-6 py-2 rounded-lg font-semibold hover:bg-neon-light transition-colors">
                                            Choose File
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <div className="relative w-full h-full flex justify-center bg-black">
                                        <canvas
                                            ref={canvasRef}
                                            className="max-w-full max-h-[600px] object-contain"
                                        />

                                        {/* Controls Overlay */}
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                            {!isDetecting && detections.length === 0 && (
                                                <button
                                                    onClick={runDetection}
                                                    disabled={!modelLoaded}
                                                    className={`px-6 py-2 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105
                                                        ${modelLoaded
                                                            ? 'bg-neon-blue text-black hover:bg-neon-light'
                                                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    Scan Image
                                                </button>
                                            )}

                                            <button
                                                onClick={() => {
                                                    setImageLoaded(false)
                                                    setDetections([])
                                                    imageRef.current = null
                                                }}
                                                className="bg-red-500/80 text-white px-4 py-2 rounded-full hover:bg-red-500 transition-colors shadow-lg"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Status Messages */}
                            <div className="mt-4 space-y-2">
                                {!modelLoaded && (
                                    <div className="text-yellow-400 text-sm flex items-center gap-2">
                                        <div className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                                        {loadingMessage}
                                    </div>
                                )}
                                {error && (
                                    <div className="text-red-400 text-sm">❌ {error}</div>
                                )}
                                {modelLoaded && !error && (
                                    <div className="text-green-400 text-sm">✓ Model ready</div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Detection List Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-1"
                    >
                        <DetectionList detections={detections} isDetecting={isDetecting} />
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default Upload
