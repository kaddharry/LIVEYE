import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

function Landing() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-light/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
            </div>

            {/* Main content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 text-center px-6 max-w-6xl w-full"
            >
                {/* Logo/Title */}
                <motion.h1
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-7xl md:text-9xl font-bold mb-6 tracking-wider"
                    style={{
                        background: 'linear-gradient(to right, #00BFFF, #33CCFF, #00BFFF)',
                        backgroundSize: '200% auto',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        animation: 'gradient-shift 3s ease infinite',
                    }}
                >
                    LIVEYE
                </motion.h1>

                {/* Tagline */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="text-xl md:text-3xl text-neon-blue font-light mb-8 tracking-wide"
                >
                    Real-time AI Object Detection in Your Browser.
                </motion.p>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-gray-300 text-base md:text-lg mb-12 max-w-2xl mx-auto leading-relaxed"
                >
                    Experience the power of artificial intelligence right in your browser.
                    LIVEYE uses advanced YOLO models to detect objects in real-time through
                    your webcam, uploaded images, or snapshots.
                </motion.p>

                {/* Mode Selection Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full px-4 mt-12">
                    {/* Live Camera Card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        whileHover={{ scale: 1.05, borderColor: '#00BFFF' }}
                        className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 cursor-pointer group"
                        onClick={() => navigate('/live')}
                    >
                        <div className="bg-neon-blue/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-neon-blue/20 transition-colors mx-auto">
                            <svg className="w-8 h-8 text-neon-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-neon-blue transition-colors">Live Camera</h3>
                        <p className="text-gray-400">Real-time detection on live video stream from your webcam.</p>
                    </motion.div>

                    {/* Upload Image Card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        whileHover={{ scale: 1.05, borderColor: '#00BFFF' }}
                        className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 cursor-pointer group"
                        onClick={() => navigate('/upload')}
                    >
                        <div className="bg-purple-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-purple-500/20 transition-colors mx-auto">
                            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-purple-400 transition-colors">Upload Image</h3>
                        <p className="text-gray-400">Analyze photos from your gallery with high precision.</p>
                    </motion.div>

                    {/* Take Photo Card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.0 }}
                        whileHover={{ scale: 1.05, borderColor: '#00BFFF' }}
                        className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 cursor-pointer group"
                        onClick={() => navigate('/snapshot')}
                    >
                        <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-500/20 transition-colors mx-auto">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-green-400 transition-colors">Take Photo</h3>
                        <p className="text-gray-400">Capture a moment and detect objects instantly.</p>
                    </motion.div>
                </div>
            </motion.div>

            <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
        </div>
    )
}

export default Landing
