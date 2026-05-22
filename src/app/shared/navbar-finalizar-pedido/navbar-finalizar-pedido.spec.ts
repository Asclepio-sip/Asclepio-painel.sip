import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarFinalizarPedido } from './navbar-finalizar-pedido';

describe('NavbarFinalizarPedido', () => {
  let component: NavbarFinalizarPedido;
  let fixture: ComponentFixture<NavbarFinalizarPedido>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarFinalizarPedido]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarFinalizarPedido);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
