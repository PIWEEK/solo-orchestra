import { Component, OnInit, HostListener } from "@angular/core";
import { MidiSystemService } from "./midi-system.service";
import { MidiPlayerService } from "./midi-player.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"]
})
export class AppComponent implements OnInit {
  public title = "solo-orchestra";
  private player1;
  private player2;
  private input: WebMidi.MIDIInput | undefined;
  private output: WebMidi.MIDIOutput | undefined;

  constructor(private midiSystem: MidiSystemService,
              private midiPlayer: MidiPlayerService) {
    this.player1 = midiPlayer.getPlayer({
      outputName: "Synth input port (Qsynth1:0)",
    });
    this.player2 = midiPlayer.getPlayer({
      outputName: "Synth input port (Qsynth1:0)",
      channelMap: new Map([
        [1, 5],
      ]),
    });
  }

  @HostListener("window:unload", ["$event"])
  unloadHandler(event: Event) {
    this.midiSystem.shutdown();
  }

  ngOnInit() {
    setTimeout(this.startMappingInput.bind(this), 1000);
  }

  onFileSelected(event: any) {
    const file:File = event.target.files[0];
    if (file) {
      this.player1.playFile(file);
    }
  }

  onFile2Selected(event: any) {
    const file:File = event.target.files[0];
    if (file) {
      this.player2.playFile(file);
    }
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
      this.midiSystem.sendMessage(this.output, event.data, undefined);
    }
  }
}
