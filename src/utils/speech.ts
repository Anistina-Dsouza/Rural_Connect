import { Language } from '../types';

export const speakText = (text: string, language: Language = 'en'): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Text-to-speech not supported in this browser.');
    return;
  }

  window.speechSynthesis.cancel(); // Stop any ongoing speech

  const utterance = new SpeechSynthesisUtterance(text);
  
  if (language === 'hi') {
    utterance.lang = 'hi-IN';
  } else if (language === 'gu') {
    utterance.lang = 'gu-IN';
  } else {
    utterance.lang = 'en-IN';
  }

  utterance.rate = 0.9; // Slightly slower for clear rural comprehension
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
};

export class VoiceRecognition {
  private recognition: any = null;
  private isListening: boolean = false;

  constructor(language: Language = 'en', onResult?: (text: string) => void, onError?: (err: any) => void) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = language === 'hi' ? 'hi-IN' : language === 'gu' ? 'gu-IN' : 'en-IN';

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (onResult) onResult(transcript);
        this.isListening = false;
      };

      this.recognition.onerror = (event: any) => {
        if (onError) onError(event);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  public start(): boolean {
    if (!this.recognition) return false;
    try {
      this.recognition.start();
      this.isListening = true;
      return true;
    } catch (e) {
      console.warn('Speech recognition start failed', e);
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public active(): boolean {
    return this.isListening;
  }
}
