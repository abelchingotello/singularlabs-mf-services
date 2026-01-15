import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogServiceConfigComponent } from './dialog-service-config.component';

describe('DialogServiceConfigComponent', () => {
  let component: DialogServiceConfigComponent;
  let fixture: ComponentFixture<DialogServiceConfigComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialogServiceConfigComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DialogServiceConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
