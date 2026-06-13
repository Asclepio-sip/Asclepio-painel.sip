import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditCartegoria } from './add-edit-cartegoria';

describe('AddEditCartegoria', () => {
  let component: AddEditCartegoria;
  let fixture: ComponentFixture<AddEditCartegoria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditCartegoria]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEditCartegoria);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
