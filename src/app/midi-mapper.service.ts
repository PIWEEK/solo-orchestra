import { Injectable } from '@angular/core';

import { MidiSystemService, Device, DeviceList, MapList } from "./midi-system.service";

@Injectable({
  providedIn: 'root'
})
export class MidiMapperService {

  constructor(private midiSystem: MidiSystemService) {}

  public getMapper(inputs: DeviceList, maps: MapList): AngularMidiMapper {
    return new AngularMidiMapper(this.midiSystem, inputs, maps);
  }
}


export class AngularMidiMapper {
  constructor(private midiSystem: MidiSystemService,
              private inputs: DeviceList,
              private maps: MapList) {
    for (let input of inputs) {
      const inputDevice = this.midiSystem.getInputDevice(input.id);
      if (inputDevice) {
        inputDevice.onmidimessage = this.onMessage.bind(this, input);
      } else {
        console.error(`Cannot find input ${input.name}`);
      }
    }
  }

  private onMessage(input: Device, event: WebMidi.MIDIMessageEvent) {
    this.midiSystem.sendMessage(input, event.data, this.maps);
  }
}
