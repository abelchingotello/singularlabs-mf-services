import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconTypeComponent } from './icons_type.component';

describe('IconTypeComponent', () => {
  let component: IconTypeComponent;
  let fixture: ComponentFixture<IconTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IconTypeComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(IconTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
