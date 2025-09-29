import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuditService } from '../services/audit.service';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.css']
})
export class AuditComponent implements OnInit {

  domain!: string;
  audits: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private auditService: AuditService
  ) {}

  ngOnInit(): void {
    this.domain = this.route.snapshot.paramMap.get('domain')!;
    this.loadAudits();
  }

  loadAudits(): void {
    this.auditService.getAuditsByDomain(this.domain).subscribe({
      next: (data) => {
        this.audits = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading audits:', err);
        this.error = 'Failed to load audit data';
        this.loading = false;
      }
    });
  }

  parseJson(json: string | null): any {
    try {
      return json ? JSON.parse(json) : {};
    } catch (e) {
      console.warn('Failed to parse JSON:', e);
      return {};
    }
  }
}