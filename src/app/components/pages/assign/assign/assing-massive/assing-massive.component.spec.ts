import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssingMassiveComponent } from './assing-massive.component';

describe('AssingMassiveComponent', () => {
  let component: AssingMassiveComponent;
  let fixture: ComponentFixture<AssingMassiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssingMassiveComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssingMassiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
