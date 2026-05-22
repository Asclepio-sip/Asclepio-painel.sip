import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaDeProduto } from './lista-de-produto';

describe('ListaDeProduto', () => {
  let component: ListaDeProduto;
  let fixture: ComponentFixture<ListaDeProduto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaDeProduto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaDeProduto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
