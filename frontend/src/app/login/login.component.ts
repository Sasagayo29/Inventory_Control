import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  matricula: string = '';
  senha: string = '';
  mostrarSenha: boolean = false; // Controle do olhinho

  constructor(
    private api: ApiService, 
    private router: Router, 
    private toast: ToastService
  ) {}

  login() {
    if (!this.matricula || !this.senha) {
      this.toast.show('Por favor, preencha matrícula e senha.', 'info');
      return;
    }

    this.api.login({ matricula: this.matricula, senha: this.senha }).subscribe({
      next: (res: any) => {
        this.toast.show(`Bem-vindo, ${res.nome}!`, 'success');
        localStorage.setItem('user', JSON.stringify(res));
        
        if (res.tipo === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/movimentacao']);
        }
      },
      error: (err: any) => {
        this.toast.show('Acesso negado. Verifique credenciais.', 'error');
      }
    });
  }
}