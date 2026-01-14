import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  login(dados: any): Observable<any> { return this.http.post(`${this.apiUrl}/login`, dados); }
  getItens(): Observable<any> { return this.http.get(`${this.apiUrl}/itens`); }
  buscarItemPorCodigo(c: string): Observable<any> { return this.http.get(`${this.apiUrl}/itens/codigo/${c}`); }

  // ITENS (Com novos campos)
  criarItemComFoto(fd: FormData): Observable<any> { return this.http.post(`${this.apiUrl}/itens`, fd); }
  
atualizarItem(id: number, formData: FormData): Observable<any> {
  return this.http.put(`${this.apiUrl}/itens/${id}`, formData);
}

  deletarItem(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/itens/${id}`); }
  importarExcel(fd: FormData): Observable<any> { return this.http.post(`${this.apiUrl}/importar`, fd); }

  // MOVIMENTAÇÃO
  movimentar(d: any): Observable<any> { return this.http.post(`${this.apiUrl}/movimentar`, d); }
  getHistorico(): Observable<any> { return this.http.get(`${this.apiUrl}/historico`); }
  getDashboardStats(): Observable<any> { return this.http.get(`${this.apiUrl}/dashboard-stats`); }
  downloadExcel() { window.open(`${this.apiUrl}/exportar`, '_blank'); }
  downloadItensExcel() { window.open(`${this.apiUrl}/exportar-itens`, '_blank'); }

  // USUÁRIOS (Com empresa)
  getUsuarios(): Observable<any> { return this.http.get(`${this.apiUrl}/usuarios`); }
  criarUsuario(u: any): Observable<any> { return this.http.post(`${this.apiUrl}/usuarios`, u); }
  atualizarUsuario(id: number, u: any): Observable<any> { return this.http.put(`${this.apiUrl}/usuarios/${id}`, u); }
  deletarUsuario(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/usuarios/${id}`); }
  getCategorias(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categorias`);
  }

  criarCategoria(nome: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/categorias`, { nome });
  }

  atualizarCategoria(id: number, nome: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/categorias/${id}`, { nome });
  }

  deletarCategoria(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categorias/${id}`);
  }
}
