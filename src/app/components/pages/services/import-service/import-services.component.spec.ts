import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportServicesComponent } from './import-services.component';

describe('UpdateServicesComponent', () => {
  let component: ImportServicesComponent;
  let fixture: ComponentFixture<ImportServicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportServicesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
