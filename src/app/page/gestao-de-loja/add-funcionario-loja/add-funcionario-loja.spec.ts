import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFuncionarioLoja } from './add-funcionario-loja';

describe('AddFuncionarioLoja', () => {
  let component: AddFuncionarioLoja;
  let fixture: ComponentFixture<AddFuncionarioLoja>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFuncionarioLoja]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFuncionarioLoja);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
