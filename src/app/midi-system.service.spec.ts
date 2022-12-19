import { TestBed } from '@angular/core/testing';

import { MidiSystemService } from './midi-system.service';

describe('MidiSystemService', () => {
  let service: MidiSystemService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MidiSystemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
