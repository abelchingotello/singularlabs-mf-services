import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogPersonEntityTypeComponent } from './dialog-person-entity-type.component';

describe('DialogPersonEntityTypeComponent', () => {
  let component: DialogPersonEntityTypeComponent;
  let fixture: ComponentFixture<DialogPersonEntityTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogPersonEntityTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogPersonEntityTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
