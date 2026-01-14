import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import { ConfirmService } from '../services/confirm.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('excelInput') excelInput!: ElementRef;

  abaAtiva: string = 'dashboard';
  stats: any = null;
  listaCriticos: any[] = [];
  
  // Dados
  itens: any[] = [];
  usuarios: any[] = [];
  historico: any[] = [];
  categoriasDb: any[] = [];
  categoriasDisponiveis: string[] = [];
  
  // ITEM FORM (Com Custo)
  novoItem: any = { 
    nome: '', estoque_inicial: 0, estoque_minimo: 5, custo_unitario: 0, categoria: 'Geral', localizacao: '',
    serial_number: '', part_number: '', marca: '', modelo: '', fabricante: ''
  };
  arquivoFoto: File | null = null;
  
  // USUÁRIO FORM
  novoUsuario: any = { nome: '', matricula: '', senha: '', tipo: 'comum', empresa: 'Kinross' };
  empresaSelecionada: string = 'Kinross'; 
  nomeEmpresaTerceira: string = ''; 

  // EDIÇÃO
  itemEmEdicao: any = null;
  arquivoFotoEdicao: File | null = null;
  removerFotoEdicao: boolean = false;
  previewFotoEdicao: string | null = null;

  usuarioEmEdicao: any = null;
  empresaEdicaoSelecionada: string = 'Kinross';
  nomeEmpresaEdicaoTerceira: string = '';

  // Config Categorias
  novaCategoria: string = '';
  categoriaEmEdicao: any = null;

  // Filtros & UI
  termoBusca: string = '';
  filtroCategoria: string = 'Todas';
  filtroAberto: boolean = false;
  ultimoQrCode: string = '';
  ultimoQrNome: string = '';
  mostrarSenhaCadastro: boolean = false;
  mostrarSenhaEdicao: boolean = false;

