import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogServiceStatusComponent } from './dialog-service-status.component';

describe('DialogServiceStatusComponent', () => {
  let component: DialogServiceStatusComponent;
  let fixture: ComponentFixture<DialogServiceStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogServiceStatusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogServiceStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
