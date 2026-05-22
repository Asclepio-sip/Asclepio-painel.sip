import { Component } from '@angular/core';
import { Navbar } from '../../shared/navbar/navbar';
import { AuthService } from '../../service/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NavbarAdministradorComponent } from "../navbar-administrador/navbar-administrador";

@Component({
  selector: 'app-add-usuario',
  imports: [CommonModule, FormsModule, NavbarAdministradorComponent],
  templateUrl: './add-usuario.html',
  styleUrl: './add-usuario.css',
})
export class AddUsuario {
  

  login = '';
  password = '';
  role: 'ADMIN' | 'USER' = 'USER';

  constructor(private authService: AuthService) {}

  salvar() {
    this.authService.register(this.login, this.password, this.role)
      .subscribe({
        next: () => {
          alert('Usuário criado com sucesso!');
          this.login = '';
          this.password = '';
          this.role = 'USER';
        },
        error: err => {
          alert(err.error || 'Erro ao criar usuário');
        }
      });
  }

}
