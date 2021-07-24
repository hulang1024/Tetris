export default class SampleStore {
  private readonly sampleCache: { [name: string]: HTMLAudioElement } = {};

  private volume = 0.6;

  constructor() {
    setTimeout(() => {
      this.loadAll();
    }, 0);
  }

  public get(name: string): HTMLAudioElement {
    const key = name.lastIndexOf('.') > -1 ? name.substring(0, name.lastIndexOf('.')) : name;
    let audio = this.sampleCache[key];
    if (audio) {
      return audio;
    }

    audio = new Audio();
    audio.src = `audio/${name}${name.lastIndexOf('.') > -1 ? '' : '.wav'}`;
    audio.volume = this.volume;
    audio.load();

    this.sampleCache[key] = audio;

    return audio;
  }

  public adjustVolumne(volume: number) {
    this.volume = volume;
    Object.keys(this.sampleCache).forEach((name) => {
      this.sampleCache[name].volume = volume;
    });
  }

  private loadAll() {
    const audioModules: Record<string, string[]> = {
      gameplay: [
        'go.wav',
        'move.wav', 'rotate.ogg', 'lock.wav', 'harddrop.wav',
        'erase1.mp3', 'erase2.mp3', 'erase3.mp3', 'erase4.mp3'
      ]
    };
    const names: string[] = [];
    for (const moduleName in audioModules) {
      audioModules[moduleName].forEach((fileName) => {
        names.push(`${moduleName}/se/${fileName}`);
      });
    }
    names.forEach((name) => {
      this.get(name);
    });
  }
}
