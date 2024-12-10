import { TestBed } from '@angular/core/testing';

import { AppGuard } from './app.guard';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AppGuard', () => {
  let guard: AppGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports:[HttpClientTestingModule]
    });
    guard = TestBed.inject(AppGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
