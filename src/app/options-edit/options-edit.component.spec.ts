import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionsEditComponent } from './options-edit.component';

describe('OptionsEditComponent', () => {
  let component: OptionsEditComponent;
  let fixture: ComponentFixture<OptionsEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OptionsEditComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OptionsEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
