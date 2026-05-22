import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestaoDeLoja } from './gestao-de-loja';

describe('GestaoDeLoja', () => {
  let component: GestaoDeLoja;
  let fixture: ComponentFixture<GestaoDeLoja>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestaoDeLoja]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestaoDeLoja);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
