import { TestBed } from '@angular/core/testing';

import { MidiPlayerService } from './midi-player.service';

describe('MidiPlayerService', () => {
  let service: MidiPlayerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MidiPlayerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
