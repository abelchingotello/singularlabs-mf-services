import { TestBed } from '@angular/core/testing';

import { GenerateQrService } from './generateqr.service';

describe('GenerateQrService', () => {
  let service: GenerateQrService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GenerateQrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
