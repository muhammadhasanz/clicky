import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  onPttStatus: (callback: (data: { isListening: boolean }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('ptt-status', handler);
    return () => ipcRenderer.removeListener('ptt-status', handler);
  },
  onDrawPoint: (callback: (data: { x: number; y: number; label: string; screenIndex?: number }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('draw-point', handler);
    return () => ipcRenderer.removeListener('draw-point', handler);
  },
  sendPointElement: (pointData: { x: number; y: number; label: string; screenIndex?: number }) => {
    ipcRenderer.send('point-element', pointData);
  }
});
