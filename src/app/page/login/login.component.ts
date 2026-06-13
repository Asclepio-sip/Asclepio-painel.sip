import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
   styleUrl: './login.css',
})
export class LoginComponent {

  login = '';
  password = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  entrar() {
    this.authService.login(this.login, this.password).subscribe({
      next: () => this.router.navigate(['/products']),
      error: () => alert('Login ou senha inválidos')
    });
  }
}
