import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogServiceAssignProviderStatusComponent } from './dialog-service-assign-provider-status.component';

describe('DialogServiceAssignProviderStatusComponent', () => {
  let component: DialogServiceAssignProviderStatusComponent;
  let fixture: ComponentFixture<DialogServiceAssignProviderStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogServiceAssignProviderStatusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogServiceAssignProviderStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
