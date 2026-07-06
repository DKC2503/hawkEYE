import React, { useState, useRef, useEffect } from 'react';

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string, originalAudioUrl?: string) => void;
  languageHint?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscriptComplete,
  languageHint = 'te',
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Simulate high-fidelity multilingual voice transcription (Telugu / Hindi / English)
        setIsTranscribing(true);
        setTimeout(() => {
          let mockTranscript = "మా ప్రాంతంలో ప్రభుత్వ ఉన్నత పాఠశాల భవనం మరియు బస్సు సదుపాయం అవసరం.";
          if (languageHint === 'hi') {
            mockTranscript = "हमारे क्षेत्र में सरकारी स्कूल की इमारत और बस सेवा की तत्काल आवश्यकता है।";
          } else if (languageHint === 'en') {
            mockTranscript = "Our locality urgently needs a government high school building and bus connectivity.";
          }
          setTranscript(mockTranscript);
          setIsTranscribing(false);
          onTranscriptComplete(mockTranscript, url);
        }, 1200);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      alert("Microphone permission denied or audio device unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);

      // Stop mic stream tracks
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-200">Multilingual Voice Input</span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded">
          {languageHint.toUpperCase()} (Telugu / Hindi / English)
        </span>
      </div>

      <div className="flex items-center gap-3">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-mono text-xs font-bold transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span>Start Voice Recording</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="px-4 py-2.5 rounded-xl bg-slate-800 border border-rose-500/50 text-rose-300 font-mono text-xs font-bold animate-pulse transition-all flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Recording ({recordingSeconds}s) • Click to Stop</span>
          </button>
        )}

        {audioUrl && (
          <audio controls src={audioUrl} className="h-8 max-w-[200px]" />
        )}
      </div>

      {isTranscribing && (
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-400 animate-pulse">
          ⚡ Transcribing voice audio & detecting language structure...
        </div>
      )}

      {transcript && !isTranscribing && (
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono text-slate-400 font-bold uppercase">
            Detected Transcript (Editable before submission)
          </label>
          <textarea
            rows={2}
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              onTranscriptComplete(e.target.value, audioUrl || undefined);
            }}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none focus:border-amber-500 font-sans"
          />
        </div>
      )}
    </div>
  );
};
