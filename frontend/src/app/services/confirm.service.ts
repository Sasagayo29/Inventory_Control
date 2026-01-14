import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  // Variáveis para controlar o modal
  message: string = '';
  isVisible: boolean = false;
  
  // Guardamos a função que resolve a promessa
  private resolveRef: any;

  ask(message: string): Promise<boolean> {
    this.message = message;
    this.isVisible = true;

    // Retorna uma promessa que o componente vai resolver quando clicar em Sim/Não
    return new Promise<boolean>((resolve) => {
      this.resolveRef = resolve;
    });
  }

  confirm() {
    this.isVisible = false;
    if (this.resolveRef) this.resolveRef(true);
  }

  cancel() {
    this.isVisible = false;
    if (this.resolveRef) this.resolveRef(false);
  }
}