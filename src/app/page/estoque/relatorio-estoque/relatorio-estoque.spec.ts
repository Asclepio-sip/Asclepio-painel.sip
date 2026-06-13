import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatorioEstoque } from './relatorio-estoque';

describe('RelatorioEstoque', () => {
  let component: RelatorioEstoque;
  let fixture: ComponentFixture<RelatorioEstoque>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatorioEstoque]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelatorioEstoque);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
