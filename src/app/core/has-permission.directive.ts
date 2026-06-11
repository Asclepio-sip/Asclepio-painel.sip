import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { PermissionService } from '../core/permission.service';
import { AuthService } from '../service/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Diretiva para mostrar/esconder elementos baseado em permissão
 * 
 * Uso:
 * <button *appHasPermission="'PRODUCT_CREATE'">Criar Produto</button>
 * <button *appHasPermission="['PRODUCT_UPDATE', 'PRODUCT_DELETE']; mode: 'any'">Editar/Deletar</button>
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
  private permissions: string[] = [];
  private mode: 'all' | 'any' = 'all';
  private destroy$ = new Subject<void>();

  @Input()
  set appHasPermission(permissions: string | string[]) {
    this.permissions = Array.isArray(permissions)
      ? permissions
      : [permissions];
    this.updateView();
  }

  @Input()
  set appHasPermissionMode(mode: 'all' | 'any') {
    this.mode = mode;
    this.updateView();
  }

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionService: PermissionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Monitora mudanças de autenticação
    // Se o projeto tiver um subject de logout, inscrever aqui
    this.updateView();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateView() {
    const hasPermission = this.mode === 'all'
      ? this.permissionService.hasAllPermissions(this.permissions)
      : this.permissionService.hasAnyPermission(this.permissions);

    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
