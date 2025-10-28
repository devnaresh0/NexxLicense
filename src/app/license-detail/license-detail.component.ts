// license-detail.component.ts
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Subject, throwError } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { ActivatedRoute, Router } from "@angular/router";
import { LicenseService, ModuleResponse } from "../services/license.service";
import { LogoutService } from "../services/logout.service";
import { from } from "rxjs";
import { ErrorService } from "../services/error.service";

export interface LicenseModule {
  id: number;
  module: string;
  numberOfUsers: number;
  startDate: string;
  endDate: string;
}

export interface LicenseHeader {
  id?: number;
  serialNumber: number | null | string;
  domain: string;
  customerName: string;
  active: boolean;
}

@Component({
  selector: "app-license-detail",
  templateUrl: "./license-detail.component.html",
  styleUrls: ["./license-detail.component.css"],
})

export class LicenseDetailComponent implements OnInit, OnDestroy {

  licenseId: string;
  isEditMode: boolean = false;
  isNewLicense: boolean = false;
  licenseModules: LicenseModule[] = [];
  prevHeader: LicenseHeader;
  prevModules: LicenseModule[];
  originalLicenseData: any;
  availableModules: ModuleResponse[] = [];
  isSaving: boolean = false;

  private destroy$ = new Subject<void>();

  licenseHeader: LicenseHeader = {
    serialNumber: null,
    domain: "",
    customerName: "",
    active: true,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private licenseService: LicenseService,
    private errorService: ErrorService,
    private cdr: ChangeDetectorRef,
    private logoutService: LogoutService
  ) { }

