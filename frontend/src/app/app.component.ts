import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterModule } from '@angular/router';
// Importando os componentes visuais
import { ToastComponent } from './components/toast/toast.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  // Adicionando eles na lista de imports para o HTML poder usar
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterModule, 
    ToastComponent, 
    ConfirmModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Kinross System';
  logoUrl = 'https://tamandua.tv.br/assets/img/logo_kinross.png';
}