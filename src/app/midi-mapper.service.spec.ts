import { TestBed } from '@angular/core/testing';

import { MidiMapperService } from './midi-mapper.service';

describe('MidiMapperService', () => {
  let service: MidiMapperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MidiMapperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
