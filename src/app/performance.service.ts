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
  maps?: MapList;
  midiUrl?: string;
  loop?: boolean;
  trigger?: Trigger;
}

export interface Trigger {
  groupId: string;
  presetId: string;
}

interface GroupHandler {
  mapper?: AngularMidiMapper;
  presetHandlers?: Map<string, PresetHandler>;
}

interface PresetHandler {
  player?: AngularMidiPlayer;
  file?: ArrayBuffer;
  isActive: boolean;
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
      const presetHandler = groupHandler.presetHandlers!.get(preset.id);
      if (presetHandler) {

        if (group.exclusive) {
          for (const preset2 of group.presets) {
            if (preset2 !== preset) {
              if (this.isActive(group, preset2)) {
                this.activatePreset(group, preset2);
              }
            }
          }
        }

        if (group.type === "mapper") {
          if (presetHandler.isActive) {
            groupHandler.mapper!.setMaps([]);
            presetHandler.isActive = false;
          } else {
            groupHandler.mapper!.setMaps(preset.maps);
            presetHandler.isActive = true;
          }
        } else if (group.type === "player") {
          const player = presetHandler.player!;
          if (player.isPlaying()) {
            player.stop();
          } else {
            player.playFile(presetHandler.file!);
          }
        }

        if (preset.trigger) {
          const group2 = this.groupById(preset.trigger.groupId);
          if (group2) {
            const preset2 = this.presetById(group2, preset.trigger.presetId);
            if (preset2) {
              if (!this.isActive(group2, preset)) {
                this.activatePreset(group2, preset2);
              }
            }
          }
        }
      }
    }
  }

  public isActive(group: Group, preset: Preset) {
    const groupHandler = this.groupHandlers.get(group.id);
    if (groupHandler) {
      const presetHandler = groupHandler.presetHandlers!.get(preset.id);
      if (presetHandler) {
        if (group.type === "mapper") {
          return presetHandler.isActive;
        } else {
          return presetHandler.player!.isPlaying();
        }
      }
    }

    return false;
  }

  private loadPerformance(performance: Performance) {
    this.performance = performance;
    this.midiSystem.setDevices(performance.inputs, performance.outputs);

    const song = performance.songs[0];

    for (const group of song.groups) {
      let mapper;
      if (group.type === "mapper") {
        const preset = this.defaultPreset(group);
        const maps = preset?.maps || [];
        mapper = this.midiMapper.getMapper(performance.inputs, maps);
      }

      const presetHandlers = new Map();
      for (const preset of group.presets) {
        let player;
        if (group.type === "player") {
          player = this.midiPlayer.getPlayer(preset.loop || false,
                                             preset.maps || []);
        }

        const presetHandler: PresetHandler = {
          player: player,
          file: undefined,
          isActive: !!preset.isDefault
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

  private groupById(groupId: string): Group | undefined {
    return this.groups()!.find((group) => group.id === groupId);
  }

  private presetById(group: Group, presetId: string): Preset | undefined {
    return group.presets.find((preset) => preset.id === presetId);
  }
}