// --- CONFIGURAÇÃO DE GRÁFICOS ---
  
  // 1. Linha (Tendência)
  lineChartType: ChartType = 'line';
  lineChartData: ChartData<'line'> = { labels: [], datasets: [{ data: [], label: 'Movimentações', borderColor: '#C69214', backgroundColor: 'rgba(198, 146, 20, 0.2)', fill: true }] };
  lineChartOptions: ChartConfiguration['options'] = { 
    responsive: true, 
    elements: { line: { tension: 0.4 } },
    plugins: { legend: { display: true } } 
  };

  // 2. Barras (Top 5) - ADICIONADO QUE FALTAVA
  barChartType: ChartType = 'bar';
  barChartData: ChartData<'bar'> = { labels: [], datasets: [{ data: [], label: 'Qtd Movimentada', backgroundColor: '#2c3e50' }] };
  barChartOptions: ChartConfiguration['options'] = { 
    responsive: true, 
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } } // Esconde legenda redundante
  };
  
  // 3. Pizza/Donut (Financeiro) - ADICIONADO QUE FALTAVA
  pieChartType: ChartType = 'doughnut';
  pieChartData: ChartData<'doughnut'> = { labels: [], datasets: [{ data: [], backgroundColor: ['#C69214', '#2c3e50', '#28a745', '#dc3545', '#17a2b8', '#ffc107'] }] };
  pieChartOptions: ChartConfiguration['options'] = { 
    responsive: true, 
    plugins: { legend: { position: 'bottom' } } 
  };
  
  constructor(private api: ApiService, private toast: ToastService, private confirm: ConfirmService) {}

  ngOnInit() { this.carregarTudo(); }

  carregarTudo() { 
    this.carregarDashboard(); this.carregarItens(); this.carregarUsuarios(); this.carregarHistorico(); this.carregarCategorias(); 
  }
  trocarAba(aba: string) { this.abaAtiva = aba; if(aba === 'dashboard') this.carregarDashboard(); }

  // --- DASHBOARD INTELIGENTE ---
  carregarDashboard() {
    this.api.getDashboardStats().subscribe((res: any) => {
      this.stats = res.kpis;
      this.listaCriticos = res.lista_criticos;
      
      // Gráfico de Tendência (Linha)
      this.lineChartData = { 
        labels: res.graficos.tendencia.labels, 
        datasets: [{ data: res.graficos.tendencia.data, label: 'Consumo (7 Dias)', borderColor: '#C69214', backgroundColor: 'rgba(198, 146, 20, 0.1)', fill: true }] 
      };

      // Gráfico Top 5 (Barras)
      this.barChartData = {
        labels: res.graficos.top5.labels,
        datasets: [{ data: res.graficos.top5.data, label: 'Itens Mais Movimentados', backgroundColor: '#2c3e50' }]
      };

      // Gráfico Financeiro (Donut)
      this.pieChartData = {
        labels: res.graficos.financeiro.labels,
        datasets: [{ data: res.graficos.financeiro.data, backgroundColor: ['#C69214', '#2c3e50', '#27ae60', '#c0392b', '#2980b9', '#8e44ad'] }]
      };

      this.chart?.update();
    });
  }

  // --- ITENS ---
  carregarItens() { this.api.getItens().subscribe(res => this.itens = res); }
  onFileSelected(event: any) { this.arquivoFoto = event.target.files[0]; }

  cadastrarItem() {
    if (!this.novoItem.nome) { this.toast.show('Nome obrigatório', 'error'); return; }
    const fd = new FormData();
    fd.append('nome', this.novoItem.nome);
    fd.append('estoque_inicial', this.novoItem.estoque_inicial.toString());
    fd.append('estoque_minimo', this.novoItem.estoque_minimo.toString());
    fd.append('custo_unitario', this.novoItem.custo_unitario.toString());
    fd.append('categoria', this.novoItem.categoria);
    fd.append('localizacao', this.novoItem.localizacao || '');
    fd.append('serial_number', this.novoItem.serial_number || '');
    fd.append('part_number', this.novoItem.part_number || '');
    fd.append('marca', this.novoItem.marca || '');
    fd.append('modelo', this.novoItem.modelo || '');
    fd.append('fabricante', this.novoItem.fabricante || '');
    if (this.arquivoFoto) fd.append('foto', this.arquivoFoto);

    this.api.criarItemComFoto(fd).subscribe({
      next: (res: any) => {
        this.toast.show('Item criado!', 'success');
        this.carregarTudo();
        this.novoItem = { nome: '', estoque_inicial: 0, estoque_minimo: 5, custo_unitario: 0, categoria: 'Geral', localizacao: '', serial_number: '', part_number: '', marca: '', modelo: '', fabricante: '' };
        this.arquivoFoto = null;
        if(this.fileInput) this.fileInput.nativeElement.value = '';
        this.ultimoQrNome = res.codigo;
        this.ultimoQrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${res.codigo}`;
      },
      error: () => this.toast.show('Erro ao criar', 'error')
    });
  }

  iniciarEdicao(item: any) { 
    this.itemEmEdicao = { ...item };
    this.arquivoFotoEdicao = null; this.removerFotoEdicao = false; this.previewFotoEdicao = null;
    setTimeout(() => { document.querySelector('.edit-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  }
  cancelarEdicao() { this.itemEmEdicao = null; }
  
  onFileSelectedEdicao(event: any) {
    const file = event.target.files[0];
    if (file) { this.arquivoFotoEdicao = file; this.removerFotoEdicao = false; const r = new FileReader(); r.onload = (e: any) => this.previewFotoEdicao = e.target.result; r.readAsDataURL(file); }
  }
  marcarParaRemoverFoto() { this.removerFotoEdicao = true; this.arquivoFotoEdicao = null; this.previewFotoEdicao = null; }

  salvarEdicao() {
    if(!this.itemEmEdicao) return;
    const fd = new FormData();
    fd.append('nome', this.itemEmEdicao.nome);
    fd.append('estoque_atual', this.itemEmEdicao.estoque_atual.toString());
    fd.append('estoque_minimo', this.itemEmEdicao.estoque_minimo.toString());
    fd.append('custo_unitario', this.itemEmEdicao.custo_unitario.toString());
    fd.append('marca', this.itemEmEdicao.marca || '');
    fd.append('modelo', this.itemEmEdicao.modelo || '');
    fd.append('serial_number', this.itemEmEdicao.serial_number || '');
    fd.append('part_number', this.itemEmEdicao.part_number || '');
    fd.append('fabricante', this.itemEmEdicao.fabricante || '');
    if (this.removerFotoEdicao) fd.append('remover_imagem', 'true');
    else if (this.arquivoFotoEdicao) fd.append('foto', this.arquivoFotoEdicao);

    this.api.atualizarItem(this.itemEmEdicao.id, fd).subscribe({
      next: () => { this.toast.show('Atualizado!', 'success'); this.itemEmEdicao = null; this.carregarTudo(); },
      error: () => this.toast.show('Erro', 'error')
    });
  }
  async deletarItem(id: number) { if(await this.confirm.ask('Excluir?')) this.api.deletarItem(id).subscribe(() => { this.toast.show('Excluído','info'); this.carregarTudo(); }); }

  // --- CATEGORIAS ---
  carregarCategorias() { this.api.getCategorias().subscribe(res => { this.categoriasDb = res; this.categoriasDisponiveis = res.map((c: any) => c.nome); }); }
  salvarNovaCategoria() { if(!this.novaCategoria) return; this.api.criarCategoria(this.novaCategoria).subscribe({next:()=>{this.toast.show('Categoria criada','success');this.novaCategoria='';this.carregarCategorias()},error:()=>this.toast.show('Erro','error')}); }
  iniciarEdicaoCategoria(c:any){this.categoriaEmEdicao={...c}}
  cancelarEdicaoCategoria(){this.categoriaEmEdicao=null}
  salvarEdicaoCategoria(){ if(!this.categoriaEmEdicao)return; this.api.atualizarCategoria(this.categoriaEmEdicao.id, this.categoriaEmEdicao.nome).subscribe({next:()=>{this.toast.show('Atualizado','success');this.categoriaEmEdicao=null;this.carregarCategorias();this.carregarItens()},error:()=>this.toast.show('Erro','error')}) }
  async deletarCategoria(id:number){if(await this.confirm.ask('Excluir?')) this.api.deletarCategoria(id).subscribe({next:()=>{this.toast.show('Excluído','info');this.carregarCategorias()},error:()=>this.toast.show('Em uso','error')})}

  // --- EXCEL ---
  onExcelSelected(event: any) {
    const file = event.target.files[0];
    if(file) {
      const fd = new FormData(); fd.append('arquivo', file);
      this.api.importarExcel(fd).subscribe({next:(res:any)=>{this.toast.show(res.msg,'success');this.carregarTudo();if(this.excelInput)this.excelInput.nativeElement.value=''},error:()=>this.toast.show('Erro','error')});
    }
  }
  baixarEstoqueExcel() { this.api.downloadItensExcel(); }
  baixarExcel() { this.api.downloadExcel(); }

  // --- USUÁRIOS ---
  carregarUsuarios() { this.api.getUsuarios().subscribe(res => this.usuarios = res); }
  cadastrarUsuario() {
    if (!this.novoUsuario.nome || !this.novoUsuario.matricula || !this.novoUsuario.senha) { this.toast.show('Preencha tudo', 'error'); return; }
    let emp = 'Kinross'; if (this.empresaSelecionada === 'Terceiro') { if (!this.nomeEmpresaTerceira) { this.toast.show('Empresa?','error'); return; } emp = this.nomeEmpresaTerceira; }
    this.novoUsuario.empresa = emp;
    this.api.criarUsuario(this.novoUsuario).subscribe({next:()=>{this.toast.show('Criado','success');this.carregarTudo();this.novoUsuario={nome:'',matricula:'',senha:'',tipo:'comum'};this.empresaSelecionada='Kinross'},error:()=>this.toast.show('Erro','error')});
  }
  iniciarEdicaoUsuario(u: any) { this.usuarioEmEdicao = { ...u, senha: '' }; if (u.empresa === 'Kinross') { this.empresaEdicaoSelecionada='Kinross'; } else { this.empresaEdicaoSelecionada='Terceiro'; this.nomeEmpresaEdicaoTerceira=u.empresa; } }
  cancelarEdicaoUsuario() { this.usuarioEmEdicao = null; }
  salvarEdicaoUsuario() {
    if(!this.usuarioEmEdicao) return;
    let emp = 'Kinross'; if (this.empresaEdicaoSelecionada === 'Terceiro') { if (!this.nomeEmpresaEdicaoTerceira) { this.toast.show('Empresa?','error'); return; } emp = this.nomeEmpresaEdicaoTerceira; }
    this.usuarioEmEdicao.empresa = emp;
    this.api.atualizarUsuario(this.usuarioEmEdicao.id, this.usuarioEmEdicao).subscribe({next:()=>{this.toast.show('Atualizado','success');this.usuarioEmEdicao=null;this.carregarTudo()},error:()=>this.toast.show('Erro','error')});
  }
  async deletarUsuario(id: number) { if(await this.confirm.ask('Remover?')) this.api.deletarUsuario(id).subscribe(() => { this.toast.show('Removido','info'); this.carregarTudo() }); }

  // --- UTILS ---
  toggleFiltro() { this.filtroAberto = !this.filtroAberto; }
  selecionarCategoria(cat: string) { this.filtroCategoria = cat; this.filtroAberto = false; }
  fecharFiltro() { this.filtroAberto = false; }
  get itensFiltrados() {
    let lista = this.itens;
    if (this.filtroCategoria !== 'Todas') lista = lista.filter(i => i.categoria === this.filtroCategoria);
    if (this.termoBusca) {
      const t = this.termoBusca.toLowerCase();
      lista = lista.filter(i => i.nome.toLowerCase().includes(t) || i.codigo_qr.toLowerCase().includes(t) || i.serial_number?.toLowerCase().includes(t) || i.part_number?.toLowerCase().includes(t));
    }
    return lista;
  }
  gerarUrlQr(c: string) { return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${c}`; }
  imprimirEtiqueta(item: any) { const win = window.open('','','width=400,height=400'); if(win){win.document.write(`<html><body style="text-align:center;padding:20px;font-family:sans-serif"><div style="border:3px solid black;padding:20px;border-radius:10px;display:inline-block"><img src="${this.gerarUrlQr(item.codigo_qr)}" width="150"><h2>${item.nome}</h2><p>${item.codigo_qr}</p><small>${item.categoria}</small></div><script>window.onload=()=>{window.print();window.close()}</script></body></html>`);win.document.close();} }
  carregarHistorico() { this.api.getHistorico().subscribe(res => this.historico = res); }
}