import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { AdminComponent } from './admin/admin.component';
import { MovimentacaoComponent } from './movimentacao/movimentacao.component';
import { authGuard } from './guards/auth.guard'; // Importe

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] }, // PROTEGIDO
  { path: 'movimentacao', component: MovimentacaoComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' }
];