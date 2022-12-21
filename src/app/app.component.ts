import { Component, OnInit, HostListener } from "@angular/core";
import { MidiSystemService } from "./midi-system.service";
import { MidiMapperService } from "./midi-mapper.service";
import { MidiPlayerService, AngularMidiPlayer } from "./midi-player.service";
import { PerformanceService } from "./performance.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"]
})
export class AppComponent {
  private player1: AngularMidiPlayer ;
  private player2: AngularMidiPlayer;

  constructor(private midiSystem: MidiSystemService,
              private midiMapper: MidiMapperService,
              private midiPlayer: MidiPlayerService,
              private performance: PerformanceService) {
    this.player1 = midiPlayer.getPlayer({
      outputName: "Synth input port (Qsynth1:0)",
    });
    this.player2 = midiPlayer.getPlayer({
      outputName: "Synth input port (Qsynth1:0)",
      // channelMap: new Map([
      //   [1, 5],
      // ]),
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
