import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletFormComponent } from './delet-form.component';

describe('DeletFormComponent', () => {
  let component: DeletFormComponent;
  let fixture: ComponentFixture<DeletFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeletFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
