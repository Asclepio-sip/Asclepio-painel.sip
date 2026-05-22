import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaDeLoja } from './lista-de-loja';

describe('ListaDeLoja', () => {
  let component: ListaDeLoja;
  let fixture: ComponentFixture<ListaDeLoja>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaDeLoja]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaDeLoja);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
