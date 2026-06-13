import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelaDeAddLoja } from './tela-de-add-loja';

describe('TelaDeAddLoja', () => {
  let component: TelaDeAddLoja;
  let fixture: ComponentFixture<TelaDeAddLoja>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelaDeAddLoja]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TelaDeAddLoja);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
