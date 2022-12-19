import { Component, OnInit } from "@angular/core";
import MidiPlayer from "midi-player-js";
import { MidiSystemService } from "./midi-system.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"]
})
export class AppComponent implements OnInit {
  public title = "solo-orchestra";
  private Player = new MidiPlayer.Player();
  private Player2 = new MidiPlayer.Player();
  private input: WebMidi.MIDIInput | undefined;
  private output: WebMidi.MIDIOutput | undefined;

  constructor(private midiSystem: MidiSystemService) {}

  ngOnInit() {
    setTimeout(this.startMappingInput.bind(this), 1000);

    this.Player.on("midiEvent", (event: MidiPlayer.Event) => {
      const message = this.event2Message(event);
      if (message && this.output) {
        this.midiSystem.sendMessage(this.output, message);
      }
    });

    this.Player2.on("midiEvent", (event: MidiPlayer.Event) => {
      const message = this.event2Message(event);
      if (message && this.output) {
        this.midiSystem.sendMessage(this.output, message);
      }
    });
  }

  onFileSelected(event: any) {
    const file:File = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (event) => {
        const data = event.target!.result;
        if (data) {
          this.Player.loadArrayBuffer(data as ArrayBuffer);
          this.Player.play();
        }
      };

      reader.onerror = (err) => {
        console.log("Error ", err);
      };

      reader.readAsArrayBuffer(file);
    }
  }

  onFile2Selected(event: any) {
    const file:File = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (event) => {
        const data = event.target!.result;
        if (data) {
          this.Player2.loadArrayBuffer(data as ArrayBuffer);
          this.Player2.play();
        }
      };

      reader.onerror = (err) => {
        console.log("Error ", err);
      };

      reader.readAsArrayBuffer(file);
    }
  }

  private event2Message(event: MidiPlayer.Event): number[] | undefined {
    if (event.name.startsWith("Note")) {
      console.log("EVENT", event);
    }

    let message = undefined;

    if (event.name == "Note on") {
      message = [
        0x90 | ((event.channel! - 1) & 0x0f),
        event.noteNumber! & 0x7f,
        event.velocity! & 0x7f
      ];
    } else if (event.name == "Note off") {
      message = [
        0x80 | ((event.channel! - 1) & 0x0f),
        event.noteNumber! & 0x7f,
        event.velocity! & 0x7f
      ];
    }

    return message;
  }

  private startMappingInput() {
    // this.midiSystem.listPorts();
    // this.midiSystem.showPorts();
    // this.input = this.midiSystem.findInput("out");
    this.input = this.midiSystem.findInput("CHMidi-2.3 MIDI 1");
    this.output = this.midiSystem.findOutput("Synth input port (Qsynth1:0)");

    if (this.input && this.output) {
      this.input.onmidimessage = this.onMessage.bind(this);
    }
  }

  private onMessage(event: WebMidi.MIDIMessageEvent) {
    console.log(event.data);
    if (this.output) {
      this.midiSystem.sendMessage(this.output, event.data);
    }
  }
}
