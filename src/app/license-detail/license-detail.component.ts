// license-detail.component.ts
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { LicenseService, ModuleResponse } from "../services/license.service";
import { from } from "rxjs";

export interface LicenseModule {
  id: number;
  module: string;
  numberOfUsers: number;
  startDate: string;
  endDate: string;
}

export interface LicenseHeader {
  id?: number;
  serialNumber: number;
  domain: string;
  customerName: string;
  active: boolean;
}

@Component({
  selector: "app-license-detail",
  templateUrl: "./license-detail.component.html",
  styleUrls: ["./license-detail.component.css"],
})

export class LicenseDetailComponent implements OnInit {

  licenseId: string;
  isEditMode: boolean = false;
  isNewLicense: boolean = false;
  licenseModules: LicenseModule[] = [];
  prevHeader: LicenseHeader;
  prevModules: LicenseModule[];
  originalLicenseData: any;
  availableModules: ModuleResponse[] = [];
  
  licenseHeader: LicenseHeader = {
    serialNumber: 0,
    domain: "",
    customerName: "",
    active: true,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private licenseService: LicenseService
  ) { }

  ngOnInit() {
    this.route.params.subscribe((params) => {
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

  loadModules() {
    this.licenseService.getModules().subscribe(
      (data) => {
        this.availableModules = data;
      },
      (error) => {
        console.error("Error loading modules:", error);
      }
    );
  }

  loadLicense() {
    this.licenseService.getLicenseDetails(this.licenseId).subscribe(
      (data) => {
        console.log(data)
        this.licenseHeader = { ...data.header };
        this.licenseModules = data.modules.map((m) => ({ ...m }))
        this.originalLicenseData = JSON.parse(JSON.stringify(data));
        this.prevHeader = { ...this.licenseHeader };
        this.prevModules = this.licenseModules.map((m) => ({ ...m }));
      },
      (error) => {
        console.error("Error loading license:", error);
      }
    );
  }

  onList() {
    this.router.navigate(["/licenses"]);
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
    // Create a map of module names to their IDs for quick lookup
    const moduleNameToIdMap = new Map<string, number>();
    this.availableModules.forEach(module => {
      moduleNameToIdMap.set(module.moduleName, module.id);
    });

    // Map the license modules to include moduleId
    const modulesWithIds = this.licenseModules.map(module => {
      // Find the module in availableModules to get its ID
      const moduleId = moduleNameToIdMap.get(module.module) || 0; // Default to 0 if not found
      return {
        ...module,
        moduleId: moduleId,  // Add the moduleId
        moduleName: module.module  // Keep the module name as moduleName for backward compatibility if needed
      };
    });

    const licenseData = {
      id: this.licenseId,
      header: {
        id: this.licenseId,
        serialNumber: this.licenseHeader.serialNumber,
        domain: this.licenseHeader.domain,
        customerName: this.licenseHeader.customerName,
        active: this.licenseHeader.active,
      },
      modules: modulesWithIds,
    };

    console.log('Saving license data:', licenseData);

    this.licenseService.saveLicense(licenseData).subscribe({
      next: (response) => {
        const message = response.message || 'License saved successfully';
        this.router.navigate(['/licenses'])
      },
      error: (error) =>   {
        console.error("Error saving license:", error);
      }
    });
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
    if (this.licenseModules.length > 1) {
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

    // Check header fields
    const isHeaderValid =
      this.licenseHeader.serialNumber > 0 &&
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
    const hasModules = this.licenseModules.length > 0;

    // For edit mode, check if anything changed
    if (this.isEditMode && !this.isNewLicense) {

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
}
