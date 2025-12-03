import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Live from './pages/Live'
import Upload from './pages/Upload'
import Snapshot from './pages/Snapshot'

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/live" element={<Live />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/snapshot" element={<Snapshot />} />
            </Routes>
        </Router>
    )
}

export default App
