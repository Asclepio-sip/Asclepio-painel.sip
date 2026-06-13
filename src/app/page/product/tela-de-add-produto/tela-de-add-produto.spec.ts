import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TelaDeAddProduto } from './tela-de-add-produto';

describe('TelaDeAddProduto', () => {
  let component: TelaDeAddProduto;
  let fixture: ComponentFixture<TelaDeAddProduto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelaDeAddProduto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TelaDeAddProduto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
