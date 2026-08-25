import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogServiceCreationAssignmentComponent } from './dialog-service-creation-assignment.component';

describe('DialogServiceCreationAssignmentComponent', () => {
  let component: DialogServiceCreationAssignmentComponent;
  let fixture: ComponentFixture<DialogServiceCreationAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogServiceCreationAssignmentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogServiceCreationAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
