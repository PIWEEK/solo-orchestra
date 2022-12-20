import { Injectable } from '@angular/core';

import { MidiSystemService, MidiOptions } from './midi-system.service';

@Injectable({
  providedIn: 'root'
})
export class MidiMapperService {

  constructor(private midiSystem: MidiSystemService) {}

  public getMapper(options: MidiOptions): AngularMidiMapper {
    return new AngularMidiMapper(this.midiSystem, options);
  }
}


export class AngularMidiMapper {
  private input: WebMidi.MIDIInput | undefined;
  private output: WebMidi.MIDIOutput | undefined;

  constructor(private midiSystem: MidiSystemService, private options: MidiOptions) {
    setTimeout(this.getDevices.bind(this), 1000);
  }

  private getDevices() {
    if (this.options.inputName) {
      this.input = this.midiSystem.findInput(this.options.inputName);
    }
    if (this.options.outputName) {
      this.output = this.midiSystem.findOutput(this.options.outputName);
    }
    if (this.input && this.output) {
      this.input.onmidimessage = this.onMessage.bind(this);
    }
  }

  private onMessage(event: WebMidi.MIDIMessageEvent) {
    console.log(event.data);
    if (this.output) {
      this.midiSystem.sendMessage(this.output, event.data, this.options);
    }
  }
}
