import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenerateQrReportsComponent } from './generateqr-reports.component';

describe('GenerateQrReportsComponent', () => {
  let component: GenerateQrReportsComponent;
  let fixture: ComponentFixture<GenerateQrReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GenerateQrReportsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateQrReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
