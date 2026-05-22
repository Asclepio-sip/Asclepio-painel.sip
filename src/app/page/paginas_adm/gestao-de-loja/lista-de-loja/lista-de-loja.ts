import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Loja, LojaService } from '../../../../service/loja/loja.service';
import { ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-lista-de-loja',
  standalone: true,
  imports: [CommonModule, RouterModule], 
  templateUrl: './lista-de-loja.html',
  styleUrls: ['./lista-de-loja.css'],
})
export class ListaDeLoja implements OnInit {

  lojas: Loja[] = [];

  constructor(
    private lojaService: LojaService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarLojas();
  }

  carregarLojas() {
    this.lojaService.listar().subscribe(dados => {
      this.lojas = dados;
      this.cdr.detectChanges();
    });
  }

  editar(loja: Loja) {
    this.router.navigate(['/editar-loja', loja.id]);
  }

  adicionarFuncionario(loja: Loja) {
    this.router.navigate(['/addloja', loja.id, 'funcionarios']);
  }

  relacionarBairro(loja: Loja) {

  this.router.navigate([
    '/relacionar-bairro',
    loja.id
  ]);
}
}