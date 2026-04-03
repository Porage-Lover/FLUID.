import {
  Shader,
  Ascii,
  CursorTrail,
  Godrays,
  RadialGradient,
  Tritone
} from 'shaders/react';

export function GlobalShader() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1, pointerEvents: 'none' }}>
      <Shader style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
        <RadialGradient
          center={{ x: 0.83, y: 0.2 }}
          colorA="#030d2b"
          colorB="#010f14"
          colorSpace="oklch"
          radius={1.37} 
        />
        <Ascii
          cellSize={30}
          characters="||||"
          fontFamily="Space Mono"
          spacing={1}
        >
          <Godrays
            backgroundColor="#b59318"
            center={{ x: 0.85, y: 0.15 }}
            density={0.3}
            intensity={0.96}
            rayColor="#fcfeff"
            speed={1}
            spotty={1} 
          />
          <CursorTrail
            colorA="#ffffff"
            colorB="#000000"
            colorSpace="linear"
            length={1}
            radius={0.5}
            shrink={5} />
          <Tritone
            blendMid={0.73}
            colorA="#070b1f"
            colorB="#2600ff"
            colorC="#ffee03"
            colorSpace="oklch"
            visible={true} 
          />
        </Ascii>
      </Shader>
    </div>
  );
}
