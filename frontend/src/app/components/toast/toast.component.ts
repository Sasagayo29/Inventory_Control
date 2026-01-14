import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastData } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="data.show" class="toast-container" [ngClass]="data.type">
      <div class="icon">
        <span class="material-icons" *ngIf="data.type === 'success'">check_circle</span>
        <span class="material-icons" *ngIf="data.type === 'error'">error</span>
        <span class="material-icons" *ngIf="data.type === 'info'">info</span>
      </div>
      <div class="message">{{ data.message }}</div>
      <button class="close-btn" (click)="close()">×</button>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 90px;
      right: 20px;
      min-width: 320px;
      background: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 15px;
      z-index: 9999;
      animation: slideIn 0.3s ease-out;
      border-left: 5px solid #ccc;
    }
    .success { border-left-color: #28a745; }
    .success .icon { color: #28a745; }
    .error { border-left-color: #dc3545; }
    .error .icon { color: #dc3545; }
    .info { border-left-color: #C69214; }
    .info .icon { color: #C69214; }
    
    .message { flex: 1; font-size: 0.95rem; color: #333; font-weight: 500; font-family: 'Roboto', sans-serif; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: #999; cursor: pointer; }
    
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  data: ToastData = { message: '', type: 'info', show: false };

  constructor(private toastService: ToastService) {
    this.toastService.toastState.subscribe(state => this.data = state);
  }

  close() { this.toastService.hide(); }
}