import { Viewer3D } from './Viewer3D'
import { BENCH_STEPS, buildBench } from './bench'
import type { Quality } from './SceneManager'

export function BenchView({ quality }: { quality: Quality }) {
  return <Viewer3D steps={BENCH_STEPS} build={buildBench} label="3D bench: smart card and card reader" quality={quality} />
}
