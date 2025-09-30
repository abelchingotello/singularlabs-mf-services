import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPersonaHabComponent } from './dialog-persona-hab.component';

describe('DialogPersonaHabComponent', () => {
  let component: DialogPersonaHabComponent;
  let fixture: ComponentFixture<DialogPersonaHabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogPersonaHabComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogPersonaHabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
