import { useEffect, useState } from 'react'

function CameraFeed({ videoRef, onReady, onError }) {
    const [permissionStatus, setPermissionStatus] = useState('requesting')

    useEffect(() => {
        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    },
                    audio: false
                })

                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play()
                        setPermissionStatus('granted')
                        onReady?.()
                    }
                }
            } catch (err) {
                console.error('Camera access error:', err)
                setPermissionStatus('denied')
                let errorMessage = 'Failed to access camera. '

                if (err.name === 'NotAllowedError') {
                    errorMessage += 'Please grant camera permissions.'
                } else if (err.name === 'NotFoundError') {
                    errorMessage += 'No camera found on this device.'
                } else if (err.name === 'NotReadableError') {
                    errorMessage += 'Camera is already in use.'
                } else {
                    errorMessage += err.message
                }

                onError?.(errorMessage)
            }
        }

        startCamera()

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            }
        }
    }, [])

    return (
        <div className="relative w-full h-full">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
            />

            {permissionStatus === 'requesting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center">
                        <div className="animate-spin h-12 w-12 border-4 border-neon-blue border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-neon-blue">Requesting camera access...</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CameraFeed
