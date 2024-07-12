import { TestBed } from '@angular/core/testing';

import { EncDecryptService } from './enc-decrypt.service';

describe('EncDecryptService', () => {
  let service: EncDecryptService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EncDecryptService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
