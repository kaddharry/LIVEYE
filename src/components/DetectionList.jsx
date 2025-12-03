import { motion, AnimatePresence } from 'framer-motion'

const COLORS = [
    '#00BFFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739'
]

function DetectionList({ detections, isDetecting }) {
    return (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-neon-blue/20 h-full">
            <h2 className="text-xl font-semibold mb-4 text-neon-blue">Detections</h2>

            {!isDetecting && (
                <div className="text-gray-400 text-center py-8">
                    <p className="mb-2">🎯</p>
                    <p>Start detection to see results</p>
                </div>
            )}

            {isDetecting && detections.length === 0 && (
                <div className="text-gray-400 text-center py-8">
                    <div className="animate-pulse mb-2">👁️</div>
                    <p>Scanning for objects...</p>
                </div>
            )}

            <AnimatePresence mode="popLayout">
                {detections.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-3 max-h-[600px] overflow-y-auto pr-2"
                    >
                        {detections.map((detection, idx) => (
                            <motion.div
                                key={`${detection.label}-${idx}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="bg-gray-800/50 rounded-lg p-4 border-l-4 hover:bg-gray-800/70 transition-all"
                                style={{ borderLeftColor: COLORS[idx % COLORS.length] }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold text-white capitalize">
                                        {detection.label}
                                    </h3>
                                    <span
                                        className="text-xs font-bold px-2 py-1 rounded"
                                        style={{
                                            backgroundColor: COLORS[idx % COLORS.length] + '20',
                                            color: COLORS[idx % COLORS.length]
                                        }}
                                    >
                                        {(detection.confidence * 100).toFixed(1)}%
                                    </span>
                                </div>

                                {/* Confidence bar */}
                                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${detection.confidence * 100}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {detections.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-4 pt-4 border-t border-neon-blue/20 text-sm text-gray-400"
                >
                    Total objects detected: <span className="text-neon-blue font-semibold">{detections.length}</span>
                </motion.div>
            )}
        </div>
    )
}

export default DetectionList
