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
          colorA="#050505"
          colorB="#010101"
          colorSpace="oklch"
          radius={1.37} 
        />
        <Ascii
          cellSize={30}
          characters="||||"
          fontFamily="monospace"
          spacing={1}
        >
          <Godrays
            backgroundColor="#030303"
            center={{ x: 0.85, y: 0.15 }}
            density={0.4}
            intensity={0.96}
            rayColor="#ffffff"
            speed={1}
            spotty={1} 
          />
          <CursorTrail
            colorA="#ffffff"
            colorB="#050505"
            colorSpace="linear"
            length={1}
            radius={0.5}
            shrink={5} />
          <Tritone
            blendMid={0.73}
            colorA="#010101"
            colorB="#888888"
            colorC="#ffffff"
            colorSpace="oklch"
            visible={true} 
          />
        </Ascii>
      </Shader>
    </div>
  );
}
