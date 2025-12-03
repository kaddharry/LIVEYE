import { useEffect } from 'react'

// Color palette for different object classes
const COLORS = [
    '#00BFFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739'
]

function DetectionOverlay({ canvasRef, videoRef, detections }) {
    useEffect(() => {
        const canvas = canvasRef.current
        const video = videoRef.current

        if (!canvas || !video) return

        const ctx = canvas.getContext('2d')

        // Match canvas size to video size
        const updateCanvasSize = () => {
            if (video.videoWidth && video.videoHeight) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
            }
        }

        updateCanvasSize()

        // Update on video resize
        const resizeObserver = new ResizeObserver(updateCanvasSize)
        resizeObserver.observe(video)

        return () => {
            resizeObserver.disconnect()
        }
    }, [canvasRef, videoRef])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw detections
        detections.forEach((detection, idx) => {
            const { x, y, width, height, label, confidence } = detection
            const color = COLORS[idx % COLORS.length]

            // Draw bounding box
            ctx.strokeStyle = color
            ctx.lineWidth = 3
            ctx.strokeRect(x, y, width, height)

            // Draw label background
            const text = `${label} ${(confidence * 100).toFixed(1)}%`
            ctx.font = '16px sans-serif'
            const textMetrics = ctx.measureText(text)
            const textHeight = 20

            ctx.fillStyle = color
            ctx.fillRect(x, y - textHeight - 4, textMetrics.width + 10, textHeight + 4)

            // Draw label text
            ctx.fillStyle = '#000'
            ctx.fillText(text, x + 5, y - 8)
        })
    }, [detections, canvasRef])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: 'normal' }}
        />
    )
}

export default DetectionOverlay
