import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerateQR } from './generateqr.component';

describe('GenerateQR', () => {
  let component: GenerateQR;
  let fixture: ComponentFixture<GenerateQR>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GenerateQR ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenerateQR);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
