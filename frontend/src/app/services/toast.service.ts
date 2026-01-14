import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastData {
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new BehaviorSubject<ToastData>({ 
    message: '', 
    type: 'info', 
    show: false 
  });

  toastState = this.toastSubject.asObservable();

  constructor() {}

  show(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.toastSubject.next({ message, type, show: true });

    // Fecha automaticamente após 3 segundos
    setTimeout(() => {
      this.hide();
    }, 3000);
  }

  hide() {
    const current = this.toastSubject.value;
    this.toastSubject.next({ ...current, show: false });
  }
}