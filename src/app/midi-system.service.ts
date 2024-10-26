/// <reference types="webmidi" />
// Triple slash commands are interpreted by typescript type system

// --------------
// Try to replace this with webmidi.js library (https://webmidijs.org/docs/)
// --------------

import { Injectable } from '@angular/core';

// Light wrapper of webmidi interface.

export type DeviceList = Device[];

export interface Device {
  id: string;
  title: string;
  portName: string;
  channels: ChannelList;
}

export type ChannelList = Channel[];

export interface Channel {
  id: string;
  channel: number;
}

export type MapList = Map[];

export interface Map {
  comments?: string;
  source?: EventSet;
  dest?: EventSet;
  keepMapping?: boolean;  // if false, the first valid map stops check
  ignoreVelocity?: boolean;
}

export interface EventSet {
  deviceId?: string;
  channel?: number | string;
  eventType?: string;
  noteMin?: number;
  noteMax?: number;
}

export type Message = Uint8Array | number[];


@Injectable({
  providedIn: 'root'
})
export class MidiSystemService {
  private midi: WebMidi.MIDIAccess | undefined;
  private inputs: DeviceList | undefined;
  private outputs: DeviceList | undefined;
  private inputPorts = new Map<string, WebMidi.MIDIInput>();
  private outputPorts = new Map<string, WebMidi.MIDIOutput>();

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
    for (const output of this.getOutputPorts()) {
      for (let channel = 0; channel < 16; channel++) {
        const allNotesOff = [0xB0 | (channel & 0x0F), 123, 0];
        output.send(allNotesOff);
      }
    }
  }

  public setDevices(inputs: DeviceList, outputs: DeviceList) {
    this.listPorts();
    // this.showPorts();

    this.inputs = inputs;
    this.outputs = outputs;
    this.inputPorts.clear();
    this.outputPorts.clear();

    for (let input of inputs) {
      const inputPort = this.findInputPort(input.portName);
      if (!inputPort) {
        console.error(`Cannot find input ${input.portName}`);
      } else {
        console.log(`Connected to input ${input.portName}`);
        this.inputPorts.set(input.id, inputPort);
      }
    }

    for (let output of outputs) {
      const outputPort = this.findOutputPort(output.portName);
      if (!outputPort) {
        console.error(`Cannot find output ${output.portName}`);
      } else {
        console.log(`Connected to output ${output.portName}`);
        this.outputPorts.set(output.id, outputPort);
      }
    }
  }

  public getInputPorts() {
    if (this.midi) {
      return this.midi.inputs.values();
    } else {
      throw new Error("MidiSystem not started");
    }
  }

  public getOutputPorts() {
    if (this.midi) {
      return this.midi.outputs.values();
    } else {
      throw new Error("MidiSystem not started");
    }
  }

  public listPorts() {
    console.log("#### List of ports:");
    for (const input of this.getInputPorts()) {
      console.log(`  INPUT '${input.name}': #${input.id.substring(input.id.length - 5)}`);
    }
    for (const output of this.getOutputPorts()) {
      console.log(`  OUTPUT '${output.name}': #${output.id.substring(output.id.length - 5)}`);
    }
    console.log("  (end)");
  }

  public showPorts() {
    console.log("#### Ports info:");
    for (const input of this.getInputPorts()) {
      console.log(`INPUT PORT [type:'${input.type}']` +
                  ` id:'${input.id}'` +
                  ` manufacturer:'${input.manufacturer}'` +
                  ` name:'${input.name}'` +
                  ` version:'${input.version}'`);
    }
    for (const output of this.getOutputPorts()) {
      console.log(`OUTPUT PORT [type:'${output.type}']` +
                  ` id:'${output.id}` +
                  ` manufacturer:'${output.manufacturer}` +
                  ` name:'${output.name}'` +
                  ` version:'${output.version}'`);
    }
  }

  public findInputPort(name: string) {
    for (let port of this.getInputPorts()) {
      if (port.name === name) {
        return port;
      }
    }
    return undefined;
  }

  public findOutputPort(name: string) {
    for (let port of this.getOutputPorts()) {
      if (port.name === name) {
        return port;
      }
    }
    return undefined;
  }

  public getInputDevice(id: string | undefined) {
    if (id) {
      return this.inputs?.find(input => (input.id === id));
    } else {
      return undefined;
    }
  }

  public getOutputDevice(id: string | undefined) {
    if (id) {
      return this.outputs?.find(output => (output.id === id));
    } else {
      return undefined;
    }
  }

  public getInputPort(id: string | undefined) {
    if (id) {
      return this.inputPorts.get(id);
    } else {
      return undefined;
    }
  }

  public getOutputPort(id: string | undefined) {
    if (id) {
      return this.outputPorts.get(id);
    } else {
      return undefined;
    }
  }

  public traceMessage(msg: string, message: Message) {
    let result = "";
    for (const byte of message) {
      result += byte.toString(16) + " ";
    }
    console.log(msg, result.trim());
  }

  public sendMessage(input: Device | undefined,
                     message: Message,
                     maps: MapList) {
    if (input) {
      this.traceMessage(`SEND MESSAGE [${input.id}]`,  message);
    } else {
      this.traceMessage("SEND MESSAGE", message);
    }

    for (let map of maps) {
      const message2 = this.mapMessage(input, message, map);
      if (message2) {
        const output = map.dest?.deviceId;
        if (output) {
          const outputPort = this.getOutputPort(output);
          if (outputPort) {
            console.log("outputPort", outputPort.name);
            this.traceMessage("  ->", message2);
            outputPort.send(message2);
          }
        }
        if (!map.keepMapping) {
          break;
        }
      }
    }
  }

  private mapMessage(input: Device | undefined,
                     message: Message,
                     map: Map): Message | undefined {

    const message2 = [...message];

    const srcDeviceId = map.source?.deviceId;
    if (srcDeviceId && (srcDeviceId !== input?.id)) {
      return undefined;
    }

    const srcChannel = this.getChannelNumber(input, map.source?.channel);
    if (srcChannel) {
      if (message[0] >= 0x80 && message[0] < 0xF0) {
        let msgChannel = (message[0] & 0x0F) + 1;
        if (srcChannel != msgChannel) {
          return undefined;
        }
        const dstDeviceId = this.getOutputDevice(map.dest?.deviceId);
        let dstChannel = this.getChannelNumber(dstDeviceId, map.dest?.channel);
        if (dstChannel) {
          message2[0] = (message[0] & 0xF0) | ((dstChannel - 1) & 0x0F);
        }
      }
    }

    const srcEventType = map.source?.eventType;
    const msgEventType = this.getEventType(message);
    if (srcEventType && (srcEventType !== msgEventType)) {
      return undefined;
    }

    if (msgEventType === "note") {
      const srcNoteMin = map.source?.noteMin;
      const srcNoteMax = map.source?.noteMax;
      const msgNote = this.getNote(message);
      if (((typeof srcNoteMin !== "undefined") ||
           (typeof srcNoteMax !== "undefined")) &&
          (typeof msgNote !== "undefined")) {
        if (msgNote < (srcNoteMin || 0) ||
            msgNote > (srcNoteMax || 127)) {
          return undefined
        }

        const dstNoteMin = map.dest?.noteMin;
        if ((typeof srcNoteMin !== "undefined") &&
            (typeof dstNoteMin !== "undefined")) {
          message2[1] = (msgNote + dstNoteMin - srcNoteMin) & 0x7F;
        }
      }

      if (map.ignoreVelocity) {
        message2[2] = 0x7f;
      }
    }

    return message2;
  }

  private getChannelNumber(device: Device | undefined,
                           channel: number | string | undefined): number | undefined {
    if (!channel) {
      return undefined;
    }

    if (typeof channel === "number") {
      return channel;
    }

    for (let chan of device?.channels || []) {
      if (chan.id === channel) {
        return chan.channel;
      }
    }

    return undefined;
  }

  private getEventType(message: Message) {
    const msgStatus = message[0] & 0xF0;

    if (msgStatus === 0x80 || msgStatus === 0x90) {
      return "note";
    } else if (msgStatus === 0xb0) {
      return "control";
    } else if (msgStatus === 0xc0) {
      return "program";
    } else if (msgStatus === 0xf0) {
      return "pitch";
    } else {
      return "other";
    }
  }

  private getNote(message: Message) {
    if (this.getEventType(message) === "note") {
      return message[1] & 0x7F;
    } else {
      return undefined;
    }
  }
}
