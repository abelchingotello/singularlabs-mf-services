import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogCommissionAssingServiceComponent } from './dialog-comision-assing-service.component';

describe('DialogCommissionAssingServiceComponent', () => {
  let component: DialogCommissionAssingServiceComponent;
  let fixture: ComponentFixture<DialogCommissionAssingServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogCommissionAssingServiceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogCommissionAssingServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
