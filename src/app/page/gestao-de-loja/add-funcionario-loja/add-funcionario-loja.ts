import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-funcionario-loja',
  standalone: true,
  imports: [],
  templateUrl: './add-funcionario-loja.html',
  styleUrls: ['./add-funcionario-loja.css'],
})
export class AddFuncionarioLoja implements OnInit {

  lojaId!: number;

  ngOnInit() {
    this.lojaId = Number(
      inject(ActivatedRoute).snapshot.paramMap.get('id')
    );
  }
}