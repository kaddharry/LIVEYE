import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import CameraFeed from '../components/CameraFeed'
import DetectionList from '../components/DetectionList'
import { loadModel, runInference } from '../utils/onnxUtils'

const MODELS = [
    { id: 'coco', name: 'COCO model (yolov8s)', path: '/model_coco.onnx' },
    { id: 'custom', name: 'Custom model', path: '/model_custom.onnx' }
]

function Snapshot() {
    const navigate = useNavigate()
    const [cameraReady, setCameraReady] = useState(false)
    const [modelLoaded, setModelLoaded] = useState(false)
    const [isDetecting, setIsDetecting] = useState(false)
    const [detections, setDetections] = useState([])
    const [error, setError] = useState(null)
    const [loadingMessage, setLoadingMessage] = useState('Initializing...')
    const [selectedModel, setSelectedModel] = useState(MODELS[0].path)
    const [capturedImage, setCapturedImage] = useState(null)

    const videoRef = useRef(null)
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

    // Draw captured image when available
    useEffect(() => {
        if (capturedImage && canvasRef.current) {
            const img = new Image()
            img.onload = () => {
                const canvas = canvasRef.current
                canvas.width = img.width
                canvas.height = img.height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0)
            }
            img.src = capturedImage
        }
    }, [capturedImage])

    const capturePhoto = async () => {
        if (!videoRef.current) return

        const video = videoRef.current
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)

        setCapturedImage(canvas.toDataURL('image/png'))
        // Detection is now triggered manually via "Scan Photo" button
    }

    const runScan = async () => {
        if (!capturedImage || !modelRef.current) return

        setIsDetecting(true)
        try {
            // Create an image element from the captured data URL
            const img = new Image()
            img.onload = async () => {
                try {
                    const results = await runInference(modelRef.current, img)
                    setDetections(results)
                    drawDetections(img, results)
                } catch (err) {
                    console.error('Inference error:', err)
                    setError('Inference failed: ' + err.message)
                } finally {
                    setIsDetecting(false)
                }
            }
            img.src = capturedImage
        } catch (err) {
            console.error('Detection error:', err)
            setError('Detection failed: ' + err.message)
            setIsDetecting(false)
        }
    }

    const drawDetections = (sourceImage, results) => {
        const canvas = canvasRef.current
        if (!canvas) return

        canvas.width = sourceImage.width
        canvas.height = sourceImage.height
        const ctx = canvas.getContext('2d')

        // Draw original image
        ctx.drawImage(sourceImage, 0, 0)

        // Draw boxes
        results.forEach(det => {
            const { x, y, width, height, label, confidence, classId } = det

            // Get color based on class ID
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

    const retakePhoto = () => {
        setCapturedImage(null)
        setDetections([])
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
                    {/* Camera/Image Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neon-blue/20">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-neon-blue">
                                    {capturedImage ? 'Analysis Result' : 'Take Photo'}
                                </h2>

                                {/* Model Selector */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">Model:</span>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="bg-black/50 border border-neon-blue/30 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-neon-blue"
                                        disabled={isDetecting || capturedImage}
                                    >
                                        {MODELS.map(model => (
                                            <option key={model.id} value={model.path}>
                                                {model.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Camera Feed or Captured Image */}
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-gray-800">
                                {!capturedImage ? (
                                    <CameraFeed
                                        videoRef={videoRef}
                                        onReady={() => setCameraReady(true)}
                                        onError={(err) => setError(err)}
                                    />
                                ) : (
                                    <canvas
                                        ref={canvasRef}
                                        className="w-full h-full object-contain"
                                    />
                                )}
                            </div>

                            {/* Controls */}
                            <div className="mt-6 flex justify-center gap-4">
                                {!capturedImage ? (
                                    <button
                                        onClick={capturePhoto}
                                        disabled={!modelLoaded || !cameraReady}
                                        className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 flex items-center gap-2
                                            ${!modelLoaded || !cameraReady
                                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                                : 'bg-white text-black hover:bg-gray-200 shadow-lg scale-100 hover:scale-105'
                                            }`}
                                    >
                                        <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-black"></div>
                                        Capture Photo
                                    </button>
                                ) : (
                                    <>
                                        {!isDetecting && detections.length === 0 && (
                                            <button
                                                onClick={runScan}
                                                disabled={!modelLoaded}
                                                className={`px-8 py-3 rounded-full font-semibold shadow-lg transition-all transform hover:scale-105
                                                    ${modelLoaded
                                                        ? 'bg-neon-blue text-black hover:bg-neon-light'
                                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                Scan Photo
                                            </button>
                                        )}
                                        <button
                                            onClick={retakePhoto}
                                            className="px-8 py-3 rounded-full font-semibold bg-gray-700 text-white hover:bg-gray-600 transition-all duration-300 shadow-lg"
                                        >
                                            Retake
                                        </button>
                                    </>
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
                                {!cameraReady && !capturedImage && (
                                    <div className="text-yellow-400 text-sm">⚠️ Waiting for camera access...</div>
                                )}
                                {error && (
                                    <div className="text-red-400 text-sm">❌ {error}</div>
                                )}
                                {modelLoaded && cameraReady && !error && !capturedImage && (
                                    <div className="text-green-400 text-sm">✓ Ready to capture</div>
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
                        <DetectionList detections={detections} isDetecting={isDetecting || !!capturedImage} />
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default Snapshot
