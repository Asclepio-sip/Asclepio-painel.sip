import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarLoja } from './editar-loja';

describe('EditarLoja', () => {
  let component: EditarLoja;
  let fixture: ComponentFixture<EditarLoja>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarLoja]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarLoja);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
