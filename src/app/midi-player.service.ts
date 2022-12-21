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
  private activeNotes: any[] = [];

  constructor(private midiSystem: MidiSystemService, private options: MidiOptions) {
    this.player = new MidiPlayer.Player();

    this.player.on("midiEvent", (event: MidiPlayer.Event) => {
      const message = this.event2Message(event);
      if (message && this.player.isPlaying()) {
        this.midiSystem.sendMessage(undefined, message, []);
      }
    });

    this.player.on("endOfFile", (event: MidiPlayer.Event) => {
      console.log("END OF SONG");
      this.stopActiveNotes();
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
      if (event.velocity! > 0) {
        this.addActiveNote(event.channel!, event.noteNumber!);
      } else {
        this.removeActiveNote(event.channel!, event.noteNumber!);
      }
    } else if (event.name == "Note off") {
      message = [
        0x80 | ((event.channel! - 1) & 0x0F),
        event.noteNumber! & 0x7F,
        event.velocity! & 0x7F
      ];
      this.removeActiveNote(event.channel!, event.noteNumber!);
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

  private addActiveNote(channel: number, noteNumber: number) {
    this.activeNotes.push({channel, noteNumber});
  }

  private removeActiveNote(channel: number, noteNumber: number) {
    this.activeNotes = this.activeNotes.filter(
      (note) => (note.channel != channel || note.noteNumber != noteNumber)
    );
  }

  private stopActiveNotes() {
    for (let note of this.activeNotes) {
      const message = [
        0x80 | ((note.channel - 1) & 0x0F),
        note.noteNumber & 0x7F,
        0
      ];
      this.midiSystem.sendMessage(undefined, message, []);
    }
  }
}
