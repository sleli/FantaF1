'use client';

import { useState, useEffect } from 'react';
import { useDevice } from '@/hooks/useDevice';
import { useNetworkStatus, useMemoryMonitor } from '@/hooks/usePerformance';

interface MobileDebugProps {
  enabled?: boolean;
}

export default function MobileDebug({ enabled = false }: MobileDebugProps) {
  const [isVisible, setIsVisible] = useState(false);
  const device = useDevice();
  const { getConnectionInfo, isSlowConnection } = useNetworkStatus();
  const { getMemoryInfo, isMemoryPressure } = useMemoryMonitor();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (!enabled) return;

    const updateDebugInfo = () => {
      const connectionInfo = getConnectionInfo();
      const memoryInfo = getMemoryInfo();
      
      setDebugInfo({
        device,
        connection: connectionInfo,
        memory: memoryInfo,
        isSlowConnection: isSlowConnection(),
        isMemoryPressure: isMemoryPressure(),
        timestamp: new Date().toLocaleTimeString()
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 2000);

    return () => clearInterval(interval);
  }, [enabled, device, getConnectionInfo, getMemoryInfo, isSlowConnection, isMemoryPressure]);

  if (!enabled) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-f1-red text-white p-3 rounded-full shadow-lg touch-target"
        style={{ fontSize: '12px' }}
      >
        🐛
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-sm text-xs overflow-auto max-h-96">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm">Mobile Debug</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Device Info */}
            <div>
              <h4 className="font-semibold text-yellow-400 mb-1">Device</h4>
              <div className="space-y-1">
                <div>Type: {device.isMobile ? 'Mobile' : device.isTablet ? 'Tablet' : 'Desktop'}</div>
                <div>Touch: {device.isTouchDevice ? 'Yes' : 'No'}</div>
                <div>Screen: {device.screenWidth}x{device.screenHeight}</div>
                <div>Orientation: {device.orientation}</div>
                <div>OS: {device.isIOS ? 'iOS' : device.isAndroid ? 'Android' : 'Other'}</div>
              </div>
            </div>

            {/* Network Info */}
            <div>
              <h4 className="font-semibold text-blue-400 mb-1">Network</h4>
              <div className="space-y-1">
                <div>Type: {debugInfo.connection?.effectiveType || 'Unknown'}</div>
                <div>Downlink: {debugInfo.connection?.downlink || 0} Mbps</div>
                <div>RTT: {debugInfo.connection?.rtt || 0}ms</div>
                <div className={debugInfo.isSlowConnection ? 'text-red-400' : 'text-green-400'}>
                  Speed: {debugInfo.isSlowConnection ? 'Slow' : 'Good'}
                </div>
              </div>
            </div>

            {/* Memory Info */}
            {debugInfo.memory && (
              <div>
                <h4 className="font-semibold text-purple-400 mb-1">Memory</h4>
                <div className="space-y-1">
                  <div>Used: {Math.round(debugInfo.memory.usedJSHeapSize / 1024 / 1024)}MB</div>
                  <div>Total: {Math.round(debugInfo.memory.totalJSHeapSize / 1024 / 1024)}MB</div>
                  <div>Limit: {Math.round(debugInfo.memory.jsHeapSizeLimit / 1024 / 1024)}MB</div>
                  <div className={debugInfo.isMemoryPressure ? 'text-red-400' : 'text-green-400'}>
                    Usage: {debugInfo.memory.usagePercentage?.toFixed(1)}%
                  </div>
                </div>
              </div>
            )}

            {/* Performance Warnings */}
            <div>
              <h4 className="font-semibold text-red-400 mb-1">Warnings</h4>
              <div className="space-y-1">
                {debugInfo.isSlowConnection && (
                  <div className="text-red-300">⚠️ Slow connection detected</div>
                )}
                {debugInfo.isMemoryPressure && (
                  <div className="text-red-300">⚠️ High memory usage</div>
                )}
                {device.isMobile && device.orientation === 'landscape' && (
                  <div className="text-yellow-300">📱 Landscape mode</div>
                )}
                {!debugInfo.isSlowConnection && !debugInfo.isMemoryPressure && (
                  <div className="text-green-300">✅ Performance OK</div>
                )}
              </div>
            </div>

            {/* Timestamp */}
            <div className="text-gray-400 text-xs border-t border-gray-600 pt-2">
              Last update: {debugInfo.timestamp}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Component for testing touch interactions
export function TouchTestArea() {
  const [touches, setTouches] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const newTouches = Array.from(e.touches).map((touch, index) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    }));
    setTouches(newTouches);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const newTouches = Array.from(e.touches).map((touch, index) => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    }));
    setTouches(newTouches);
  };

  const handleTouchEnd = () => {
    setTouches([]);
  };

  return (
    <div
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-40"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ pointerEvents: touches.length > 0 ? 'auto' : 'none' }}
    >
      {touches.map(touch => (
        <div
          key={touch.id}
          className="absolute w-12 h-12 bg-red-500 bg-opacity-50 rounded-full border-2 border-red-600 pointer-events-none"
          style={{
            left: touch.x - 24,
            top: touch.y - 24,
            transform: 'scale(1)',
            animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
          }}
        />
      ))}
    </div>
  );
}
