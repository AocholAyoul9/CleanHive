import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProSignupComponent } from './pro-signup.component';

describe('ProSignupComponent', () => {
  let component: ProSignupComponent;
  let fixture: ComponentFixture<ProSignupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProSignupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProSignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
