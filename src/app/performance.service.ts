import { Injectable } from '@angular/core';

import { MidiSystemService, DeviceList, MapList } from "./midi-system.service";
import { MidiMapperService, AngularMidiMapper } from "./midi-mapper.service";
import { MidiPlayerService, AngularMidiPlayer } from "./midi-player.service";

export interface Performance {
  title: string;
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
  type: string;
  title: string;
  exclusive: boolean;
  presets: Preset[];
}

export interface Preset {
  id: string;
  title: string;
  isDefault: boolean;
  maps: MapList;
  midiUrl?: string;
  loop?: boolean;
}

interface GroupHandler {
  mapper?: AngularMidiMapper;
  presetHandlers?: Map<string, PresetHandler>;
}

interface PresetHandler {
  player?: AngularMidiPlayer;
  file?: ArrayBuffer;
}

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {

  private performance: Performance | undefined;
  private groupHandlers: Map<string, GroupHandler> = new Map();

  constructor(private midiSystem: MidiSystemService,
              private midiMapper: MidiMapperService,
              private midiPlayer: MidiPlayerService) {
    setTimeout(() => {
      fetch("/assets/performance.json")
        .then((result) => result.json())
        .then(this.loadPerformance.bind(this));
    }, 500);
  }

  public currentPerformance() {
    return this.performance;
  }

  public currentSong() {
    return this.performance?.songs[0];
  }

  public groups() {
    return this.currentSong()?.groups;
  }

  public activatePreset(group: Group, preset: Preset) {
    const groupHandler = this.groupHandlers.get(group.id);
    if (groupHandler) {
      if (group.type === "mapper") {
        groupHandler.mapper!.setMaps(preset.maps);
      } else if (group.type === "player") {
        const presetHandler = groupHandler.presetHandlers!.get(preset.id);
        if (presetHandler) {
          const player = presetHandler.player!;
          if (player.isPlaying()) {
            player.stop();
          } else {
            player.playFile(presetHandler.file!);
          }
        }
      }
    }
  }

  private loadPerformance(performance: Performance) {
    this.performance = performance;
    this.midiSystem.setDevices(performance.inputs, performance.outputs);

    const song = performance.songs[0];

    for (const group of song.groups) {
      let mapper;
      if (group.type === "mapper") {
        const preset = this.defaultPreset(group);
        const maps = preset ? preset.maps : [];
        mapper = this.midiMapper.getMapper(performance.inputs, maps);
      }

      const presetHandlers = new Map();
      for (const preset of group.presets) {
        let player;
        if (group.type === "player") {
          player = this.midiPlayer.getPlayer(preset.loop || false);
        }

        const presetHandler: PresetHandler = {
          player: player,
          file: undefined
        }

        if (group.type === "player" && preset.midiUrl) {
          fetch(preset.midiUrl)
            .then((result) => result.arrayBuffer())
            .then((data) => presetHandler.file = data);
        }

        presetHandlers.set(preset.id, presetHandler);
      }

      const groupHandler = {
        mapper,
        presetHandlers
      }

      this.groupHandlers.set(group.id, groupHandler);
    }
  }

  private defaultPreset(group: Group): Preset | undefined {
    return group.presets.find((preset) => preset.isDefault);
  }

}
