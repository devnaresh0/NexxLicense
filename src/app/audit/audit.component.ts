import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuditService, LicenseAudit } from '../services/audit.service';
import { AuthService } from '../services/Auth.service';
import { LogoutService } from '../services/logout.service';

interface AuditData {
  serialNumber?: string;
  domain?: string;
  customerName?: string;
  active?: boolean;
  modules?: Array<{
    id: number;
    module: string;
    moduleId: number;
    moduleName: string;
    numberOfUsers: number;
    startDate: string;
    endDate: string;
  }>;
}

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.css']
})
export class AuditComponent implements OnInit {
  domain!: string;
  audits: LicenseAudit[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auditService: AuditService,
    private authService: AuthService,
    private logoutService: LogoutService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.domain = this.route.snapshot.paramMap.get('domain')!;
    this.loadAudits();
  }

  loadAudits(): void {
    this.auditService.getAuditsByDomain(this.domain).subscribe({
      next: (data: LicenseAudit[]) => {
        this.audits = data.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading audits:', err);
        this.error = 'Failed to load audit data';
        this.loading = false;
      }
    });
  }

  parseJson(json: string | null): AuditData {
    if (!json) return {};
    try {
      return JSON.parse(json);
    } catch (e) {
      console.warn('Failed to parse JSON:', e);
      return {};
    }
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'CREATE': return 'add_circle';
      case 'UPDATE': return 'edit';
      case 'DELETE': return 'delete';
      default: return 'history';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getModuleChanges(record: LicenseAudit): string {
    const newData = this.parseJson(record.newData);
    
    if (!newData.modules || !newData.modules.length) return 'No modules';
    
    return newData.modules
      .map((m: any) => `${m.moduleName} (${m.numberOfUsers} users)`)
      .join(', ');
  }

  async onLogout(): Promise<void> {
    try {
      const confirmed = await this.logoutService.showConfirmation();
      if (confirmed) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  onBack(): void {
    this.location.back();
  }

  onList(): void {
    this.router.navigate(['/licenses']);
  }

  onAudit(): void {
    // Already on audit page
  }

  onReset(): void {
    // Reset functionality if needed
  }

  canEdit(): boolean {
    return this.authService.hasEditAccess();
  }
}