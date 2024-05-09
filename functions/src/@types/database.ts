import { FieldValue, GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { IUserType } from './enum';

export interface ICompaniesCollection {
  CompanyId: string;
  CompanyName: string;
  CompanyEmail: string;
  CompanyPhone: string;
  CompanyAddress: string;
  CompanyLogo: string;
  CompanyCreatedAt: Timestamp | FieldValue;
  CompanyModifiedAt: Timestamp | FieldValue;
}

export interface ICompanyBranchesCollection {
  CompanyBranchId: string;
  CompanyId: string;
  CompanyBranchName: string;
  CompanyBranchEmail: string;
  CompanyBranchPhone: string;
  CompanyBranchAddress: string;
  CompanyBranchCreatedAt: Timestamp | FieldValue;
  CompanyBranchModifiedAt: Timestamp | FieldValue;
}

export interface IEmployeeRolesCollection {
  EmployeeRoleId: string;
  EmployeeRoleCompanyId: string;
  EmployeeRoleName: string;
  EmployeeRoleIsDeletable: boolean;
  EmployeeRoleCreatedAt: Timestamp | FieldValue;
}

export interface IAdminsCollection {
  AdminId: string;
  AdminName: string;
  AdminEmail: string;
  AdminPhone: string;
  AdminCompanyId: string;
  AdminCreatedAt: Timestamp | FieldValue;
  AdminModifiedAt: Timestamp | FieldValue;
}

export interface IEmpLicenseDetails {
  LicenseType: 'driving' | 'security';
  LicenseNumber: string;
  LicenseExpDate: Timestamp | FieldValue;
  LicenseImg: string | null;
}
export interface IEmpBankDetails {
  BankAccNumber: string;
  BankTransitNumber: string;
  BankInstitutionNumber: string;
  BankVoidCheckImg: string;
}

export interface IEmpCertificatesDetails {
  CertificateName: string;
  CertificateDoc: string;
}

export interface IEmployeesCollection {
  EmployeeId: string;
  EmployeeName: string;
  EmployeeNameSearchIndex: string[];
  EmployeePhone: string;
  EmployeeEmail: string;
  EmployeePassword: string;
  EmployeeImg: string | null;
  EmployeeRole: string;
  EmployeePayRate: number;
  EmployeeMaxHrsPerWeek: number;
  EmployeeIsAvailable: 'available' | 'out_of_reach' | 'on_vacation';
  EmployeeSupervisorId: string[] | null;
  EmployeeIsBanned: boolean;
  EmployeeCompanyId: string;
  EmployeeCompanyBranchId?: string | null;
  EmployeeLicenses: IEmpLicenseDetails[];
  EmployeeBankDetails: IEmpBankDetails | null;
  EmployeeSinNumber: string | null;
  EmployeeCertificates: IEmpCertificatesDetails[];
  EmployeeAddress?: string | null;
  EmployeePostalCode?: string | null;
  EmployeeCity?: string | null;
  EmployeeProvince?: string | null;
  EmployeeCreatedAt: Timestamp | FieldValue;
  EmployeeModifiedAt: Timestamp | FieldValue;
}

export interface IShiftTasksChild {
  ShiftTaskId: string;
  ShiftTask: string;
  ShiftTaskQrCodeReq: boolean;
  ShiftTaskReturnReq: boolean;
  ShiftTaskStatus: {
    TaskStatus: 'pending' | 'completed';
    TaskCompletedById?: string;
    TaskCompletedByName?: string;
    TaskCompletionTime?: Timestamp | FieldValue;
    TaskFailureReason?: string;
    TaskPhotos?: string[];
  }[];
}

export interface IShiftsCollection {
  ShiftId: string;
  ShiftName: string;
  ShiftPosition: string;
  ShiftDate: Timestamp | FieldValue;
  ShiftStartTime: string;
  ShiftEndTime: string;
  ShiftLocation: GeoPoint | null; //* Null for mobile guard
  ShiftLocationId: string | null; //* Null for mobile guard
  ShiftLocationName: string | null; //* Null for mobile guard
  ShiftLocationAddress: string | null; //* Null for mobile guard
  ShiftRestrictedRadius: number | null;
  ShiftEnableRestrictedRadius: boolean;
  ShiftDescription: string | null;
  ShiftAssignedUserId: string[];
  ShiftClientId: string | null; //* Null for mobile guard
  ShiftCompanyId: string;
  ShiftRequiredEmp: number; //* By default 1
  ShiftCompanyBranchId?: string | null;
  ShiftAcknowledgedByEmpId: string[];
  ShiftTask: IShiftTasksChild[];
  ShiftGuardWellnessReport: {
    WellnessEmpId: string;
    WellnessEmpName: string;
    WellnessReportedAt: Timestamp | FieldValue;
    WellnessComment?: string | null;
    WellnessImg?: string | null;
  }[];
  ShiftPhotos?: string[];
  ShiftPhotoUploadIntervalInMinutes?: number | null;
  ShiftCurrentStatus: {
    Status: 'pending' | 'started' | 'completed';
    StatusReportedById?: string;
    StatusReportedByName?: string;
    StatusReportedTime?: Timestamp | FieldValue;
    StatusShiftTotalHrs?: number;
  }[];
  ShiftLinkedPatrolIds: string[];
  ShiftIsSpecialShift: boolean;
  ShiftCreatedAt: Timestamp | FieldValue;
  ShiftModifiedAt: Timestamp | FieldValue;
}

export interface IPatrolCheckPointsChild {
  CheckPointId: string;
  CheckPointName: string;
  CheckPointCategory: string | null;
  CheckPointHint: string | null;
  CheckPointStatus: {
    Status: 'checked' | 'not_checked';
    StatusReportedById?: string;
    StatusReportedByName?: string;
    StatusReportedTime?: Timestamp | FieldValue;
    StatusFailureReason?: string;
    StatusComment?: string | null;
    StatusImage?: string[];
  }[];
}

export interface IPatrolsCollection {
  PatrolId: string;
  PatrolCompanyId: string;
  PatrolName: string;
  PatrolNameSearchIndex: string[];
  PatrolLocation: GeoPoint;
  PatrolLocationId: string;
  PatrolLocationName: string;
  PatrolRequiredCount: number;
  PatrolCheckPoints: IPatrolCheckPointsChild[];
  PatrolCurrentStatus: {
    Status: 'pending' | 'started' | 'completed';
    StatusCompletedCount: number;
    StatusReportedById?: string;
    StatusReportedByName?: string;
    StatusReportedTime?: Timestamp | FieldValue;
  }[];
  PatrolFailureReason?: string;
  PatrolClientId?: string | null;
  PatrolRestrictedRadius: number | null;
  PatrolKeepGuardInRadiusOfLocation: boolean;
  PatrolReminderInMinutes: number;
  PatrolCreatedAt: Timestamp | FieldValue;
  PatrolModifiedAt: Timestamp | FieldValue;
}

export interface IReportCategoriesCollection {
  ReportCategoryId: string;
  ReportCompanyId: string;
  ReportCategoryName: string;
  ReportCategoryCreatedAt: Timestamp | FieldValue;
}

export interface IReportsCollection {
  ReportId: string;
  ReportCompanyId: string;
  ReportCompanyBranchId?: string;
  ReportEmployeeId: string;
  ReportEmployeeName: string;
  ReportName: string;
  ReportCategoryName: string;
  ReportCategoryId: string;
  ReportData: string;
  ReportShiftId?: string;
  ReportPatrolId?: string;
  ReportImage?: string[];
  ReportVideo?: string[];
  ReportStatus: 'pending' | 'started' | 'completed';
  ReportCreatedAt: Timestamp | FieldValue;
}

export interface IDocumentCategories {
  DocumentCategoryId: string;
  DocumentCategoryCompanyId: string;
  DocumentCategoryName: string;
  DocumentCategoryCreatedAt: Timestamp | FieldValue;
}

export interface IDocumentsCollection {
  DocumentId: string;
  DocumentName: string;
  DocumentNameSearchIndex: string[];
  DocumentCompanyId: string;
  DocumentCategoryName: string;
  DocumentCategoryId: string;
  DocumentUrl: string;
  DocumentCreatedAt: Timestamp | FieldValue;
  DocumentModifiedAt: Timestamp | FieldValue;
}

export interface INotificationsCollection {
  NotificationId: string;
  NotificationCompanyId: string;
  NotificationBranchId?: string;
  NotificationCreatedBy: 'admin' | 'employee';
  NotificationCreatorId: string;
  NotificationTitle: string;
  NotificationData: string;
  NotificationCreatedAt: Timestamp | FieldValue;
}

export interface ILocationsCollection {
  LocationId: string;
  LocationCompanyId: string;
  LocationName: string;
  LocationSearchIndex: string[];
  LocationAddress: string;
  LocationCoordinates: GeoPoint;
  LocationCreatedAt: Timestamp | FieldValue;
}

export interface ILoggedInUsersCollection {
  LoggedInId: string;
  LoggedInUserId: string;
  IsLoggedIn: boolean;
  LoggedInCrypt: string;
  LoggedInUserType: IUserType;
  LoggedInCreatedAt: Timestamp | FieldValue;
}

export interface IInvoiceItems {
  ItemDescription: string;
  ItemQuantity: number;
  ItemPrice: number;
  ItemTotal: number;
}

export interface IInvoiceTaxList {
  TaxName: string;
  TaxAmount: number;
}
export interface IInvoicesCollection {
  InvoiceId: string;
  InvoiceCompanyId: string;
  InvoiceClientId: string;
  InvoiceClientName: string;
  InvoiceClientPhone: string;
  InvoiceClientAddress: string | null;
  InvoiceNumber: string;
  InvoiceDate: Timestamp | FieldValue;
  InvoiceDueDate: Timestamp | FieldValue;
  InvoiceItems: IInvoiceItems[];
  InvoiceSubtotal: number;
  InvoiceTaxList: IInvoiceTaxList[];
  InvoiceReceivedAmount: number;
  InvoiceTotalAmount: number;
  InvoiceDescription?: string | null;
  InvoiceTerms?: string | null;
  InvoiceCreatedAt: Timestamp | FieldValue;
  InvoiceModifiedAt: Timestamp | FieldValue;
}

export interface IClientsCollection {
  ClientId: string;
  ClientCompanyId: string;
  ClientName: string;
  ClientPhone: string;
  ClientNameSearchIndex: string[];
  ClientEmail: string; //* This will be used for client portal login
  ClientPassword: string; //* This will be used for client portal login
  ClientAddress: string | null;
  ClientContractStartDate: Timestamp | FieldValue;
  ClientContractEndDate: Timestamp | FieldValue;
  ClientContractAmount: number;
  ClientHourlyRate: number;
  ClientBalance: number;
  ClientCreatedAt: Timestamp | FieldValue;
  ClientModifiedAt: Timestamp | FieldValue;
}

export interface ISettingsCollection {
  SettingId: string;
  SettingCompanyId: string;
  SettingEmpWellnessIntervalInMins: number;
}

export interface IEquipmentsCollection {
  EquipmentId: string;
  EquipmentCompanyId: string;
  EquipmentCompanyBranchId: string | null;
  EquipmentName: string;
  EquipmentNameSearchIndex: string[];
  EquipmentDescription: string | null;
  EquipmentAllotedQuantity: number;
  EquipmentTotalQuantity: number;
  EquipmentCreatedAt: Timestamp | FieldValue;
  EquipmentModifiedAt: Timestamp | FieldValue;
}

export interface IEquipmentAllocations {
  EquipmentAllocationId: string;
  EquipmentAllocationEquipId: string;
  EquipmentAllocationEquipQty: number;
  EquipmentAllocationDate: Timestamp | FieldValue;
  EquipmentAllocationEmpId: string;
  EquipmentAllocationEmpName: string;
  EquipmentAllocationStartDate: Timestamp | FieldValue;
  EquipmentAllocationEndDate: Timestamp | FieldValue;
  EquipmentAllocationIsReturned: boolean;
  EquipmentAllocationCreatedAt: Timestamp | FieldValue;
}

//* SuperAdmin
export interface ISuperAdminCollection {
  SuperAdminId: string;
  SuperAdminEmail: string;
  SuperAdminName: string;
  SuperAdminPhone: string;
}
