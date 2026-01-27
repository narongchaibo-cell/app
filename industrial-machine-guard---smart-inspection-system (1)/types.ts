
export enum MachineStatus {
  OPERATIONAL = 'ปกติ',
  MAINTENANCE = 'กำลังซ่อมบำรุง',
  CRITICAL = 'หยุดทำงาน/อันตราย',
  WARNING = 'ควรเฝ้าระวัง'
}

export enum ApprovalStatus {
  APPROVED = 'อนุมัติแล้ว',
  PENDING = 'รอการอนุมัติ'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum PersonnelRole {
  OPERATOR = 'พนักงาน/Operator',
  SUPERVISOR = 'หัวหน้ากะ/Supervisor',
  ENGINEER = 'วิศวกร/Engineer'
}

export enum NotificationPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum TaskStatus {
  PENDING = 'รอดำเนินการ',
  IN_PROGRESS = 'กำลังดำเนินการ',
  COMPLETED = 'เสร็จสิ้น'
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string; // 'ADMIN' หรือ specific User ID
  text: string;
  timestamp: string;
  read: boolean;
  attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  name: string;
  data: string; // Base64 data string
  type: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeName: string;
  targetDepartment?: string;
  priority: NotificationPriority;
  status: TaskStatus;
  progress?: number; // ความคืบหน้า 0-100
  progressNotes?: string; // หมายเหตุการดำเนินงาน
  createdAt: string;
  dueDate?: string; 
  completedAt?: string;
  deletedAt?: string;
  attachments?: TaskAttachment[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: string;
  read: boolean;
  category: 'machine' | 'system' | 'trash' | 'task' | 'chat';
  targetUserName?: string; 
  targetDepartment?: string; 
  senderId?: string;
  targetId?: string; // เพิ่มเพื่อระบุ ID ของสิ่งที่เกี่ยวข้อง (เช่น Task ID)
}

export interface Personnel {
  id: string;
  name: string; // Full name for display
  title?: string; // คำนำหน้า (นาย, นาง, นางสาว)
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: PersonnelRole;
  info: string; 
  avatarUrl?: string;
  deletedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  personnelRole?: PersonnelRole;
  avatarUrl?: string;
}

export interface ChecklistItemTemplate {
  id: string;
  label: string;
  type: 'boolean' | 'numeric';
  unit?: string;
}

export interface ChecklistSectionTemplate {
  id: string;
  title: string;
  items: ChecklistItemTemplate[];
}

export interface Machine {
  id: string;
  name: string;
  model: string;
  lastInspection: string;
  status: MachineStatus;
  location: string;
  efficiency: number;
  checklistTemplate: ChecklistSectionTemplate[];
  deletedAt?: string;
}

export interface InspectionRecord {
  id: string;
  machineId: string;
  inspectorName: string;
  operatorName: string;
  supervisorName: string;
  engineerName: string;
  operatorSignature?: string;
  supervisorSignature?: string;
  engineerSignature?: string;
  date: string;
  sections: ChecklistSectionTemplate[]; 
  overallStatus: MachineStatus;
  approvalStatus: ApprovalStatus;
  photoUrl?: string;
  notes?: string;
  values: Record<string, any>;
  deletedAt?: string; 
}
