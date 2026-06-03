import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTemplateAssignServiceComponent } from './dialog-template-assign-services.component';

describe('DialogTemplateAssignServiceComponent', () => {
  let component: DialogTemplateAssignServiceComponent;
  let fixture: ComponentFixture<DialogTemplateAssignServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogTemplateAssignServiceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogTemplateAssignServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
