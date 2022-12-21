import { Injectable } from '@angular/core';

import { MidiSystemService, DeviceList, MapList } from "./midi-system.service";
import { MidiMapperService, AngularMidiMapper } from "./midi-mapper.service";
import { MidiPlayerService } from "./midi-player.service";

export interface Performance {
  name: string;
  inputs: DeviceList;
  outputs: DeviceList;
  songs: Song[];
}

export interface Song {
  id: string;
  title: string;
  groups: Group[];
}

export interface Group {
  id: string;
  title: string;
  exclusive: boolean;
  default: boolean;
  presets: Preset[];
}

export interface Preset {
  id: string;
  title: string;
  maps: MapList;
}


@Injectable({
  providedIn: 'root'
})
export class PerformanceService {

  private performance: Performance | undefined;
  private mapper: AngularMidiMapper | undefined;

  constructor(private midiSystem: MidiSystemService,
              private midiMapper: MidiMapperService,
              private midiPlayer: MidiPlayerService) {
    setTimeout(() => {
      fetch("/assets/performance.json")
        .then((result) => result.json())
        .then(this.loadPerformance.bind(this));
    }, 500);
  }

  private loadPerformance(performance: Performance) {
    console.log(performance)
    this.performance = performance;
    this.midiSystem.setDevices(performance.inputs, performance.outputs);

    const song = performance.songs[0];
    const group = song.groups[0];
    const preset = group.presets[0];

    this.mapper = this.midiMapper.getMapper(performance.inputs, preset.maps);
  }
}
