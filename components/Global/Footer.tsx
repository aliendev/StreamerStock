const currentYear = new Date().getFullYear();

export default function GlobalFooter() {
    return (
    <footer className="text-white">
        <div className="flex flex-row items-center justify-between max-w-7xl mx-auto px-4 py-6">
                <p className="d-flex">Copyright © 2025 - {currentYear} Streamer Stock. All rights reserved. 100% Human-Crafted Artisanal Code.</p>
                <p className="d-flex">v0.0.01</p>
        </div>
    </footer>
)}
