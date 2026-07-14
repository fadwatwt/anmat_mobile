import {
  LayoutDashboard,
  Users,
  User,
  FolderKanban,
  CheckSquare,
  Calendar,
  BarChart3,
  MessageSquare,
  Share2,
  Bot,
  Settings,
  Ticket,
  CreditCard,
  Briefcase,
  Building2,
  UserCheck,
  ClipboardList,
  FileText,
  DollarSign,
  Clock,
  BookOpen,
  Tag,
  Wallet,
  PercentCircle,
  ShieldCheck,
  KeyRound,
  Activity,
  RotateCw,
  Landmark,
  Banknote,
  UserCog,
  Eye,
} from 'lucide-react-native';

export type MenuItemType = {
  titleKey: string;
  route: string;
  icon: typeof LayoutDashboard;
  allowedTo: ('Admin' | 'Subscriber' | 'Employee')[];
  section?: string;
  children?: { titleKey: string; route: string }[];
};

export const menuItems: MenuItemType[] = [
  // ═══════════════════════════════════════════
  // Section: Overview (نظرة عامة)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Dashboard',
    route: 'Dashboard',
    icon: LayoutDashboard,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Overview',
  },

  // ═══════════════════════════════════════════
  // Section: Reports & Analytics (التقارير والتحليلات)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Analytics',
    route: 'Analytics',
    icon: BarChart3,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Reports & Analytics',
  },
  {
    titleKey: 'AI Analytics',
    route: 'AIAnalytics',
    icon: BarChart3,
    allowedTo: ['Admin', 'Subscriber'],
    section: 'Reports & Analytics',
  },

  // ═══════════════════════════════════════════
  // Section: Smart Tools (الأدوات الذكية)
  // ═══════════════════════════════════════════
  {
    titleKey: 'AI Assistant',
    route: 'AI',
    icon: Bot,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Smart Tools',
  },

  // ═══════════════════════════════════════════
  // Section: System (Admin only)
  // ═══════════════════════════════════════════
  {
    titleKey: 'System Admins',
    route: 'SystemAdmins',
    icon: UserCheck,
    allowedTo: ['Admin'],
    section: 'System',
  },
  {
    titleKey: 'Admin Roles',
    route: 'AdminRoles',
    icon: UserCog,
    allowedTo: ['Admin'],
    section: 'System',
  },
  {
    titleKey: 'Admin Permissions',
    route: 'AdminPermissions',
    icon: Eye,
    allowedTo: ['Admin'],
    section: 'System',
  },
  {
    titleKey: 'Industries',
    route: 'Industries',
    icon: Building2,
    allowedTo: ['Admin'],
    section: 'System',
  },
  {
    titleKey: 'Organizations',
    route: 'Organizations',
    icon: Building2,
    allowedTo: ['Admin'],
    section: 'System',
  },

  // ═══════════════════════════════════════════
  // Section: Subscribers & Plans (Admin only)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Subscribers',
    route: 'Subscribers',
    icon: Tag,
    allowedTo: ['Admin'],
    section: 'Subscribers & Plans',
  },
  {
    titleKey: 'Plans',
    route: 'Plans',
    icon: PercentCircle,
    allowedTo: ['Admin'],
    section: 'Subscribers & Plans',
  },

  // ═══════════════════════════════════════════
  // Section: Finance (Admin only)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Money Methods',
    route: 'MoneyMethods',
    icon: Wallet,
    allowedTo: ['Admin'],
    section: 'Finance',
  },
  {
    titleKey: 'Money Receiving',
    route: 'MoneyReceiving',
    icon: Landmark,
    allowedTo: ['Admin'],
    section: 'Finance',
  },

  // ═══════════════════════════════════════════
  // Section: Team Management (إدارة الفريق)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Human Resources',
    route: 'HR',
    icon: Users,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Team Management',
    children: [
      { titleKey: 'Employees', route: 'HR_Employees' },
      { titleKey: 'Departments', route: 'HR_Departments' },
      { titleKey: 'Teams', route: 'HR_Teams' },
      { titleKey: 'Positions', route: 'HR_Positions' },
      { titleKey: 'Meetings', route: 'HR_Meetings' },
      { titleKey: 'Holidays', route: 'HR_Holidays' },
      { titleKey: 'Attendance', route: 'HR_Attendances' },
      { titleKey: 'Leaves', route: 'HR_Leaves' },
      { titleKey: 'Employee Requests', route: 'HR_Requests' },
      { titleKey: 'Payroll', route: 'HR_Salary' },
      { titleKey: 'Shifts', route: 'Rotation' },
      { titleKey: 'Activity Logs', route: 'ActivityLogs' },
    ],
  },

  // ═══════════════════════════════════════════
  // Section: Work Management (إدارة العمل)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Tasks',
    route: 'Tasks',
    icon: CheckSquare,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Work Management',
  },
  {
    titleKey: 'Projects',
    route: 'Projects',
    icon: FolderKanban,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Work Management',
  },
  {
    titleKey: 'Agenda',
    route: 'Agenda',
    icon: BookOpen,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Work Management',
  },
  {
    titleKey: 'Appointments',
    route: 'Appointments',
    icon: Calendar,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Work Management',
  },

  // ═══════════════════════════════════════════
  // Section: My Work (Employee only)
  // ═══════════════════════════════════════════
  {
    titleKey: 'My Tasks',
    route: 'MyTasks',
    icon: CheckSquare,
    allowedTo: ['Employee'],
    section: 'My Work',
  },
  {
    titleKey: 'My Projects',
    route: 'MyProjects',
    icon: FolderKanban,
    allowedTo: ['Employee'],
    section: 'My Work',
  },
  {
    titleKey: 'Attendance',
    route: 'Attendance',
    icon: Calendar,
    allowedTo: ['Employee'],
    section: 'My Work',
  },
  {
    titleKey: 'Salary',
    route: 'Salary',
    icon: DollarSign,
    allowedTo: ['Employee'],
    section: 'My Work',
  },
  {
    titleKey: 'Short Leave Requests',
    route: 'Leaves',
    icon: Clock,
    allowedTo: ['Employee'],
    section: 'My Work',
  },
  {
    titleKey: 'Requests',
    route: 'Requests',
    icon: ClipboardList,
    allowedTo: ['Employee'],
    section: 'My Work',
  },

  // ═══════════════════════════════════════════
  // Section: Billing (Subscriber only)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Subscriptions',
    route: 'Subscriptions',
    icon: CreditCard,
    allowedTo: ['Subscriber'],
    section: 'Billing',
  },
  {
    titleKey: 'Templates',
    route: 'Templates',
    icon: FileText,
    allowedTo: ['Subscriber'],
    section: 'Billing',
  },
  {
    titleKey: 'Payment Methods',
    route: 'PaymentMethods',
    icon: Banknote,
    allowedTo: ['Subscriber'],
    section: 'Billing',
  },

  // ═══════════════════════════════════════════
  // Section: Internal Communication (التواصل الداخلي)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Conversations',
    route: 'Conversations',
    icon: MessageSquare,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Internal Communication',
  },

  // ═══════════════════════════════════════════
  // Section: Content Management (إدارة المحتوى)
  // ═══════════════════════════════════════════
  {
    titleKey: 'Social Media Management',
    route: 'SocialMedia',
    icon: Share2,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Content Management',
  },

  // ═══════════════════════════════════════════
  // Section: Support
  // ═══════════════════════════════════════════
  {
    titleKey: 'Support Tickets',
    route: 'SupportTickets',
    icon: Ticket,
    allowedTo: ['Admin', 'Subscriber'],
    section: 'Support',
  },

  // ═══════════════════════════════════════════
  // Section: Administration
  // ═══════════════════════════════════════════
  {
    titleKey: 'Roles',
    route: 'Roles',
    icon: ShieldCheck,
    allowedTo: ['Subscriber', 'Employee'],
    section: 'Administration',
  },
  {
    titleKey: 'Permissions',
    route: 'Permissions',
    icon: KeyRound,
    allowedTo: ['Admin', 'Subscriber'],
    section: 'Administration',
  },

  // ═══════════════════════════════════════════
  // Section: Settings & Profile
  // ═══════════════════════════════════════════
  {
    titleKey: 'Todo List',
    route: 'TodoList',
    icon: CheckSquare,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Settings',
  },
  {
    titleKey: 'Timeline',
    route: 'Timeline',
    icon: Clock,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Settings',
  },
  {
    titleKey: 'Profile',
    route: 'Profile',
    icon: User,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Settings',
  },
  {
    titleKey: 'Activity Logs',
    route: 'ActivityLogs',
    icon: Activity,
    allowedTo: ['Admin', 'Subscriber'],
    section: 'Settings',
  },
  {
    titleKey: 'Settings',
    route: 'Settings',
    icon: Settings,
    allowedTo: ['Admin', 'Subscriber', 'Employee'],
    section: 'Settings',
  },
];