  ngOnInit() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params["id"] === "new") {
          this.isNewLicense = true;
          this.isEditMode = true;
          this.initializeNewLicense();
        } else {
          this.licenseId = params["id"];
          this.isEditMode =
            this.route.snapshot.routeConfig &&
              this.route.snapshot.routeConfig.path &&
              this.route.snapshot.routeConfig.path.endsWith("edit")
              ? true
              : false;
          this.loadLicense();
        }
        this.loadModules();
      });
  }

  initializeNewLicense() {
    this.licenseHeader = {
      serialNumber: null,
      domain: "",
      customerName: "",
      active: true,
    };
    this.loadModules();
    this.licenseModules = [];
  }

  trackByModuleId(index: number, module: LicenseModule): number {
    return module.id;
  }

  loadModules() {
    this.licenseService.getModules()
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.availableModules = data;
        },
        (error) => {
          console.error("Error loading modules:", error);
        }
      );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLicense() {
    // First ensure modules are loaded
    this.licenseService.getModules()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((modules: ModuleResponse[]) => {
          this.availableModules = modules;
          // Now load the license details
          return this.licenseService.getLicenseDetails(this.licenseId);
        })
      )
      .subscribe({
        next: (data: any) => {
          console.log('License data loaded:', data);
          this.licenseHeader = { ...data.header };
          
          // Map the modules to ensure we have the correct module names
          this.licenseModules = (data.modules || []).map((module: any) => {
            // Find the full module details from availableModules
            const moduleDetails = this.availableModules.find(m => 
              (m as any).id === module.moduleId || m.moduleName === module.module
            );
            
            return {
              ...module,
              module: (moduleDetails && moduleDetails.moduleName) || module.module || '',
              // Ensure all required fields are present
              id: module.id || Math.floor(Math.random() * 10000),
              numberOfUsers: module.numberOfUsers || 1,
              startDate: module.startDate || this.formatDate(new Date()),
              endDate: module.endDate || this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
            };
          });
          
          this.originalLicenseData = JSON.parse(JSON.stringify(data));
          this.prevHeader = { ...this.licenseHeader };
          this.prevModules = this.licenseModules.map(m => ({ ...m }));
          
          // Force change detection to update the view
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading license:', error);
          this.errorService.showError('Failed to load license details', 'error');
        }
      });
  }

  onList() {
    this.router.navigate(["/licenses"]);
  }

  onAudit() {
    if (this.licenseHeader && this.licenseHeader.domain) {
      this.router.navigate(['/audit', this.licenseHeader.domain]);
    } else {
      console.error('No domain available for audit navigation');
    }
  }

  onReset() {
    if (this.isNewLicense) {
      this.initializeNewLicense();
    } else if (this.originalLicenseData) {
      this.licenseHeader = { ...this.prevHeader };

      this.licenseModules = this.prevModules.map((m) => ({ ...m }))
    }
  }

  onSave() {
    console.log('Saving license...', this.isSaving);
    if (this.isSaving) {
      return; // prevent duplicate clicks
    }
    this.isSaving = true;

    // Convert empty string to null for serialNumber
    const header = {
      ...this.licenseHeader,
      serialNumber: this.licenseHeader.serialNumber === '' ? null : this.licenseHeader.serialNumber
    };

    // Create a map of module names to their IDs for quick lookup
    const moduleNameToIdMap = new Map<string, number>();
    this.availableModules.forEach(module => {
      moduleNameToIdMap.set(module.moduleName, module.id);
    });

    // Map the license modules to include moduleId
    const modulesWithIds = this.licenseModules.map(module => {
      const moduleId = moduleNameToIdMap.get(module.module) || 0;
      return {
        ...module,
        moduleId: moduleId,
        moduleName: module.module
      };
    });

    // Create the base license data
    const baseLicenseData = {
      header: {
        ...header,
        id: this.licenseId,
      },
      modules: modulesWithIds,
    };

    // Get adminId from localStorage or use a default value
    const adminId = parseInt(localStorage.getItem('adminId') || '1', 10);

    // Create the final payload with additional fields
    const licenseData = {
      adminId: adminId,
      id: this.licenseId ? parseInt(this.licenseId, 10) : null,
      oldData: null,
      newData: JSON.stringify({
        ...baseLicenseData.header,
        modules: baseLicenseData.modules
      }),
      ...baseLicenseData // Keep the original structure for backward compatibility
    };

    const validation = this.licenseService.validateLicense(licenseData);
    console.log(JSON.stringify(licenseData));
    if (!validation.isValid) {
      // Show validation errors in a popup
      const errorMessage = validation.errors.join('\n');
      this.errorService.showError(errorMessage, 'error');
      return;
    }

    console.log('Saving license data:', licenseData);

    this.licenseService.saveLicense(licenseData).subscribe({
      next: (response) => {
        const message = response.message || 'License saved successfully';
        this.router.navigate(['/licenses']);
      },
      error: (error) => {
        console.error("Error saving license:", error);
      }
    });
    setTimeout(() => {
      this.isSaving = false;
    }, 2000);
  }

  addModule() {
    const newId = Math.max(...this.licenseModules.map((m) => +m.id), 0) + 1;
    const newModule: LicenseModule = {
      id: newId,
      module: "",
      numberOfUsers: 1,
      startDate: this.formatDate(new Date()),
      endDate: this.formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
    };
    this.licenseModules.push(newModule);
  }

  removeModule(moduleId: number) {
    if (this.licenseModules.length > 0) {
      this.licenseModules = this.licenseModules.filter(
        (m) => m.id !== moduleId
      );
    }
  }

  onModuleChange(moduleId: number, field: string, value: any) {
    const moduleIndex = this.licenseModules.findIndex(m => m.id === moduleId);
    if (moduleIndex > -1) {
      this.licenseModules[moduleIndex] = {
        ...this.licenseModules[moduleIndex],
        [field]: value
      };
    }
  }

  onDateChange(moduleId: number, field: 'startDate' | 'endDate', dateString: string) {
    // Convert the date string to ISO format
    const date = dateString ? new Date(dateString).toISOString() : '';
    this.onModuleChange(moduleId, field, date);
  }

  onHeaderFieldChange(field: string, value: any) {
    if (this.licenseHeader) {
      (this.licenseHeader as any)[field] = value;
    }
  }

  private formatDate(date: Date): string {
    const formatted = date.toISOString().split('T')[0];
    console.log(formatted)
    return formatted;
  }

  toggleActiveStatus() {
    this.licenseHeader.active = !this.licenseHeader.active;
  }

  isFormValid(): boolean {
    // Check if the data from api is fetched or not
    // Check header fields
    const isHeaderValid =
      this.licenseHeader.domain.trim() !== "" &&
      this.licenseHeader.customerName.trim() !== "";
    // Check if any module is invalid (empty name or invalid user count)
    const hasInvalidModule = this.licenseModules.some(
      (module) =>
        !module.module ||
        module.module.trim() === "" ||
        module.module === "Select Module" ||
        module.numberOfUsers <= 0
    );

    // Check if any modules exist
    const hasModules = this.licenseModules.length > -1;

    // For edit mode, check if anything changed
    if (this.isEditMode && !this.isNewLicense) {
      if (this.prevHeader === undefined) {
        return false;
      }
      // Check header changes including active status
      const headerChanged =
        this.licenseHeader.serialNumber !== this.prevHeader.serialNumber ||
        this.licenseHeader.domain.trim() !== this.prevHeader.domain.trim() ||
        this.licenseHeader.customerName.trim() !== this.prevHeader.customerName.trim() ||
        this.licenseHeader.active !== this.prevHeader.active;

      // Check if modules have changed by comparing their stringify version
      const currentModules = JSON.stringify(
        this.licenseModules.map((m) => ({
          module: m.module,
          numberOfUsers: m.numberOfUsers,
          startDate: m.startDate,
          endDate: m.endDate,
        }))
      );

      const previousModules = JSON.stringify(
        this.prevModules.map((m) => ({
          module: m.module,
          numberOfUsers: m.numberOfUsers,
          startDate: m.startDate,
          endDate: m.endDate,
        }))
      );
      const modulesChanged = currentModules !== previousModules;

      // Return true if either header or modules changed and form is valid
      return (
        (headerChanged || modulesChanged) &&
        isHeaderValid &&
        !hasInvalidModule &&
        hasModules
      );
    }
    // For new license, just check basic validation
    return isHeaderValid && !hasInvalidModule && hasModules;
  }

  canEdit(): boolean {
    return this.isEditMode || this.isNewLicense;
  }

  /**
   * Compares modules for the select element
   */
  compareModules(module1: any, module2: any): boolean {
    return module1 && module2 ? module1 === module2 : module1 === module2;
  }

  // Logout method
  async onLogout() {
    const confirmed = await this.logoutService.showConfirmation();
    if (confirmed) {
      localStorage.removeItem('adminId');
      localStorage.removeItem('username');
      this.router.navigate(['/login']);
    }
  }
}
