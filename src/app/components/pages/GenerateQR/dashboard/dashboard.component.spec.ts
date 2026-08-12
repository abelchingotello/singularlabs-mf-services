import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { GenerateQrDashboardComponent } from './dashboard.component';
import { ServicesService } from 'src/app/services/services.service';

describe('GenerateQrDashboardComponent', () => {
  let component: GenerateQrDashboardComponent;
  let fixture: ComponentFixture<GenerateQrDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GenerateQrDashboardComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: ServicesService,
          useValue: { getServices: () => of({ data: { Items: [] } }) }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateQrDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
