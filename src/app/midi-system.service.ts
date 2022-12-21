/// <reference types="webmidi" />
// Triple slash commands are interpreted by typescript type system

import { Injectable } from '@angular/core';

// Light wrapper of webmidi interface.

export interface MidiOptions {
  inputName?: string;
  outputName?: string;
  channelMap?: {number: number};
}

export type DeviceList = Device[];

export interface Device {
  id: string;
  title: string;
  name: string;
  channels: ChannelList;
}

export type ChannelList = Channel[];

export interface Channel {
  id: string;
  channel: number;
}

export type MapList = Map[];

export interface Map {
  type: string;
  comments?: string;
  source?: EventSet;
  dest?: EventSet;
}

export interface EventSet {
  device?: string;
  eventType?: string;
  channel?: number | string;
}


@Injectable({
  providedIn: 'root'
})
export class MidiSystemService {
  private midi: WebMidi.MIDIAccess | undefined;
  private inputDevices = new Map<string, WebMidi.MIDIInput>();
  private outputDevices = new Map<string, WebMidi.MIDIOutput>();

  constructor() {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess()
        .then(
          (midiAccess: WebMidi.MIDIAccess) => {
            this.midi = midiAccess;
          }, (err: object) => {
            throw err;
          }
        );
    } else {
      console.error("This browser does not support MIDI.");
    }
  }

  public shutdown() {
    console.log("SHUTDOWN");
    for (const output of this.getOutputDevices()) {
      for (let channel = 0; channel < 16; channel++) {
        const allNotesOff = [0xB0 | (channel & 0x0F), 123, 0];
        output.send(allNotesOff);
      }
    }
  }

  public setDevices(inputs: DeviceList, outputs: DeviceList) {
    // this.listDevices();
    // this.showDevices();

    this.inputDevices.clear();
    this.outputDevices.clear();

    for (let input of inputs) {
      const inputDevice = this.findInputDevice(input.name);
      if (!inputDevice) {
        console.error(`Cannot find input ${input.name}`);
      } else {
        this.inputDevices.set(input.id, inputDevice);
      }
    }

    for (let output of outputs) {
      const outputDevice = this.findOutputDevice(output.name);
      if (!outputDevice) {
        console.error(`Cannot find output ${output.name}`);
      } else {
        this.outputDevices.set(output.id, outputDevice);
      }
    }
  }

  public getInputDevices() {
    if (this.midi) {
      return this.midi.inputs.values();
    } else {
      throw new Error("MidiSystem not started");
    }
  }

  public getOutputDevices() {
    if (this.midi) {
      return this.midi.outputs.values();
    } else {
      throw new Error("MidiSystem not started");
    }
  }

  public listDevices() {
    for (const input of this.getInputDevices()) {
      console.log(`INPUT '${input.name}': ${input.id}`);
    }
    for (const output of this.getOutputDevices()) {
      console.log(`OUTPUT '${output.name}': ${output.id}`);
    }
  }

  public showDevices() {
    for (const input of this.getInputDevices()) {
      console.log(`INPUT PORT [type:'${input.type}']` +
                  ` id:'${input.id}'` +
                  ` manufacturer:'${input.manufacturer}'` +
                  ` name:'${input.name}'` +
                  ` version:'${input.version}'`);
    }
    for (const output of this.getOutputDevices()) {
      console.log(`OUTPUT PORT [type:'${output.type}']` +
                  ` id:'${output.id}` +
                  ` manufacturer:'${output.manufacturer}` +
                  ` name:'${output.name}'` +
                  ` version:'${output.version}'`);
    }
  }

  public findInputDevice(name: string) {
    for (let device of this.getInputDevices()) {
      if (device.name === name) {
        return device;
      }
    }
    return undefined;
  }

  public findOutputDevice(name: string) {
    for (let device of this.getOutputDevices()) {
      if (device.name === name) {
        return device;
      }
    }
    return undefined;
  }

  public getInputDevice(id: string) {
    return this.inputDevices.get(id);
  }

  public getOutputDevice(id: string) {
    return this.outputDevices.get(id);
  }

  public traceMessage(msg: string, message: Uint8Array | number[]) {
    let result = "";
    for (const byte of message) {
      result += byte.toString(16) + " ";
    }
    console.log(msg, result.trim());
  }

  public sendMessage(input: Device | undefined,
                     message: Uint8Array | number[],
                     maps: MapList) {
    if (input) {
      this.traceMessage(`SEND MESSAGE [${input.id}]`,  message);
    } else {
      this.traceMessage("SEND MESSAGE",  message);
    }

    const outputDevice = this.findOutputDevice("Synth input port (Qsynth1:0)");
    outputDevice!.send(message);
  }

  // public sendMessage(output: WebMidi.MIDIOutput,
  //                    message: Uint8Array | number[],
  //                    options: MidiOptions | undefined) {
  //   this.traceMessage("SEND MESSAGE",  message);
  //   if (message[0] >= 0x80 && message[0] < 0xF0) {
  //     let channel = (message[0] & 0x0F) + 1;
  //     channel = this.mapChannel(channel, options);
  //     message[0] = (message[0] & 0xF0) | ((channel - 1) & 0x0F);
  //   }
  //   output.send(message);
  // }
  //
  // private mapChannel(channel: number, options: MidiOptions | undefined): number {
  //   if (options === undefined || options.channelMap === undefined) {
  //     return channel;
  //   } else {
  //     let newChannel = (options as any).channelMap[channel];
  //     if (newChannel === undefined) {
  //       return channel;
  //     } else {
  //       return newChannel;
  //     }
  //   }
  // }
}
