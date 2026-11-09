import { canvasTex } from './models'

/** Dusk gradient used as scene background (design choice from the H5 target). */
export const skyTex = () => canvasTex(2, 256, (g) => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#2b5a86'); gr.addColorStop(0.6, '#e9b98a'); gr.addColorStop(1, '#f6dcc0'); g.fillStyle = gr; g.fillRect(0, 0, 2, 256) })
