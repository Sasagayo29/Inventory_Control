import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard = () => {
  const router = inject(Router);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (user && user.tipo === 'admin') {
    return true; // Permite acesso
  } else {
    // Chuta para login ou movimentação
    router.navigate(['/login']);
    return false;
  }
};