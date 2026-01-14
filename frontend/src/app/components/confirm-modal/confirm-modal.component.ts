import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="confirmService.isVisible">
      <div class="modal-box">
        <div class="modal-icon">
          <span class="material-icons">help_outline</span>
        </div>
        <h3>Confirmação</h3>
        <p>{{ confirmService.message }}</p>
        
        <div class="modal-actions">
          <button class="btn-cancel" (click)="confirmService.cancel()">Cancelar</button>
          <button class="btn-confirm" (click)="confirmService.confirm()">Confirmar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5); /* Fundo escuro transparente */
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000; /* Fica acima de tudo */
      animation: fadeIn 0.2s;
    }

    .modal-box {
      background: white;
      padding: 30px;
      border-radius: 12px;
      width: 90%;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      animation: scaleUp 0.2s;
    }

    .modal-icon span {
      font-size: 48px;
      color: #C69214; /* Dourado Kinross */
      margin-bottom: 15px;
    }

    h3 { margin: 0 0 10px; color: #333; }
    p { color: #666; margin-bottom: 25px; font-size: 1rem; }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    button {
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;
    }

    .btn-cancel {
      background: #e9ecef;
      color: #495057;
      &:hover { background: #dee2e6; }
    }

    .btn-confirm {
      background: #dc3545; /* Vermelho para ações destrutivas */
      color: white;
      &:hover { background: #c82333; }
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.9); } to { transform: scale(1); } }
  `]
})
export class ConfirmModalComponent {
  // Injeta o serviço como 'public' para usar no HTML
  constructor(public confirmService: ConfirmService) {}
}