// license-detail.component.ts
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { LicenseService } from "../services/license.service";
import { from } from "rxjs";

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
  selector: "app-license-detail",
  templateUrl: "./license-detail.component.html",
  styleUrls: ["./license-detail.component.css"],
})
export class LicenseDetailComponent implements OnInit {
  licenseId: string;
  isEditMode: boolean = false;
  isNewLicense: boolean = false;

  licenseHeader: LicenseHeader = {
    tenantId: "",
    domain: "",
    customerName: "",
    isActive: true,
  };

  licenseModules: LicenseModule[] = [];

  prevHeader: LicenseHeader;
  prevModules: LicenseModule[];

  originalLicenseData: any;
  availableModules: string[] = [
    "Merchandising",
    "Inventory",
    "Sales",
    "Purchasing",
    "Accounting",
    "HR Management",
    "Customer Management",
  ];

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
        // this.isEditMode = params['action'] === 'edit';
        this.isEditMode =
          this.route.snapshot.routeConfig &&
            this.route.snapshot.routeConfig.path &&
            this.route.snapshot.routeConfig.path.endsWith("edit")
            ? true
            : false;
        this.loadLicense();
        this.prevHeader = { ...this.licenseHeader };
        this.prevModules = this.licenseModules.map((m) => ({ ...m }));
        console.log(this.isEditMode, "isEditMode");
        console.log(this.isNewLicense, "isNewLicense");
      }
    });
  }

  initializeNewLicense() {
    this.licenseHeader = {
      tenantId: "",
      domain: "",
      customerName: "",
      isActive: true,
    };
    this.licenseModules = [];
  }

  loadLicense() {
    this.licenseService.getLicenseDetails(this.licenseId).subscribe(
      (data) => {
        console.log(data.header)
        console.log(data.modules)
        this.licenseHeader = { ...data.header };
        this.licenseModules = data.modules.map((m) => ({ ...m }))
        // Parse dates for each module
        // this.licenseModules = data.modules.map((module) => {
        //   const startDate = this.parseDate(module.startDate);
        //   const endDate = this.parseDate(module.endDate);
        //   return {
        //     ...module,
        //     startDate: startDate ? startDate.toISOString() : module.startDate,
        //     endDate: endDate ? endDate.toISOString() : module.endDate,
        //   };
        // });
        this.originalLicenseData = JSON.parse(JSON.stringify(data));
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
      this.licenseHeader = JSON.parse(
        JSON.stringify(this.originalLicenseData.header)
      );
      this.licenseModules = JSON.parse(
        JSON.stringify(this.originalLicenseData.modules)
      );
    }
  }

  onSave() {
    this.licenseHeader = this.prevHeader;
    this.licenseModules = this.prevModules;
    const licenseData = {
      id: this.licenseId,
      header: this.licenseHeader,
      modules: this.licenseModules,
    };

    this.licenseService.saveLicense(licenseData).subscribe(
      (response) => {
        console.log("License saved successfully:", response);
        // Show success message
        this.isEditMode = false;
        console.log(this.isEditMode, "isEditMode");
        this.router.navigate(["/licenses"]);
      },
      (error) => {
        console.error("Error saving license:", error);
        // Show error message
      }
    );
  }

  addModule() {
    const newId = Math.max(...this.licenseModules.map((m) => m.id), 0) + 1;
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
    const module = this.prevModules.find((m) => m.id === moduleId);
    console.log(value);
    if (module) {
      (module as any)[field] = value;
    }
  }

  onHeaderFieldChange(field: string, value: any) {
    if (this.prevHeader) {
      (this.prevHeader as any)[field] = value;
    }
  }

  parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try parsing as DD-MM-YYYY format
    let parts = dateStr.split('-');
    if (parts.length === 3) {
      // Check if it's in DD-MM-YYYY format
      if (parts[0].length === 2 && parts[1].length === 2) {
        const [d, m, y] = parts.map(Number);
        if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
          return new Date(y, m - 1, d);
        }
      }
      // Try parsing as D-MMM-YYYY format (e.g., 1-Jan-2025)
      else if (parts[1].length === 3) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthIndex = monthNames.findIndex(m => m.toLowerCase() === parts[1].toLowerCase().substring(0, 3));
        if (monthIndex !== -1) {
          const day = parseInt(parts[0], 10);
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(year)) {
            return new Date(year, monthIndex, day);
          }
        }
      }
    }

    // If we get here, try parsing with the Date constructor as a fallback
    const parsedDate = new Date(dateStr);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  private formatDate(date: Date): string {
    const day = date.getDate();
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  toggleActiveStatus() {
    this.licenseHeader.isActive = !this.licenseHeader.isActive;
  }

  isFormValid(): boolean {
    console.log("form");
    // Check header fields
    const isHeaderValid =
      this.licenseHeader.tenantId.trim() !== "" &&
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
        this.licenseHeader.tenantId.trim() !==
        this.prevHeader.tenantId.trim() ||
        this.licenseHeader.domain.trim() !== this.prevHeader.domain.trim() ||
        this.licenseHeader.customerName.trim() !==
        this.prevHeader.customerName.trim() ||
        this.licenseHeader.isActive !== this.prevHeader.isActive;

      // Check if modules have changed by comparing their JSON representation
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
