import AudioManager from "../../audio/AudioManager";

export class GameplayAudio {
  private audioManager: AudioManager;

  constructor(audioManager: AudioManager) {
    this.audioManager = audioManager;
  }

  play(name: string) {
    const audio = this.audioManager.samples.get(`gameplay/drocelot/${name}`);
    audio.currentTime = 0;
    audio.play();
  }
}