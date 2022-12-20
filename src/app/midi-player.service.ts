import { Injectable } from '@angular/core';

import MidiPlayer from "midi-player-js";
import { MidiSystemService, MidiOptions } from './midi-system.service';

// Angular wrapper of MidiPlayer.js, that sends the midi events
// from a midi file to MidiSystemService

@Injectable({
  providedIn: 'root'
})
export class MidiPlayerService {

  constructor(private midiSystem: MidiSystemService) {}

  public getPlayer(options: MidiOptions): AngularMidiPlayer {
    return new AngularMidiPlayer(this.midiSystem, options);
  }
}

export class AngularMidiPlayer {
  private player: MidiPlayer.Player;
  private output: WebMidi.MIDIOutput | undefined;

  constructor(private midiSystem: MidiSystemService, private options: MidiOptions) {
    this.player = new MidiPlayer.Player();
    setTimeout(this.getDevices.bind(this), 1000);

    this.player.on("midiEvent", (event: MidiPlayer.Event) => {
      const message = this.event2Message(event);
      if (message && this.output) {
        this.midiSystem.sendMessage(this.output, message, this.options);
      }
    });
  }

  public playFile(file: File) {
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target!.result;
      if (data) {
        this.player.loadArrayBuffer(data as ArrayBuffer);
        this.player.play();
      }
    };

    reader.onerror = (err) => {
      console.log("Error ", err);
    };

    reader.readAsArrayBuffer(file);
  }

  private getDevices() {
    if (this.options.outputName) {
      this.output = this.midiSystem.findOutput(this.options.outputName);
    }
  }

  private event2Message(event: MidiPlayer.Event): number[] | undefined {
    if (event.name.startsWith("Note")) {
      console.log(event.name.toUpperCase(), event.noteNumber, event.velocity);
    } else if (event.name.startsWith("Pitch Bend")) {
      console.log("PITCH BEND ", event.channel, event.value, event.velocity);
    } else {
      console.log("EVENT " + event.name, event);
    }

    let message = undefined;

    if (event.name == "Note on") {
      message = [
        0x90 | ((event.channel! - 1) & 0x0F),
        event.noteNumber! & 0x7F,
        event.velocity! & 0x7F
      ];
    } else if (event.name == "Note off") {
      message = [
        0x80 | ((event.channel! - 1) & 0x0F),
        event.noteNumber! & 0x7F,
        event.velocity! & 0x7F
      ];
    } else if (event.name == "Pitch Bend") {
      if (event.channel && event.velocity) {
        message = [
          0xE0 | ((event.channel - 1) & 0X0F),
          0,
          event.velocity & 0X7F
        ];
      }
    } else if (event.name == "Program Change") {
      if (event.channel && event.value) {
        message = [
          0XC0 | ((event.channel! - 1) & 0X0F),
          event.value & 0X7F
        ];
      }
    }

    return message;
  }
}
