// license-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LicenseService } from '../services/license.service';

export interface LicenseModule {
  id: number;
  module: string;
  numberOfUsers: number;
  startDate: string;
  endDate: string;
}

export interface LicenseHeader {
  tenantId: string;
  domain: string;
  customerName: string;
  isActive: boolean;
}

@Component({
  selector: 'app-license-detail',
  templateUrl: './license-detail.component.html',
  styleUrls: ['./license-detail.component.css']
})
export class LicenseDetailComponent implements OnInit {
  
  licenseId: number;
  isEditMode: boolean = false;
  isNewLicense: boolean = false;
  
  licenseHeader: LicenseHeader = {
    tenantId: '',
    domain: '',
    customerName: '',
    isActive: true
  };

  licenseModules: LicenseModule[] = [
    {
      id: 1,
      module: 'Merchandising',
      numberOfUsers: 2,
      startDate: '1-Jan-2025',
      endDate: '31-Jan-2025'
    },
    {
      id: 2,
      module: 'Inventory',
      numberOfUsers: 5,
      startDate: '1-Jan-2025',
      endDate: '31-Jan-2025'
    }
  ];

  originalLicenseData: any;
  availableModules: string[] = [
    'Merchandising',
    'Inventory',
    'Sales',
    'Purchasing',
    'Accounting',
    'HR Management',
    'Customer Management'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private licenseService: LicenseService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id'] === 'new') {
        this.isNewLicense = true;
        this.isEditMode = true;
        this.initializeNewLicense();
      } else {
        this.licenseId = +params['id'];
        this.isEditMode = params['action'] === 'edit';
        this.loadLicense();
      }
    });
  }

  initializeNewLicense() {
    this.licenseHeader = {
      tenantId: 'NEW',
      domain: '',
      customerName: '',
      isActive: true
    };
    this.licenseModules = [];
  }

  loadLicense() {
    this.licenseService.getLicense(this.licenseId).subscribe(
      data => {
        this.licenseHeader = data.header;
        this.licenseModules = data.modules;
        this.originalLicenseData = JSON.parse(JSON.stringify(data));
      },
      error => {
        console.error('Error loading license:', error);
      }
    );
  }

  onList() {
    this.router.navigate(['/licenses']);
  }

  onReset() {
    if (this.isNewLicense) {
      this.initializeNewLicense();
    } else if (this.originalLicenseData) {
      this.licenseHeader = JSON.parse(JSON.stringify(this.originalLicenseData.header));
      this.licenseModules = JSON.parse(JSON.stringify(this.originalLicenseData.modules));
    }
  }

  onSave() {
    const licenseData = {
      id: this.licenseId,
      header: this.licenseHeader,
      modules: this.licenseModules
    };

    this.licenseService.saveLicense(licenseData).subscribe(
      response => {
        console.log('License saved successfully:', response);
        // Show success message
        this.router.navigate(['/licenses']);
      },
      error => {
        console.error('Error saving license:', error);
        // Show error message
      }
    );
  }

  addModule() {
    const newId = Math.max(...this.licenseModules.map(m => m.id), 0) + 1;
    const newModule: LicenseModule = {
      id: newId,
      module: '',
      numberOfUsers: 1,
      startDate: this.formatDate(new Date()),
      endDate: this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) // 30 days from now
    };
    this.licenseModules.push(newModule);
  }

  removeModule(moduleId: number) {
    if (this.licenseModules.length > 1) {
      this.licenseModules = this.licenseModules.filter(m => m.id !== moduleId);
    }
  }

  onModuleChange(moduleId: number, field: string, value: any) {
    const module = this.licenseModules.find(m => m.id === moduleId);
    if (module) {
      (module as any)[field] = value;
    }
  }

  private formatDate(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  toggleActiveStatus() {
    this.licenseHeader.isActive = !this.licenseHeader.isActive;
  }

  isFormValid(): boolean {
    return this.licenseHeader.domain.trim() !== '' &&
           this.licenseHeader.customerName.trim() !== '' &&
           this.licenseModules.length > 0 &&
           this.licenseModules.every(m => m.module.trim() !== '' && m.numberOfUsers > 0);
  }

  canEdit(): boolean {
    return this.isEditMode || this.isNewLicense;
  }
}