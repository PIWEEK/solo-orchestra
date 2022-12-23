import { Component, OnInit, HostListener } from "@angular/core";
import { MidiSystemService } from "./midi-system.service";
import { PerformanceService, Group, Preset } from "./performance.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.sass"]
})
export class AppComponent {
  constructor(private midiSystem: MidiSystemService,
              private performance: PerformanceService) {}

  @HostListener("window:unload", ["$event"])
  unloadHandler(event: Event) {
    this.midiSystem.shutdown();
  }

  public currentPerformance() {
    return this.performance.currentPerformance();
  }

  public currentSong() {
    return this.performance.currentSong();
  }

  public presetClass(group: Group, preset: Preset) {
    if (this.performance.isActive(group, preset)) {
      return "button preset-btn is-primary";
    } else {
      return "button preset-btn is-link";
    }
  }

  onPresetClicked(group: Group, preset: Preset) {
    return this.performance.activatePreset(group, preset);
  }
}
