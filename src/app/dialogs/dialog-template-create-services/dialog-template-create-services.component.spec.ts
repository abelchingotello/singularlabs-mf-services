import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogTemplateCreateServicesComponent } from './dialog-template-create-services.component';

describe('DialogTemplateCreateServicesComponent', () => {
  let component: DialogTemplateCreateServicesComponent;
  let fixture: ComponentFixture<DialogTemplateCreateServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogTemplateCreateServicesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogTemplateCreateServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
