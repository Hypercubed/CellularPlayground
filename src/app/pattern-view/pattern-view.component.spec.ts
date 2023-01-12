import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatternViewComponent } from './pattern-view.component';

describe('PatternViewComponent', () => {
  let component: PatternViewComponent;
  let fixture: ComponentFixture<PatternViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PatternViewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PatternViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
