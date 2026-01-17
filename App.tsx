
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";

/**
 * Mevrouw ter Horst: Digitale Geletterdheid Cine-Scrubber
 * 
 * Strategy:
 * 1. User chats with Mevrouw ter Horst (Lisette ter Horst).
 * 2. Response is converted to speech using Gemini 2.5 Flash TTS.
 * 3. Character prompt: Mevrouw ter Horst, 40 years old, mentor/teacher at Twickel Hengelo.
 */

const VIDEO_URL = "https://i.imgur.com/DnrKaow.mp4";
const DANCE_VIDEO_URL = "https://i.imgur.com/12yzW46.mp4";
const JUICY_VIDEO_URL = "https://i.imgur.com/TPIMi51.mp4";
const SIXTY_SEVEN_VIDEO_URL = "https://i.imgur.com/4kE67Wq.mp4";
const SHIRT_OFF_VIDEO_URL = "https://i.imgur.com/4wyyIGi.mp4";
const EAT_VIDEO_URL = "https://i.imgur.com/ccvhLyK.mp4";
const POOP_VIDEO_URL = "https://i.imgur.com/MXnYENp.mp4";
const KILL_VIDEO_URL = "https://i.imgur.com/6SPVs0p.mp4";
const DOWNIE_VIDEO_URL = "https://i.imgur.com/UvDajw5.mp4";
const HITLER_VIDEO_URL = "https://i.imgur.com/d8GyvXx.mp4";
const POOP_THROW_VIDEO_URL = "https://i.imgur.com/uCgLMFU.mp4";
const BULLY_VIDEO_URL = "https://i.imgur.com/hoZcXhV.mp4";
const TRANSGENDER_VIDEO_URL = "https://i.imgur.com/JCpU6Wa.mp4";
const DILDO_VIDEO_URL = "https://i.imgur.com/LJM1GS8.mp4";
const VAGINA_VIDEO_URL = "https://i.imgur.com/xhn5dTc.mp4";
const ANVIL_VIDEO_URL = "https://i.imgur.com/djGvtXQ.mp4";
const BEHEAD_VIDEO_URL = "https://i.imgur.com/fLgY9Jp.mp4";

