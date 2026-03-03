import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssingIndividualComponent } from './assing-individual.component';

describe('AssingIndividualComponent', () => {
  let component: AssingIndividualComponent;
  let fixture: ComponentFixture<AssingIndividualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AssingIndividualComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssingIndividualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
