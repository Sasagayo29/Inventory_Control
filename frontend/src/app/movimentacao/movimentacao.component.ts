import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-movimentacao',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  templateUrl: './movimentacao.component.html',
  styleUrls: ['./movimentacao.component.scss']
})
export class MovimentacaoComponent implements AfterViewInit {
  modo: 'scanner' | 'busca' | 'detalhes' = 'scanner';
  scannerHabilitado = false;
  
  // Busca
  termoBusca = '';
  todosItens: any[] = [];
  itensFiltrados: any[] = [];
  
  // Detalhes
  itemSelecionado: any = null;
  
  // Form
  motivo = '';
  tipoMovimento = 'saida';
  quantidade = 1;
  nomeUsuario = '';

  constructor(private api: ApiService, private router: Router, private toast: ToastService) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.nomeUsuario = user.nome || 'Colaborador';
    this.carregarItensParaBusca();
  }

  ngAfterViewInit() { this.ativarScanner(); }

  ativarScanner() {
    this.modo = 'scanner';
    setTimeout(() => this.scannerHabilitado = true, 300);
  }

  carregarItensParaBusca() {
    this.api.getItens().subscribe(res => { this.todosItens = res; this.itensFiltrados = res; });
  }

  entrarModoBusca() {
    this.modo = 'busca';
    this.scannerHabilitado = false;
    this.termoBusca = '';
    this.itensFiltrados = this.todosItens;
  }

  filtrarItens() {
    const t = this.termoBusca.toLowerCase();
    this.itensFiltrados = this.todosItens.filter(i => i.nome.toLowerCase().includes(t) || i.codigo_qr.toLowerCase().includes(t));
  }

  selecionarItem(item: any) {
    this.itemSelecionado = item;
    this.modo = 'detalhes';
    this.scannerHabilitado = false;
  }

  onCodeResult(codigo: string) {
    this.scannerHabilitado = false;
    const item = this.todosItens.find(i => i.codigo_qr === codigo);
    if (item) this.selecionarItem(item);
    else {
      this.api.buscarItemPorCodigo(codigo).subscribe({
        next: (res) => this.selecionarItem(res),
        error: () => { this.toast.show('Item não encontrado', 'error'); this.ativarScanner(); }
      });
    }
  }

  confirmar() {
    if(!this.itemSelecionado) return;
    if (this.tipoMovimento === 'saida' && this.quantidade > this.itemSelecionado.estoque_atual) {
        this.toast.show(`Estoque insuficiente. Disp: ${this.itemSelecionado.estoque_atual}`, 'error');
        return;
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.api.movimentar({
      matricula_usuario: user.matricula,
      codigo_qr_item: this.itemSelecionado.codigo_qr,
      tipo: this.tipoMovimento,
      motivo: this.motivo,
      quantidade: this.quantidade
    }).subscribe({
      next: (res: any) => {
        this.toast.show(`Sucesso! Saldo: ${res.novo_saldo}`, 'success');
        this.itemSelecionado.estoque_atual = res.novo_saldo; // Atualiza local
        this.cancelar();
      },
      error: () => this.toast.show('Erro na movimentação', 'error')
    });
  }

  cancelar() { this.itemSelecionado = null; this.motivo = ''; this.quantidade = 1; this.ativarScanner(); }
  logout() { localStorage.removeItem('user'); this.router.navigate(['/login']); }
}