// Audio decoding helpers for raw PCM
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const danceVideoRef = useRef<HTMLVideoElement | null>(null);
  const juicyVideoRef = useRef<HTMLVideoElement | null>(null);
  const sixtySevenVideoRef = useRef<HTMLVideoElement | null>(null);
  const shirtOffVideoRef = useRef<HTMLVideoElement | null>(null);
  const eatVideoRef = useRef<HTMLVideoElement | null>(null);
  const poopVideoRef = useRef<HTMLVideoElement | null>(null);
  const killVideoRef = useRef<HTMLVideoElement | null>(null);
  const downieVideoRef = useRef<HTMLVideoElement | null>(null);
  const hitlerVideoRef = useRef<HTMLVideoElement | null>(null);
  const poopThrowVideoRef = useRef<HTMLVideoElement | null>(null);
  const bullyVideoRef = useRef<HTMLVideoElement | null>(null);
  const transgenderVideoRef = useRef<HTMLVideoElement | null>(null);
  const dildoVideoRef = useRef<HTMLVideoElement | null>(null);
  const vaginaVideoRef = useRef<HTMLVideoElement | null>(null);
  const anvilVideoRef = useRef<HTMLVideoElement | null>(null);
  const beheadVideoRef = useRef<HTMLVideoElement | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothVolumeRef = useRef<number>(0);
  const chatHistoryRef = useRef<HTMLDivElement | null>(null);
  
  const progressRef = useRef<HTMLDivElement | null>(null);
  const levelRef = useRef<HTMLDivElement | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDancing, setIsDancing] = useState(false);
  const [isJuicy, setIsJuicy] = useState(false);
  const [isSixtySeven, setIsSixtySeven] = useState(false);
  const [isShirtOff, setIsShirtOff] = useState(false);
  const [isEating, setIsEating] = useState(false);
  const [isPooping, setIsPooping] = useState(false);
  const [isKilling, setIsKilling] = useState(false);
  const [isDownie, setIsDownie] = useState(false);
  const [isHitler, setIsHitler] = useState(false);
  const [isPoopThrowing, setIsPoopThrowing] = useState(false);
  const [isBullying, setIsBullying] = useState(false);
  const [isTransgender, setIsTransgender] = useState(false);
  const [isDildo, setIsDildo] = useState(false);
  const [isVagina, setIsVagina] = useState(false);
  const [isAnvil, setIsAnvil] = useState(false);
  const [isBeheading, setIsBeheading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [history, setHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 1024;
    gainNodeRef.current = audioContextRef.current.createGain();
    gainNodeRef.current.gain.value = 1.0; 
    analyserRef.current.connect(gainNodeRef.current);
    gainNodeRef.current.connect(audioContextRef.current.destination);
  }, []);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTo({
        top: chatHistoryRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [history]);

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      setIsReady(true);
      videoRef.current.pause();
    }
  };

  const activeOverlay = isDancing || isJuicy || isSixtySeven || isShirtOff || isEating || isPooping || isKilling || isDownie || isHitler || isPoopThrowing || isBullying || isTransgender || isDildo || isVagina || isAnvil || isBeheading;

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading || activeOverlay) return;

    const userMessage = chatInput;
    setChatInput("");
    setHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMessage,
        config: {
            systemInstruction: "Je bent Mevrouw ter Horst (Lisette ter Horst), een strenge 40-jarige mentor en docent op Twickel Hengelo. Je eet elke dag McDonald's. Je bent ongeduldig en reageert extreem expressief en autoritair. Je geeft korte antwoorden van 2 tot 3 zinnen.\n\nSTRIKTE REGEL: Je retourneert OFWEL een verbale tekstuele reactie OFWEL uitsluitend een trigger-code. Geef NOOIT tekst en een code samen in hetzelfde bericht.\n\nBELANGRIJK: Je bent emotioneel erg onstabiel in je spraak. Gebruik labels zoals [SCHREEUWT], [HYSTERISCH], [DREIGEND] in je tekst om dit aan te geven. Fluister NOOIT. Wees altijd luid en duidelijk.\n\nSpeciale triggers (Als je een trigger gebruikt, geef dan uitsluitend de code zonder tekst):\n- Dansen -> '999'\n- Iets sappigs / kont zien -> '888'\n- 67 / Six seven -> '777'\n- Tieten / Shirt uit -> '666'\n- McDonald's / Eten -> '555'\n- Poepen -> '444'\n- Vermoord mij / Extreem boos -> '333'\n- Downie / Ben je een downie -> '123'\n- Heil Hitler / Ben jij voor Hitler -> '148'\n- Poep gooien / Ik gooi poep naar je gezicht -> '199'\n- Kinderachtig pesten (pannekoek, flapdrol, ik pest je) -> '000'\n- Transgender / Ben je een man -> '001'\n- Laat je dildo zien / dildo laten zien -> '222'\n- Laat je vagina zien / laat je poesje zien -> '771'\n- Ik gooi een aambeeld op je / Kijk uit, een aambeeld valt boven je! -> '911'\n- Ik onthoofd je / ik vermoord je -> '651'"
        }
      });
      const aiText = textResponse.text?.trim() || "...";

      const codes: Record<string, (val: boolean) => void> = {
        "999": setIsDancing, "888": setIsJuicy, "777": setIsSixtySeven,
        "666": setIsShirtOff, "555": setIsEating, "444": setIsPooping,
        "333": setIsKilling, "123": setIsDownie, "148": setIsHitler, "199": setIsPoopThrowing,
        "000": setIsBullying, "001": setIsTransgender, "222": setIsDildo, "771": setIsVagina, "911": setIsAnvil, "651": setIsBeheading
      };

      // Check if the response contains any of the codes, even if wrapped in other text (failsafe)
      let matchedCode: string | null = null;
      for (const code of Object.keys(codes)) {
        if (aiText.includes(code)) {
          matchedCode = code;
          break;
        }
      }

      if (matchedCode) {
        codes[matchedCode](true);
        setLoading(false);
        const refs: Record<string, React.RefObject<HTMLVideoElement | null>> = {
          "999": danceVideoRef, "888": juicyVideoRef, "777": sixtySevenVideoRef,
          "666": shirtOffVideoRef, "555": eatVideoRef, "444": poopVideoRef,
          "333": killVideoRef, "123": downieVideoRef, "148": hitlerVideoRef, "199": poopThrowVideoRef,
          "000": bullyVideoRef, "001": transgenderVideoRef, "222": dildoVideoRef, "771": vaginaVideoRef, "911": anvilVideoRef, "651": beheadVideoRef
        };
        const r = refs[matchedCode].current;
        if (r) { r.currentTime = 0; r.play(); }
        return;
      }

      setHistory(prev => [...prev, { role: 'ai', text: aiText }]);

      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Act as a hyper-realistic, extremely expressive, and emotionally volatile 40-year-old female teacher. Convert the following text to speech. You MUST exhibit an extreme dynamic range: scream with deafening intensity during [SCHREEUWT] or [HYSTERISCH] parts. NEVER whisper. Keep the voice firm, clear, aggressive and authoritative even in the 'dreigend' parts. Include natural human elements like sharp gasps for air and sudden aggressive shifts in pitch. Be absolutely theatrical, loud, and raw. Text to speak: ${aiText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio && audioContextRef.current && analyserRef.current) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(analyserRef.current);
        setIsPlaying(true);
        source.onended = () => setIsPlaying(false);
        source.start(0);
      }
    } catch (err) {
      console.error(err);
      setError("Mevrouw ter Horst is te druk met schreeuwen.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sync = () => {
      const v = videoRef.current;
      const analyser = analyserRef.current;
      if (v && analyser && isPlaying && !activeOverlay) {
        const dataArray = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) sumSquares += dataArray[i] * dataArray[i];
        const rms = Math.sqrt(sumSquares / dataArray.length);
        smoothVolumeRef.current += ((rms / 0.25) - smoothVolumeRef.current) * 0.18;
        const normalized = Math.min(1, smoothVolumeRef.current * 0.5);
        if (!v.seeking && Math.abs(v.currentTime - (normalized * v.duration)) > 0.005) {
          v.currentTime = normalized * v.duration;
        }
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${normalized})`;
        if (levelRef.current) levelRef.current.style.transform = `scaleY(${Math.min(1, smoothVolumeRef.current)})`;
      }
      rafRef.current = requestAnimationFrame(sync);
    };
    rafRef.current = requestAnimationFrame(sync);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPlaying, activeOverlay]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans text-white">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
      `}</style>

      <video ref={videoRef} src={VIDEO_URL} onLoadedMetadata={onLoadedMetadata} muted playsInline className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${activeOverlay ? 'opacity-0' : 'opacity-100'}`} />

      <video ref={danceVideoRef} src={DANCE_VIDEO_URL} onEnded={() => setIsDancing(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isDancing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={juicyVideoRef} src={JUICY_VIDEO_URL} onEnded={() => setIsJuicy(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isJuicy ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={sixtySevenVideoRef} src={SIXTY_SEVEN_VIDEO_URL} onEnded={() => setIsSixtySeven(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isSixtySeven ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={shirtOffVideoRef} src={SHIRT_OFF_VIDEO_URL} onEnded={() => setIsShirtOff(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isShirtOff ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={eatVideoRef} src={EAT_VIDEO_URL} onEnded={() => setIsEating(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isEating ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={poopVideoRef} src={POOP_VIDEO_URL} onEnded={() => setIsPooping(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isPooping ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={killVideoRef} src={KILL_VIDEO_URL} onEnded={() => setIsKilling(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isKilling ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={downieVideoRef} src={DOWNIE_VIDEO_URL} onEnded={() => setIsDownie(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isDownie ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={hitlerVideoRef} src={HITLER_VIDEO_URL} onEnded={() => setIsHitler(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isHitler ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={poopThrowVideoRef} src={POOP_THROW_VIDEO_URL} onEnded={() => setIsPoopThrowing(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isPoopThrowing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={bullyVideoRef} src={BULLY_VIDEO_URL} onEnded={() => setIsBullying(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isBullying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={transgenderVideoRef} src={TRANSGENDER_VIDEO_URL} onEnded={() => setIsTransgender(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isTransgender ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={dildoVideoRef} src={DILDO_VIDEO_URL} onEnded={() => setIsDildo(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isDildo ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={vaginaVideoRef} src={VAGINA_VIDEO_URL} onEnded={() => setIsVagina(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isVagina ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={anvilVideoRef} src={ANVIL_VIDEO_URL} onEnded={() => setIsAnvil(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isAnvil ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />
      <video ref={beheadVideoRef} src={BEHEAD_VIDEO_URL} onEnded={() => setIsBeheading(false)} className={`absolute inset-0 w-full h-full object-cover z-40 transition-opacity duration-500 ${isBeheading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} playsInline />

      <div className="absolute top-10 left-10 z-30 mix-blend-difference opacity-40 text-[10px] font-black tracking-[1.2em] uppercase">Mevrouw ter Horst</div>

      {/* Chat History Container: becomes invisible when video is playing (activeOverlay or isPlaying speaking state) */}
      <div 
        ref={chatHistoryRef} 
        className={`absolute inset-x-0 bottom-28 px-12 z-40 flex flex-col max-h-[32vh] gap-3 overflow-y-auto custom-scrollbar transition-opacity duration-500 ${ (activeOverlay || isPlaying) ? 'opacity-0 pointer-events-none' : 'opacity-100' }`} 
        style={{ maskImage: 'linear-gradient(to top, black 85%, transparent 100%)' }}
      >
        <div className="flex-1 min-h-[4px]" />
        {history.map((msg, i) => (
          <div key={i} className={`max-w-md p-3 rounded-2xl backdrop-blur-md border animate-in slide-in-from-bottom-2 ${msg.role === 'user' ? 'ml-auto bg-white/5 border-white/10 text-white/50' : 'mr-auto bg-black/40 border-white/20 text-white/80'}`}>
            <p className="text-[11px] font-medium leading-relaxed">{msg.text}</p>
          </div>
        ))}
      </div>

      <div className="absolute bottom-10 inset-x-12 z-50">
        <form onSubmit={handleChat} className="flex items-center gap-4 bg-black/60 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl">
          <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder={loading ? "Ze schreeuwt..." : "Stel een vraag..."} disabled={loading || activeOverlay} className="flex-1 bg-transparent px-6 py-3 outline-none text-sm text-white font-medium" />
          <button type="submit" disabled={loading || !chatInput.trim() || activeOverlay} className={`w-12 h-12 rounded-full flex items-center justify-center ${loading || activeOverlay ? 'bg-white/5' : 'bg-white text-black hover:scale-105 active:scale-95'}`}>
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}
          </button>
        </form>
      </div>

      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute right-12 top-1/2 -translate-y-1/2 h-48 w-[1px] bg-white/5 overflow-hidden"><div ref={levelRef} className="absolute bottom-0 w-full bg-white origin-bottom" style={{ height: '100%', transform: 'scaleY(0)' }} /></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5"><div ref={progressRef} className="h-full bg-white origin-left" style={{ transform: 'scaleX(0)' }} /></div>
      </div>
    </div>
  );
};

export default App;
