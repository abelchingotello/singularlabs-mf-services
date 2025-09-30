import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPersonaStatusComponent } from './dialog-persona-status.component';

describe('DialogPersonaStatusComponent', () => {
  let component: DialogPersonaStatusComponent;
  let fixture: ComponentFixture<DialogPersonaStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogPersonaStatusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogPersonaStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
