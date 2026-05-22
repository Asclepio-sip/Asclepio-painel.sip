import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavbarAdministradorComponent } from "../../../../shared/navbar-administrador/navbar-administrador";
import { SidebarComponent } from "../../../../shared/sidebar/sidebar.component";

@Component({
  selector: 'app-add-funcionario-loja',
  standalone: true,
  imports: [NavbarAdministradorComponent, SidebarComponent],
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