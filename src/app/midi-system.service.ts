/// <reference types="webmidi" />
// Triple slash commands are interpreted by typescript type system

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MidiSystemService {
  private midi: WebMidi.MIDIAccess | undefined;

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

  public getInputs() {
    if (this.midi) {
      return this.midi.inputs.values();
    } else {
      return [];
    }
  }

  public getOutputs() {
    if (this.midi) {
      return this.midi.outputs.values();
    } else {
      return [];
    }
  }

  public listPorts() {
    for (const input of this.getInputs()) {
      console.log(`INPUT '${input.name}': ${input.id}`);
    }
    for (const output of this.getOutputs()) {
      console.log(`OUTPUT '${output.name}': ${output.id}`);
    }
  }

  public showPorts() {
    for (const input of this.getInputs()) {
      console.log(`INPUT PORT [type:'${input.type}']` +
                  ` id:'${input.id}'` +
                  ` manufacturer:'${input.manufacturer}'` +
                  ` name:'${input.name}'` +
                  ` version:'${input.version}'`);
    }
    for (const output of this.getOutputs()) {
      console.log(`OUTPUT PORT [type:'${output.type}']` +
                  ` id:'${output.id}` +
                  ` manufacturer:'${output.manufacturer}` +
                  ` name:'${output.name}'` +
                  ` version:'${output.version}'`);
    }
  }

  public findInput(name: string) {
    for (const input of this.getInputs()) {
      if (input.name == name) {
        return input;
      }
    }
    return undefined;
  }

  public findOutput(name: string) {
    for (const output of this.getOutputs()) {
      if (output.name == name) {
        return output;
      }
    }
    return undefined;
  }

  public traceMessage(msg: string, message: Uint8Array | number[]) {
    let result = "";
    for (const byte of message) {
      result += byte.toString(16) + " ";
    }
    console.log(msg, result.trim());
  }

  public sendMessage(output: WebMidi.MIDIOutput, message: Uint8Array | number[]) {
    this.traceMessage("SEND MESSAGE",  message);
    if (message[0] >= 0x80 && message[0] < 0xF0) {
      let channel = (message[0] & 0x0F) + 1;
      console.log(message, "   ", channel);
      if (channel == 1) {
        channel = 6;
      }
      message[0] = (message[0] & 0xF0) | ((channel - 1) & 0x0F);
    }
    output.send(message);
  }
}
