import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusConciliationComponent } from './status-conciliation.component';

describe('StatusConciliationComponent', () => {
  let component: StatusConciliationComponent;
  let fixture: ComponentFixture<StatusConciliationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StatusConciliationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusConciliationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
