import React, { useEffect, useState } from 'react';

interface PointData {
  x: number;
  y: number;
  label: string;
}

export const OverlayApp: React.FC = () => {
  const [point, setPoint] = useState<PointData | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 100, y: 100 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // @ts-ignore
    const cleanup = window.electronAPI?.onDrawPoint((data: PointData) => {
      setPoint(data);
      setVisible(true);

      // Simple animation simulation to target
      setCursorPos({ x: data.x, y: data.y });

      const timer = setTimeout(() => {
        setVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  if (!visible || !point) return null;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Blue Pointer Dot */}
      <div
        style={{
          position: 'absolute',
          left: cursorPos.x,
          top: cursorPos.y,
          transform: 'translate(-50%, -50%)',
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: '#007AFF',
          boxShadow: '0 0 15px rgba(0, 122, 255, 0.8)',
          transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FFF' }} />
      </div>

      {/* Label Tooltip */}
      {point.label && (
        <div
          style={{
            position: 'absolute',
            left: cursorPos.x + 20,
            top: cursorPos.y - 10,
            backgroundColor: 'rgba(20, 20, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#FFF',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'system-ui, sans-serif',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            pointerEvents: 'none'
          }}
        >
          {point.label}
        </div>
      )}
    </div>
  );
};
