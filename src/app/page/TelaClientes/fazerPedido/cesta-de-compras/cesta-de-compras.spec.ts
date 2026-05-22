import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CestaDeCompras } from './cesta-de-compras';

describe('CestaDeCompras', () => {
  let component: CestaDeCompras;
  let fixture: ComponentFixture<CestaDeCompras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CestaDeCompras]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CestaDeCompras);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
