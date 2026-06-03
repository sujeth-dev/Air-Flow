import { useRef, useState } from 'react';

function getSupportedMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

export function useRecorder(canvasRef: React.RefObject<HTMLCanvasElement>): {
  isRecording: boolean;
  start: () => void;
  stop: () => void;
} {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function start() {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;

    try {
      const stream = canvas.captureStream(30);
      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'airdraw-session.webm';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setIsRecording(false);
      };

      recorder.start(100);
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Recording failed to start:', err);
    }
  }

  function stop() {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }

  return { isRecording, start, stop };
}
