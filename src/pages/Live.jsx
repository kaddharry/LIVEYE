import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import CameraFeed from '../components/CameraFeed'
import DetectionOverlay from '../components/DetectionOverlay'
import DetectionList from '../components/DetectionList'
import { loadModel, runInference } from '../utils/onnxUtils'

const MODELS = [
    { id: 'coco', name: 'COCO model (yolov8s)', path: '/model_coco.onnx' },
    { id: 'custom', name: 'Custom model', path: '/model_custom.onnx' }
]

function Live() {
    const navigate = useNavigate()
    const [cameraReady, setCameraReady] = useState(false)
    const [modelLoaded, setModelLoaded] = useState(false)
    const [isDetecting, setIsDetecting] = useState(false)
    const [detections, setDetections] = useState([])
    const [error, setError] = useState(null)
    const [loadingMessage, setLoadingMessage] = useState('Initializing...')
    const [selectedModel, setSelectedModel] = useState(MODELS[0].path)

    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const modelRef = useRef(null)
    const animationFrameRef = useRef(null)

    // Load ONNX model when selectedModel changes
    useEffect(() => {
        const initModel = async () => {
            // Reset state
            stopDetection()
            setModelLoaded(false)
            setDetections([])
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

    // Detection loop
    const runDetection = async () => {
        if (!isDetecting || !videoRef.current || !modelRef.current) return

        try {
            const video = videoRef.current
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
                // Run inference
                const results = await runInference(modelRef.current, video)
                setDetections(results)
            }
        } catch (err) {
            console.error('Detection error:', err)
        }

        // Continue loop
        animationFrameRef.current = requestAnimationFrame(runDetection)
    }

    const startDetection = () => {
        if (!modelLoaded) {
            setError('Please wait for the model to load')
            return
        }
        if (!cameraReady) {
            setError('Please enable camera access')
            return
        }
        setIsDetecting(true)
        setError(null)
    }

    const stopDetection = () => {
        setIsDetecting(false)
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
        }
        setDetections([])
    }

    // Start/stop detection loop
    useEffect(() => {
        if (isDetecting) {
            runDetection()
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current)
            }
        }
    }, [isDetecting])

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
                    {/* Video Feed Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-2"
                    >
                        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neon-blue/20">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-neon-blue">Live Feed</h2>

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

                            {/* Camera Feed with Overlay */}
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                                <CameraFeed
                                    videoRef={videoRef}
                                    onReady={() => setCameraReady(true)}
                                    onError={(err) => setError(err)}
                                />
                                <DetectionOverlay
                                    canvasRef={canvasRef}
                                    videoRef={videoRef}
                                    detections={detections}
                                />
                            </div>

                            {/* Controls */}
                            <div className="mt-6 flex flex-wrap gap-4">
                                <button
                                    onClick={startDetection}
                                    disabled={!modelLoaded || !cameraReady || isDetecting}
                                    className={`flex-1 md:flex-none px-8 py-3 rounded-lg font-semibold transition-all duration-300
                    ${isDetecting || !modelLoaded || !cameraReady
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-neon-blue text-black hover:bg-neon-light shadow-neon-sm hover:shadow-neon'
                                        }`}
                                >
                                    {isDetecting ? 'Detecting...' : 'Start Detection'}
                                </button>
                                <button
                                    onClick={stopDetection}
                                    disabled={!isDetecting}
                                    className={`flex-1 md:flex-none px-8 py-3 rounded-lg font-semibold transition-all duration-300
                    ${!isDetecting
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : 'bg-red-600 text-white hover:bg-red-700'
                                        }`}
                                >
                                    Stop Detection
                                </button>
                            </div>

                            {/* Status Messages */}
                            <div className="mt-4 space-y-2">
                                {!modelLoaded && (
                                    <div className="text-yellow-400 text-sm flex items-center gap-2">
                                        <div className="animate-spin h-4 w-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                                        {loadingMessage}
                                    </div>
                                )}
                                {!cameraReady && (
                                    <div className="text-yellow-400 text-sm">⚠️ Waiting for camera access...</div>
                                )}
                                {error && (
                                    <div className="text-red-400 text-sm">❌ {error}</div>
                                )}
                                {modelLoaded && cameraReady && !error && (
                                    <div className="text-green-400 text-sm">✓ Ready to detect objects</div>
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

export default Live
