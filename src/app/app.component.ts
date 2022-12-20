import { Component, OnInit, HostListener } from "@angular/core";
import { MidiSystemService } from "./midi-system.service";
import { MidiMapperService } from "./midi-mapper.service";
import { MidiPlayerService } from "./midi-player.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"]
})
export class AppComponent {//implements OnInit {
  public title = "solo-orchestra";
  private mapper1;
  private player1;
  private player2;
  private input: WebMidi.MIDIInput | undefined;
  private output: WebMidi.MIDIOutput | undefined;

  constructor(private midiSystem: MidiSystemService,
              private midiMapper: MidiMapperService,
              private midiPlayer: MidiPlayerService) {
    // this.midiSystem.listPorts();
    // this.midiSystem.showPorts();
    this.mapper1 = midiMapper.getMapper({
      inputName: "CHMidi-2.3 MIDI 1",
      outputName: "Synth input port (Qsynth1:0)",
      channelMap: new Map([
        // [1, 3],
      ]),
    });
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
}
